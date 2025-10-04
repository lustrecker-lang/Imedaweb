
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase, useStorage } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';

const sectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required.'),
  content: z.string().min(1, 'Content is required.'),
  imageUrl: z.string().optional(),
});

const pageSchema = z.object({
  id: z.string(),
  title: z.string(),
  sections: z.array(sectionSchema),
});

type Page = z.infer<typeof pageSchema>;
type Section = z.infer<typeof sectionSchema>;

function SectionForm({ page, section, onSectionUpdate }: { page: Page; section: Section; onSectionUpdate: (updatedSection: Section, imageFile: File | null) => void }) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const form = useForm<Section>({
    resolver: zodResolver(sectionSchema),
    defaultValues: section,
  });

  useEffect(() => {
    form.reset(section);
  }, [section, form]);

  const onSubmit = (values: Section) => {
    onSectionUpdate(values, imageFile);
    setImageFile(null);
    const fileInput = document.getElementById(`file-input-${section.id}`) as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  };
  
  const isHeroSection = section.id === 'hero';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea {...field} className="min-h-[120px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isHeroSection ? 'Background Media' : 'Image'}</FormLabel>
                {section.imageUrl && !imageFile && (
                  <div className="my-2">
                    {section.imageUrl.includes('video') ? (
                      <video src={section.imageUrl} width="100" className="object-contain rounded-md border" controls />
                    ) : (
                      <Image src={section.imageUrl} alt="Current Image" width={100} height={100} className="object-contain rounded-md border" />
                    )}
                  </div>
                )}
                <FormControl>
                    <Input 
                        id={`file-input-${section.id}`}
                        type="file" 
                        accept={isHeroSection ? "image/*,video/*" : "image/svg+xml, image/png, image/jpeg, image/webp, image/gif"}
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                setImageFile(e.target.files[0]);
                                field.onChange(e.target.files[0].name); 
                            }
                        }}
                    />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
        />
        <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : `Save Section`}
        </Button>
      </form>
    </Form>
  );
}

export default function PageEditor() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const params = useParams();
  const pageId = params.pageId as string;

  const pageRef = useMemoFirebase(() => {
    if (!firestore || !pageId) return null;
    return doc(firestore, 'pages', pageId);
  }, [firestore, pageId]);

  const { data: page, isLoading: isPageLoading } = useDoc<Page>(pageRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleFileUpload = async (file: File | null): Promise<string | null> => {
    if (!file || !storage || !user) return null;

    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storageRef = ref(storage, `page-assets/${fileName}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Could not upload the file. Please try again.",
      });
      return null;
    }
  };

  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  const handleSectionUpdate = async (updatedSectionData: Section, imageFile: File | null) => {
    if (!firestore || !page) return;

    let finalSectionData = { ...updatedSectionData };

    if (imageFile) {
        const imageUrl = await handleFileUpload(imageFile);
        if (!imageUrl) return; // Stop if upload failed
        finalSectionData.imageUrl = imageUrl;
    }
    
    const updatedSections = page.sections.map(s => s.id === finalSectionData.id ? finalSectionData : s);
    
    const docRef = doc(firestore, 'pages', page.id);
    const dataToSave = { ...page, sections: updatedSections };

    setDocumentNonBlocking(docRef, dataToSave, { merge: true });

    toast({
      title: 'Success!',
      description: `Content for section "${finalSectionData.title}" has been updated.`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <header className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/admin/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Link>
        </Button>
        {isPageLoading ? (
            <Skeleton className="h-8 w-1/3" />
        ) : (
            <h1 className="text-xl font-bold tracking-tight">Editing: {page?.title}</h1>
        )}
        <p className="text-sm text-muted-foreground">Manage this page's content sections.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Content Sections</CardTitle>
          <CardDescription>
            Click on a section to expand it and edit its content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        {isPageLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        ) : page ? (
            <Accordion type="multiple" defaultValue={page.sections.map(s => s.id)} className="w-full">
              {page.sections.map(section => (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionTrigger className="text-base font-medium">{section.title} Section</AccordionTrigger>
                  <AccordionContent className="p-4 bg-muted/40 rounded-md border">
                    <SectionForm 
                      page={page}
                      section={section}
                      onSectionUpdate={handleSectionUpdate}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
             <p className="text-sm text-muted-foreground">Could not load page data. It might not exist.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

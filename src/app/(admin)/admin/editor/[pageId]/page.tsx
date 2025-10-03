'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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

const sectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required.'),
  content: z.string().min(1, 'Content is required.'),
});

const pageSchema = z.object({
  id: z.string(),
  title: z.string(),
  sections: z.array(sectionSchema),
});

type Page = z.infer<typeof pageSchema>;
type Section = z.infer<typeof sectionSchema>;

function SectionForm({ page, section, onSectionUpdate }: { page: Page; section: Section; onSectionUpdate: (updatedSection: Section) => void }) {
  const form = useForm<Section>({
    resolver: zodResolver(sectionSchema),
    defaultValues: section,
  });

  useEffect(() => {
    form.reset(section);
  }, [section, form]);

  const onSubmit = (values: Section) => {
    onSectionUpdate(values);
  };

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
        <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : `Save Section`}
        </Button>
      </form>
    </Form>
  );
}

export default function PageEditor({ params }: { params: { pageId: string } }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { pageId } = params;

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


  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  const handleSectionUpdate = (updatedSection: Section) => {
    if (!firestore || !page) return;
    
    const updatedSections = page.sections.map(s => s.id === updatedSection.id ? updatedSection : s);
    
    const docRef = doc(firestore, 'pages', page.id);
    const dataToSave = { ...page, sections: updatedSections };

    setDocumentNonBlocking(docRef, dataToSave, { merge: true });

    toast({
      title: 'Success!',
      description: `Content for section "${updatedSection.title}" has been updated.`,
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

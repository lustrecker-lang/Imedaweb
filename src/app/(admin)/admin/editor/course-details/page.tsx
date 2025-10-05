
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase, useStorage } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';

const faqSchema = z.object({
  id: z.string(),
  question: z.string().min(1, 'Question is required.'),
  answer: z.string().min(1, 'Answer is required.'),
});

const pageSchema = z.object({
  valeurImeda: z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    imageUrl: z.string().optional(),
  }),
  faq: z.array(faqSchema),
  contact: z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    francePhone: z.string().optional(),
    uaePhone: z.string().optional(),
    email: z.string().email().optional(),
    imageUrl: z.string().optional(),
  }),
});

type Page = z.infer<typeof pageSchema>;

export default function CourseDetailsEditor() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [valeurImedaFile, setValeurImedaFile] = useState<File | null>(null);
  const [contactFile, setContactFile] = useState<File | null>(null);

  const pageRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'courseDetailPage', 'main');
  }, [firestore]);

  const { data: page, isLoading: isPageLoading } = useDoc<Page>(pageRef);

  const form = useForm<Page>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      valeurImeda: { title: '', content: '', imageUrl: '' },
      faq: [],
      contact: { name: '', title: '', description: '', francePhone: '', uaePhone: '', email: '', imageUrl: '' },
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "faq",
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (page) {
      form.reset(page);
    }
  }, [page, form]);

  const handleFileUpload = async (file: File | null): Promise<string | null> => {
    if (!file || !storage || !user) return null;
    const fileName = `${uuidv4()}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `course-details-assets/${fileName}`);
    try {
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("File upload error:", error);
      toast({ variant: "destructive", title: "Upload Failed" });
      return null;
    }
  };

  const onSubmit = async (values: Page) => {
    if (!firestore) return;

    let valeurImedaUrl = values.valeurImeda.imageUrl;
    if (valeurImedaFile) {
        valeurImedaUrl = await handleFileUpload(valeurImedaFile) || valeurImedaUrl;
    }

    let contactUrl = values.contact.imageUrl;
    if (contactFile) {
        contactUrl = await handleFileUpload(contactFile) || contactUrl;
    }

    const dataToSave = {
      ...values,
      valeurImeda: { ...values.valeurImeda, imageUrl: valeurImedaUrl },
      contact: { ...values.contact, imageUrl: contactUrl },
    };

    setDocumentNonBlocking(pageRef!, dataToSave, { merge: true });
    toast({ title: 'Success!', description: 'Course details page content updated.' });
    setValeurImedaFile(null);
    setContactFile(null);
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
        <h1 className="text-xl font-bold tracking-tight">Editing: Course Details Page</h1>
        <p className="text-sm text-muted-foreground">Manage this page's content sections.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Content Sections</CardTitle>
          <CardDescription>Click on a section to expand it and edit its content.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isPageLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Accordion type="multiple" defaultValue={['valeur', 'faq', 'contact']} className="w-full">
                  
                  <AccordionItem value="valeur">
                    <AccordionTrigger className="text-base font-medium">Valeur IMEDA</AccordionTrigger>
                    <AccordionContent className="space-y-4 p-4">
                        <FormField control={form.control} name="valeurImeda.title" render={({ field }) => (
                            <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="valeurImeda.content" render={({ field }) => (
                            <FormItem><FormLabel>Content</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="valeurImeda.imageUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Image</FormLabel>
                                {form.watch('valeurImeda.imageUrl') && <Image src={form.watch('valeurImeda.imageUrl')!} alt="Valeur IMEDA" width={100} height={100} />}
                                <FormControl><Input type="file" onChange={(e) => setValeurImedaFile(e.target.files?.[0] || null)} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq">
                    <AccordionTrigger className="text-base font-medium">FAQ</AccordionTrigger>
                    <AccordionContent className="space-y-4 p-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-md space-y-2 relative">
                                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 h-6 w-6"><Trash2 className="h-4 w-4" /></Button>
                                <FormField control={form.control} name={`faq.${index}.question`} render={({ field }) => (
                                    <FormItem><FormLabel>Question</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name={`faq.${index}.answer`} render={({ field }) => (
                                    <FormItem><FormLabel>Answer</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ id: uuidv4(), question: '', answer: '' })}><Plus className="mr-2 h-4 w-4" /> Add FAQ</Button>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="contact">
                    <AccordionTrigger className="text-base font-medium">Contact Us</AccordionTrigger>
                    <AccordionContent className="space-y-4 p-4">
                         <FormField control={form.control} name="contact.name" render={({ field }) => ( <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                         <FormField control={form.control} name="contact.title" render={({ field }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                         <FormField control={form.control} name="contact.description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                         <FormField control={form.control} name="contact.francePhone" render={({ field }) => ( <FormItem><FormLabel>France Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                         <FormField control={form.control} name="contact.uaePhone" render={({ field }) => ( <FormItem><FormLabel>UAE Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                         <FormField control={form.control} name="contact.email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                         <FormField control={form.control} name="contact.imageUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Image</FormLabel>
                                {form.watch('contact.imageUrl') && <Image src={form.watch('contact.imageUrl')!} alt="Contact" width={100} height={100} />}
                                <FormControl><Input type="file" onChange={(e) => setContactFile(e.target.files?.[0] || null)} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </AccordionContent>
                  </AccordionItem>

                </Accordion>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving...' : 'Save All Changes'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
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
  CardFooter,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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

function SectionForm({ pageId, section, onSectionUpdate }: { pageId: string; section: Section; onSectionUpdate: (pageId: string, section: Section) => void }) {
  const form = useForm<Section>({
    resolver: zodResolver(sectionSchema),
    defaultValues: section,
  });

  useEffect(() => {
    form.reset(section);
  }, [section, form]);

  const onSubmit = (values: Section) => {
    onSectionUpdate(pageId, values);
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

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const pagesRef = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'pages');
  }, [firestore]);

  const { data: pages, isLoading: arePagesLoading } = useCollection<Page>(pagesRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (pages && pages.length > 0 && !selectedPageId) {
      setSelectedPageId(pages[0].id);
    }
  }, [pages, selectedPageId]);

  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  const handleSectionUpdate = (pageId: string, updatedSection: Section) => {
    if (!firestore || !pages) return;
    
    const pageToUpdate = pages.find(p => p.id === pageId);
    if (!pageToUpdate) return;

    const updatedSections = pageToUpdate.sections.map(s => s.id === updatedSection.id ? updatedSection : s);
    
    const docRef = doc(firestore, 'pages', pageId);
    const dataToSave = { ...pageToUpdate, sections: updatedSections };

    setDocumentNonBlocking(docRef, dataToSave, { merge: true });

    toast({
      title: 'Success!',
      description: `Content for section "${updatedSection.title}" has been updated.`,
    });
  };

  const selectedPage = pages?.find(p => p.id === selectedPageId);

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <header className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">Content Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage your website content here.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Page Content</CardTitle>
          <CardDescription>
            Select a page to edit its content sections.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {arePagesLoading ? (
            <Skeleton className="h-10 w-1/2" />
          ) : (
            <div className="max-w-xs">
              <Select onValueChange={setSelectedPageId} value={selectedPageId || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a page..." />
                </SelectTrigger>
                <SelectContent>
                  {pages?.map(page => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedPage ? (
            <Accordion type="multiple" defaultValue={selectedPage.sections.map(s => s.id)} className="w-full">
              {selectedPage.sections.map(section => (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionTrigger className="text-base font-medium">{section.title} Section</AccordionTrigger>
                  <AccordionContent className="p-4 bg-muted/40 rounded-md border">
                    <SectionForm 
                      pageId={selectedPage.id} 
                      section={section}
                      onSectionUpdate={handleSectionUpdate}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
             !arePagesLoading && <p className="text-sm text-muted-foreground">No content available for this page, or no page selected.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

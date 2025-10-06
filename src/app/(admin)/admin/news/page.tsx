
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, useStorage } from '@/firebase';
import { collection, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { Trash2, Edit, Plus } from 'lucide-react';

const generateSlug = (title: string) => {
  if (!title) return '';
  return title.toString().toLowerCase()
    .replace(/\s+/g, '-') 
    .replace(/[^\w\-]+/g, '') 
    .replace(/\-\-+/g, '-') 
    .replace(/^-+/, '') 
    .replace(/-+$/, '');
};

const formSchema = z.object({
  title: z.string().min(1, 'Headline is required.'),
  slug: z.string().min(1, 'Slug is required.'),
  publicationDate: z.date(),
  content: z.string().min(1, 'Content is required.'),
  mediaUrl: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
});

interface NewsStory extends z.infer<typeof formSchema> {
  id: string;
  publicationDate: Timestamp;
}

export default function NewsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);
  
  const [storyToDelete, setStoryToDelete] = useState<NewsStory | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<NewsStory | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const newsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'news'), orderBy('publicationDate', 'desc'));
  }, [firestore]);

  const { data: newsStories, isLoading: areNewsLoading } = useCollection<NewsStory>(newsQuery);

  const addForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '', slug: '', publicationDate: new Date(), content: '', mediaUrl: '', ogTitle: '', ogDescription: '', ogImage: ''
    },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const titleValue = addForm.watch("title");
  
  useEffect(() => {
    if (titleValue && !isSlugManuallyEdited) {
      addForm.setValue("slug", generateSlug(titleValue));
    }
  }, [titleValue, isSlugManuallyEdited, addForm]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (editingStory) {
      editForm.reset({
        ...editingStory,
        publicationDate: editingStory.publicationDate.toDate(),
      });
      setIsSlugManuallyEdited(false);
    }
  }, [editingStory, editForm]);

  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  const handleFileUpload = async (file: File | null): Promise<string | null> => {
    if (!file || !storage) return null;
    const fileName = `${uuidv4()}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `news-media/${fileName}`);
    try {
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("File upload error:", error);
      toast({ variant: "destructive", title: "Upload Failed" });
      return null;
    }
  };

  const onAddSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    let mediaUrl = '';
    if (mediaFile) {
      mediaUrl = await handleFileUpload(mediaFile) || '';
    }
    
    let ogImageUrl = '';
    if (ogImageFile) {
      ogImageUrl = await handleFileUpload(ogImageFile) || '';
    }

    const dataToSave = { ...values, mediaUrl, ogImage: ogImageUrl, publicationDate: Timestamp.fromDate(values.publicationDate) };
    addDocumentNonBlocking(collection(firestore, 'news'), dataToSave);
    toast({ title: 'Success!', description: 'New news story has been added.' });
    addForm.reset();
    setMediaFile(null);
    setOgImageFile(null);
    setIsAddSheetOpen(false);
  };

  const onEditSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !editingStory) return;
    
    let mediaUrl = values.mediaUrl;
    if (mediaFile) {
      if (editingStory.mediaUrl) {
        try { await deleteObject(ref(storage, editingStory.mediaUrl)); } catch (e) { console.error(e); }
      }
      mediaUrl = await handleFileUpload(mediaFile) || undefined;
    }

    let ogImageUrl = values.ogImage;
    if (ogImageFile) {
      if (editingStory.ogImage) {
        try { await deleteObject(ref(storage, editingStory.ogImage)); } catch (e) { console.error(e); }
      }
      ogImageUrl = await handleFileUpload(ogImageFile) || undefined;
    }

    const dataToSave = { ...values, mediaUrl, ogImage: ogImageUrl, publicationDate: Timestamp.fromDate(values.publicationDate) };
    const docRef = doc(firestore, 'news', editingStory.id);
    setDocumentNonBlocking(docRef, dataToSave, { merge: true });
    
    toast({ title: 'Success!', description: `News story "${values.title}" has been updated.` });
    setIsEditSheetOpen(false);
    setEditingStory(null);
    setMediaFile(null);
    setOgImageFile(null);
  };

  const openDeleteDialog = (story: NewsStory) => {
    setStoryToDelete(story);
    setIsDeleteDialogOpen(true);
  };

  const openEditSheet = (story: NewsStory) => {
    setEditingStory(story);
    setMediaFile(null);
    setOgImageFile(null);
    setIsEditSheetOpen(true);
  };

  const handleDeleteStory = () => {
    if (!firestore || !storyToDelete) return;
    
    if (storyToDelete.mediaUrl) {
      deleteObject(ref(storage, storyToDelete.mediaUrl)).catch(e => console.error("Error deleting media:", e));
    }
    if (storyToDelete.ogImage) {
      deleteObject(ref(storage, storyToDelete.ogImage)).catch(e => console.error("Error deleting OG image:", e));
    }
    
    deleteDocumentNonBlocking(doc(firestore, 'news', storyToDelete.id));
    
    toast({ title: "Story Deleted", description: "The news story has been permanently deleted." });
    setIsDeleteDialogOpen(false);
    setStoryToDelete(null);
  };

  const renderForm = (formInstance: any, onSubmitFn: (values: any) => void) => {
    const { control, handleSubmit, formState, watch, setValue } = formInstance;
    const currentMediaUrl = watch('mediaUrl');
    const currentOgImageUrl = watch('ogImage');
    
    return (
        <Form {...formInstance}>
            <form onSubmit={handleSubmit(onSubmitFn)} className="space-y-6">
                <FormField control={control} name="title" render={({ field }) => ( <FormItem> <FormLabel>Headline</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={control} name="slug" render={({ field }) => ( <FormItem> <FormLabel>Slug</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={control} name="publicationDate" render={({ field }) => ( <FormItem> <FormLabel>Publication Date</FormLabel> <FormControl><Input type="date" value={field.value ? format(field.value, 'yyyy-MM-dd') : ''} onChange={(e) => field.onChange(new Date(e.target.value))} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={control} name="content" render={({ field }) => ( <FormItem> <FormLabel>Content</FormLabel> <FormControl><Textarea {...field} rows={8} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormItem>
                    <FormLabel>Media (Image/Video)</FormLabel>
                    {currentMediaUrl && <div className="my-2"><Image src={currentMediaUrl} alt="Current Media" width={100} height={60} className="object-cover rounded-sm border" /></div>}
                    <FormControl><Input type="file" accept="image/*,video/*,.mov" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} /></FormControl>
                </FormItem>
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Social Media & SEO</CardTitle>
                        <CardDescription>How this story appears when shared.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={control} name="ogTitle" render={({ field }) => ( <FormItem> <FormLabel>Social Media Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={control} name="ogDescription" render={({ field }) => ( <FormItem> <FormLabel>Social Media Description</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormItem>
                            <FormLabel>Social Media Image</FormLabel>
                            {currentOgImageUrl && <div className="my-2"><Image src={currentOgImageUrl} alt="Current OG Image" width={100} height={60} className="object-cover rounded-sm border" /></div>}
                            <FormControl><Input type="file" accept="image/*" onChange={(e) => setOgImageFile(e.target.files?.[0] || null)} /></FormControl>
                        </FormItem>
                    </CardContent>
                </Card>
                <SheetFooter>
                    <SheetClose asChild><Button type="button" variant="outline">Cancel</Button></SheetClose>
                    <Button type="submit" disabled={formState.isSubmitting}>{formState.isSubmitting ? 'Saving...' : 'Save Story'}</Button>
                </SheetFooter>
            </form>
        </Form>
    );
  };


  return (
    <>
      <div className="container mx-auto px-4 py-12 md:px-6 space-y-8">
        <header>
          <h1 className="text-xl font-bold tracking-tight">News Management</h1>
          <p className="text-sm text-muted-foreground">Manage your company news stories.</p>
        </header>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>News Stories</CardTitle>
              <CardDescription>A list of all published news stories.</CardDescription>
            </div>
            <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
              <SheetTrigger asChild><Button><Plus className="h-4 w-4" /> Add Story</Button></SheetTrigger>
              <SheetContent className="flex flex-col sm:max-w-2xl">
                <SheetHeader>
                  <SheetTitle>Add New News Story</SheetTitle>
                </SheetHeader>
                <div className="flex-grow overflow-y-auto pr-4 py-4">{renderForm(addForm, onAddSubmit)}</div>
              </SheetContent>
            </Sheet>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Media</TableHead>
                  <TableHead>Headline</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areNewsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : newsStories && newsStories.length > 0 ? (
                  newsStories.map((story) => (
                    <TableRow key={story.id}>
                      <TableCell>
                        {story.mediaUrl ? <Image src={story.mediaUrl} alt={story.title} width={64} height={40} className="object-cover rounded-sm" /> : <div className="h-10 w-16 bg-muted rounded-sm" />}
                      </TableCell>
                      <TableCell className="font-medium">{story.title}</TableCell>
                      <TableCell>{format(story.publicationDate.toDate(), 'PPP')}</TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => openEditSheet(story)}><Edit className="h-4 w-4" /></Button>
                         <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(story)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center">No news stories found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="flex flex-col sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Edit News Story</SheetTitle>
            <SheetDescription>{editingStory?.title}</SheetDescription>
          </SheetHeader>
          <div className="flex-grow overflow-y-auto pr-4 py-4">{renderForm(editForm, onEditSubmit)}</div>
        </SheetContent>
      </Sheet>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the story "{storyToDelete?.title}". This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStory} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, useStorage } from '@/firebase';
import { collection, doc, query, orderBy, Timestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { Trash2, Edit, Plus, Search, GripVertical } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';

const generateSlug = (title: string) => {
  if (!title) return '';

  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;';
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------';
  const p = new RegExp(a.split('').join('|'), 'g');

  return title.toString().toLowerCase()
    .replace(/\s+/g, '-') 
    .replace(p, c => b.charAt(a.indexOf(c))) 
    .replace(/&/g, '-and-') 
    .replace(/[^\w\-]+/g, '') 
    .replace(/\-\-+/g, '-') 
    .replace(/^-+/, '') 
    .replace(/-+$/, '');
};

const sectionSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  paragraph: z.string().optional(),
  imageUrl: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  slug: z.string().min(1, 'Slug is required.'),
  author: z.string().min(1, 'Author is required.'),
  publicationDate: z.date(),
  summary: z.string().optional(),
  sections: z.array(sectionSchema).optional(),
  imageUrl: z.string().optional(),
  topicId: z.string().optional(),
});

interface Article extends z.infer<typeof formSchema> {
  id: string;
  publicationDate: Timestamp;
}

interface Topic {
    id: string;
    name: string;
}

export default function PublicationsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sectionImageFiles, setSectionImageFiles] = useState<(File | null)[]>([]);

  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const articlesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'articles'), orderBy('publicationDate', 'desc'));
  }, [firestore]);

  const topicsQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'article_topics'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: articles, isLoading: areArticlesLoading } = useCollection<Article>(articlesQuery);
  const { data: topics, isLoading: areTopicsLoading } = useCollection<Topic>(topicsQuery);

  const topicOptions = useMemo(() => {
    if (!topics) return [];
    return topics.map(topic => ({ value: topic.id, label: topic.name }));
  }, [topics]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '', slug: '', author: '', publicationDate: new Date(), summary: '', sections: [], imageUrl: '', topicId: ''
    },
  });
  
  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '', slug: '', author: '', publicationDate: new Date(), summary: '', sections: [], imageUrl: '', topicId: ''
    },
  });

  const { fields: addSections, append: appendAddSection, remove: removeAddSection } = useFieldArray({ control: form.control, name: "sections" });
  const { fields: editSections, append: appendEditSection, remove: removeEditSection } = useFieldArray({ control: editForm.control, name: "sections" });

  const titleValue = form.watch("title");

  useEffect(() => {
      if (titleValue && !isSlugManuallyEdited) {
          form.setValue("slug", generateSlug(titleValue));
      }
  }, [titleValue, isSlugManuallyEdited, form]);


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (editingArticle) {
      editForm.reset({
        ...editingArticle,
        summary: editingArticle.summary || '',
        sections: editingArticle.sections || [],
        imageUrl: editingArticle.imageUrl || '',
        publicationDate: editingArticle.publicationDate.toDate(),
        topicId: editingArticle.topicId || '',
      });
      setIsSlugManuallyEdited(false);
      setSectionImageFiles([]);
    }
  }, [editingArticle, editForm]);

  const handleCreateTopic = async (topicName: string) => {
    if (!firestore || !topicName) return null;
    try {
        const docRef = await addDoc(collection(firestore, 'article_topics'), { name: topicName });
        toast({ title: 'Topic created!', description: `Successfully created "${topicName}".`});
        return docRef.id;
    } catch (e) {
        toast({ title: 'Error', description: 'Could not create topic.', variant: 'destructive' });
        return null;
    }
  };

  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    if (!searchTerm) return articles;

    const lowercasedTerm = searchTerm.toLowerCase();
    return articles.filter(article => {
        const topicName = topics?.find(t => t.id === article.topicId)?.name || '';
        const contentSearch = article.sections?.map(s => `${s.title || ''} ${s.paragraph || ''}`).join(' ').toLowerCase().includes(lowercasedTerm)
        return (
            article.title.toLowerCase().includes(lowercasedTerm) ||
            article.author.toLowerCase().includes(lowercasedTerm) ||
            contentSearch ||
            topicName.toLowerCase().includes(lowercasedTerm)
        );
    });
  }, [articles, searchTerm, topics]);

  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  const handleFileUpload = async (file: File | null): Promise<string | null> => {
    if (!file || !storage || !user) return null;
    const fileName = `${uuidv4()}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `article-images/${fileName}`);
    try {
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("File upload error:", error);
      toast({ variant: "destructive", title: "Upload Failed" });
      return null;
    }
  };

  const processSectionsWithImages = async (sections: z.infer<typeof sectionSchema>[], files: (File | null)[]) => {
      const processedSections = [...sections];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file && processedSections[i]) {
            const newMediaUrl = await handleFileUpload(file);
            if(newMediaUrl) {
                processedSections[i].imageUrl = newMediaUrl;
            }
        }
      }
      return processedSections;
  }

  const onAddSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    let imageUrl = '';
    if (imageFile) {
      imageUrl = await handleFileUpload(imageFile) || '';
    }
    const processedSections = await processSectionsWithImages(values.sections || [], sectionImageFiles);
    
    const dataToSave = { ...values, imageUrl, sections: processedSections, publicationDate: Timestamp.fromDate(values.publicationDate) };
    addDocumentNonBlocking(collection(firestore, 'articles'), dataToSave);
    toast({ title: 'Success!', description: 'New article has been added.' });
    form.reset();
    setImageFile(null);
    setSectionImageFiles([]);
    setIsAddSheetOpen(false);
  };

  const onEditSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !editingArticle) return;
    let imageUrl = editingArticle.imageUrl;
    if (imageFile) {
      if (editingArticle.imageUrl && storage) {
        try {
          const oldImageRef = ref(storage, editingArticle.imageUrl);
          await deleteObject(oldImageRef);
        } catch (error) { console.error("Error deleting old image: ", error); }
      }
      imageUrl = await handleFileUpload(imageFile) || editingArticle.imageUrl;
    }
    const processedSections = await processSectionsWithImages(values.sections || [], sectionImageFiles);

    const dataToSave = { ...values, imageUrl, sections: processedSections, publicationDate: Timestamp.fromDate(values.publicationDate) };
    const docRef = doc(firestore, 'articles', editingArticle.id);
    setDocumentNonBlocking(docRef, dataToSave, { merge: true });
    toast({ title: 'Success!', description: `Article "${values.title}" has been updated.` });
    setIsEditSheetOpen(false);
    setEditingArticle(null);
    setImageFile(null);
    setSectionImageFiles([]);
  };

  const openDeleteDialog = (article: Article) => {
    setArticleToDelete(article);
    setIsDeleteDialogOpen(true);
  };

  const openEditDialog = (article: Article) => {
    setEditingArticle(article);
    setImageFile(null);
    setSectionImageFiles([]);
    setIsEditSheetOpen(true);
  };

  const handleDeleteArticle = () => {
    if (!firestore || !articleToDelete) return;
    if (articleToDelete.imageUrl && storage) {
      const imageRef = ref(storage, articleToDelete.imageUrl);
      deleteObject(imageRef).catch(error => console.error("Error deleting image: ", error));
    }
    articleToDelete.sections?.forEach(section => {
        if (section.imageUrl && storage) {
            const sectionImageRef = ref(storage, section.imageUrl);
            deleteObject(sectionImageRef).catch(error => console.error("Error deleting section image: ", error));
        }
    });
    const docRef = doc(firestore, 'articles', articleToDelete.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Article Deleted", description: "The article has been permanently deleted." });
    setIsDeleteDialogOpen(false);
    setArticleToDelete(null);
  };
  
  const handleSectionImageChange = (index: number, file: File | null, formType: 'add' | 'edit') => {
      const newFiles = [...sectionImageFiles];
      newFiles[index] = file;
      setSectionImageFiles(newFiles);
  }

  const renderSectionForms = (formInstance: any, sections: any[], appendFn: Function, removeFn: Function) => {
      return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-foreground">Sections</h3>
            {sections.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md space-y-3 relative bg-background">
                     <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-sm">Section {index + 1}</h4>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeFn(index)} className="h-7 w-7 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                     </div>
                    <FormField control={formInstance.control} name={`sections.${index}.title`} render={({ field }) => ( <FormItem> <FormLabel>Section Title</FormLabel> <FormControl><Input {...field} placeholder="Optional section title"/></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={formInstance.control} name={`sections.${index}.paragraph`} render={({ field }) => ( <FormItem> <FormLabel>Paragraph</FormLabel> <FormControl><Textarea {...field} placeholder="Section content..." rows={5}/></FormControl> <FormMessage /> </FormItem> )} />
                    <FormItem>
                      <FormLabel>Section Image</FormLabel>
                       {formInstance.getValues(`sections.${index}.imageUrl`) && (
                          <div className="mb-2">
                             <Image src={formInstance.getValues(`sections.${index}.imageUrl`)} alt={`Section ${index+1} image`} width={100} height={60} className="object-cover rounded-sm border" />
                          </div>
                       )}
                      <FormControl><Input type="file" accept="image/*" onChange={(e) => handleSectionImageChange(index, e.target.files?.[0] || null, formInstance === form ? 'add' : 'edit')} /></FormControl>
                    </FormItem>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendFn({ id: uuidv4(), title: '', paragraph: '', imageUrl: '' })}>
                <Plus className="mr-2 h-4 w-4" /> Add Section
            </Button>
        </div>
      )
  }

  return (
    <>
      <div className="container mx-auto px-4 py-12 md:px-6 space-y-8">
        <header>
          <h1 className="text-xl font-bold tracking-tight">Publications Management</h1>
          <p className="text-sm text-muted-foreground">Add, edit, or remove articles.</p>
        </header>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Existing Articles</CardTitle>
              <CardDescription>A list of all current articles.</CardDescription>
            </div>
            <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
              <SheetTrigger asChild><Button><Plus className="h-4 w-4" /> Add Article</Button></SheetTrigger>
              <SheetContent className="flex flex-col sm:max-w-3xl">
                <SheetHeader>
                  <SheetTitle>Add New Article</SheetTitle>
                </SheetHeader>
                <div className="flex-grow overflow-y-auto pr-4">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4 py-4">
                      <FormField control={form.control} name="title" render={({ field }) => ( <FormItem> <FormLabel>Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                      <FormField control={form.control} name="slug" render={({ field }) => ( <FormItem> <FormLabel>Slug</FormLabel> <FormControl><Input {...field} onChange={(e) => { field.onChange(e); setIsSlugManuallyEdited(true); }}/></FormControl> <FormMessage /> </FormItem> )} />
                      <FormField control={form.control} name="author" render={({ field }) => ( <FormItem> <FormLabel>Author</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                       <FormField
                        control={form.control}
                        name="topicId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Topic</FormLabel>
                            <Combobox
                                items={topicOptions}
                                value={field.value || null}
                                onChange={field.onChange}
                                placeholder="Select a topic"
                                searchPlaceholder="Search or create..."
                                noResultsText="No topic found. Create a new one."
                                onNewItem={handleCreateTopic}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={form.control} name="publicationDate" render={({ field }) => ( <FormItem> <FormLabel>Publication Date</FormLabel> <FormControl><Input type="date" value={field.value ? format(field.value, 'yyyy-MM-dd') : ''} onChange={(e) => field.onChange(new Date(e.target.value))} /></FormControl> <FormMessage /> </FormItem> )} />
                      <FormField control={form.control} name="summary" render={({ field }) => ( <FormItem> <FormLabel>Summary</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                      <FormItem>
                          <FormLabel>Main Image</FormLabel>
                          <FormControl><Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} /></FormControl>
                      </FormItem>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        {renderSectionForms(form, addSections, appendAddSection, removeAddSection)}
                      </div>
                    </form>
                  </Form>
                </div>
                <SheetFooter className="mt-auto border-t py-4">
                  <SheetClose asChild><Button type="button" variant="outline">Cancel</Button></SheetClose>
                  <Button type="button" onClick={form.handleSubmit(onAddSubmit)} disabled={form.formState.isSubmitting}>Save Article</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by title, author, content, topic..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areArticlesLoading || areTopicsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredArticles && filteredArticles.length > 0 ? (
                  filteredArticles.map((article) => {
                    const topic = topics?.find(t => t.id === article.topicId);
                    return (
                      <TableRow key={article.id}>
                        <TableCell>
                          {article.imageUrl ? <Image src={article.imageUrl} alt={article.title} width={64} height={40} className="object-cover rounded-sm" /> : <div className="h-10 w-16 bg-muted rounded-sm" />}
                        </TableCell>
                        <TableCell className="font-medium">{article.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{topic?.name || 'N/A'}</TableCell>
                        <TableCell>{article.author}</TableCell>
                        <TableCell>{format(article.publicationDate.toDate(), 'PPP')}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(article as Article)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(article as Article)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">No articles found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="flex flex-col sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>Edit Article: {editingArticle?.title}</SheetTitle>
          </SheetHeader>
          <div className="flex-grow overflow-y-auto pr-4">
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                <FormField control={editForm.control} name="title" render={({ field }) => ( <FormItem> <FormLabel>Title</FormLabel> <FormControl><Input {...field} onBlur={(e) => { if (!isSlugManuallyEdited && !editForm.getValues('slug')) { editForm.setValue('slug', generateSlug(e.target.value)); } }} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={editForm.control} name="slug" render={({ field }) => ( <FormItem> <FormLabel>Slug</FormLabel> <FormControl><Input {...field} onChange={(e) => { field.onChange(e); setIsSlugManuallyEdited(true); }} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={editForm.control} name="author" render={({ field }) => ( <FormItem> <FormLabel>Author</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                 <FormField
                    control={editForm.control}
                    name="topicId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <Combobox
                            items={topicOptions}
                            value={field.value || null}
                            onChange={field.onChange}
                            placeholder="Select a topic"
                            searchPlaceholder="Search or create..."
                            noResultsText="No topic found. Create a new one."
                            onNewItem={handleCreateTopic}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                <FormField control={editForm.control} name="publicationDate" render={({ field }) => ( <FormItem> <FormLabel>Publication Date</FormLabel> <FormControl><Input type="date" value={field.value ? format(field.value, 'yyyy-MM-dd') : ''} onChange={(e) => field.onChange(new Date(e.target.value))} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={editForm.control} name="summary" render={({ field }) => ( <FormItem> <FormLabel>Summary</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormItem>
                  <FormLabel>Main Image</FormLabel>
                  {editForm.watch('imageUrl') && <Image src={editForm.watch('imageUrl')!} alt="Current Image" width={100} height={60} className="rounded-sm object-cover" />}
                  <FormControl><Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} /></FormControl>
                </FormItem>
                 <div className="p-4 bg-muted/50 rounded-lg">
                    {renderSectionForms(editForm, editSections, appendEditSection, removeEditSection)}
                 </div>
              </form>
            </Form>
          </div>
          <SheetFooter className="mt-auto border-t py-4">
            <SheetClose asChild><Button type="button" variant="outline">Cancel</Button></SheetClose>
            <Button type="button" onClick={editForm.handleSubmit(onEditSubmit)} disabled={editForm.formState.isSubmitting}>Save Changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the article <span className="font-semibold">{articleToDelete?.title}</span>. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteArticle} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

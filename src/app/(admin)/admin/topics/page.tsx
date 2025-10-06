'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Trash2, Edit, Plus } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Topic name is required.'),
});

interface Topic extends z.infer<typeof formSchema> {
  id: string;
}

export default function TopicsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const topicsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'article_topics'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: topics, isLoading: areTopicsLoading } = useCollection<Omit<Topic, 'id'>>(topicsQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '' },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (editingTopic) {
      editForm.reset({ name: editingTopic.name });
    }
  }, [editingTopic, editForm]);

  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  const onAddSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    addDocumentNonBlocking(collection(firestore, 'article_topics'), values);
    toast({ title: 'Success!', description: 'New topic has been added.' });
    form.reset();
    setIsAddDialogOpen(false);
  };

  const onEditSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !editingTopic) return;
    const docRef = doc(firestore, 'article_topics', editingTopic.id);
    setDocumentNonBlocking(docRef, values, { merge: true });
    toast({ title: 'Success!', description: `Topic "${values.name}" has been updated.` });
    setIsEditDialogOpen(false);
    setEditingTopic(null);
  };

  const openDeleteDialog = (topic: Topic) => {
    setTopicToDelete(topic);
    setIsDeleteDialogOpen(true);
  };

  const openEditDialog = (topic: Topic) => {
    setEditingTopic(topic);
    setIsEditDialogOpen(true);
  };

  const handleDeleteTopic = () => {
    if (!firestore || !topicToDelete) return;
    const docRef = doc(firestore, 'article_topics', topicToDelete.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Topic Deleted", description: "The topic has been permanently deleted." });
    setIsDeleteDialogOpen(false);
    setTopicToDelete(null);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-12 md:px-6 space-y-8">
        <header>
          <h1 className="text-xl font-bold tracking-tight">Article Topics Management</h1>
          <p className="text-sm text-muted-foreground">Add, edit, or remove article topics.</p>
        </header>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Existing Topics</CardTitle>
              <CardDescription>A list of all current article topics.</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="h-4 w-4" />
                        Add Topic
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Topic</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Topic Name</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., Technology" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? 'Saving...' : 'Save Topic'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areTopicsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : topics && topics.length > 0 ? (
                  topics.map((topic) => (
                    <TableRow key={topic.id}>
                      <TableCell className="font-medium">{topic.name}</TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => openEditDialog(topic as Topic)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                        </Button>
                         <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(topic as Topic)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                            <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      No topics found. Add one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Edit Topic: {editingTopic?.name}</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                      <FormField control={editForm.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Topic Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                      <DialogFooter className="pt-4">
                          <DialogClose asChild>
                              <Button type="button" variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button type="submit" disabled={editForm.formState.isSubmitting}>
                              {editForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                          </Button>
                      </DialogFooter>
                    </form>
                </Form>
              </div>
          </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the topic <span className="font-semibold">{topicToDelete?.name}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTopic} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    
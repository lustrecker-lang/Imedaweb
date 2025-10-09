// src/app/(admin)/admin/kpis/page.tsx
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Trash2, Edit, Plus } from 'lucide-react';

const formSchema = z.object({
  number: z.coerce.number().positive("Number must be positive."),
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  order: z.coerce.number().int().min(0, "Order must be a positive number."),
});

interface Kpi extends z.infer<typeof formSchema> {
  id: string;
}

export default function KpisPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [itemToDelete, setItemToDelete] = useState<Kpi | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Kpi | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const kpisQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'kpis'), orderBy('order', 'asc'));
  }, [firestore]);

  const { data: kpis, isLoading: areKpisLoading } = useCollection<Omit<Kpi, 'id'>>(kpisQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { number: 0, title: '', description: '', order: 0 },
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
    if (editingItem) {
      editForm.reset(editingItem);
    }
  }, [editingItem, editForm]);

  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  const onAddSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    addDocumentNonBlocking(collection(firestore, 'kpis'), values);
    toast({ title: 'Success!', description: 'New KPI has been added.' });
    form.reset();
    setIsAddDialogOpen(false);
  };
  
  const onEditSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !editingItem) return;
    const docRef = doc(firestore, 'kpis', editingItem.id);
    setDocumentNonBlocking(docRef, values, { merge: true });
    toast({ title: 'Success!', description: `KPI "${values.title}" has been updated.` });
    setIsEditDialogOpen(false);
    setEditingItem(null);
  };

  const openDeleteDialog = (item: Kpi) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };
  
  const openEditDialog = (item: Kpi) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDeleteItem = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'kpis', itemToDelete.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "KPI Deleted", description: "The KPI has been permanently deleted." });
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const renderForm = (formInstance: any, onSubmitFn: any) => {
    const { control, handleSubmit, formState } = formInstance;
    return (
      <Form {...formInstance}>
        <form onSubmit={handleSubmit(onSubmitFn)} className="space-y-4 py-4">
          <FormField control={control} name="number" render={({ field }) => (
            <FormItem><FormLabel>Number</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="title" render={({ field }) => (
            <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="order" render={({ field }) => (
            <FormItem><FormLabel>Display Order</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={formState.isSubmitting}>{formState.isSubmitting ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </Form>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-12 md:px-6 space-y-8">
        <header>
          <h1 className="text-xl font-bold tracking-tight">KPI Management</h1>
          <p className="text-sm text-muted-foreground">Manage the Key Performance Indicators displayed on the homepage.</p>
        </header>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Homepage KPIs</CardTitle>
              <CardDescription>A list of all current KPIs.</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add KPI</Button></DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Add New KPI</DialogTitle></DialogHeader>
                    {renderForm(form, onAddSubmit)}
                </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areKpisLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : kpis && kpis.length > 0 ? (
                  kpis.map((kpi) => (
                    <TableRow key={kpi.id}>
                      <TableCell>{kpi.order}</TableCell>
                      <TableCell className="font-bold text-lg">{kpi.number}</TableCell>
                      <TableCell className="font-medium">{kpi.title}</TableCell>
                      <TableCell className="text-muted-foreground">{kpi.description}</TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => openEditDialog(kpi as Kpi)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                        </Button>
                         <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(kpi as Kpi)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                            <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">No KPIs found. Add one to get started.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Edit KPI</DialogTitle></DialogHeader>
              {renderForm(editForm, onEditSubmit)}
          </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the KPI titled <span className="font-semibold">{itemToDelete?.title}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

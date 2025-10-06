
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, useStorage } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

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
  name: z.string().min(1, 'Company name is required.'),
  logoUrl: z.string().min(1, 'Logo is required.'),
});

interface Reference extends z.infer<typeof formSchema> {
  id: string;
}

export default function ReferencesPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [referenceToDelete, setReferenceToDelete] = useState<Reference | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingReference, setEditingReference] = useState<Reference | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);


  const referencesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'references'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: references, isLoading: areReferencesLoading } = useCollection<Omit<Reference, 'id'>>(referencesQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', logoUrl: '' },
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
    if (editingReference) {
      editForm.reset(editingReference);
      setPreviewUrl(editingReference.logoUrl);
    }
  }, [editingReference, editForm]);


  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const handleFileUpload = async (file: File | null): Promise<string | null> => {
    if (!file || !storage || !user) return null;

    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storageRef = ref(storage, `reference-logos/${fileName}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Could not upload the logo. Please try again.",
      });
      return null;
    }
  };

  const onAddSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    
    if (!logoFile) {
        form.setError("logoUrl", { type: "manual", message: "Please select a logo file to upload." });
        return;
    }

    const logoUrl = await handleFileUpload(logoFile);
    if (!logoUrl) {
      form.setError("logoUrl", { type: "manual", message: "Logo upload failed." });
      return;
    }

    const dataToSave = { ...values, logoUrl };
    addDocumentNonBlocking(collection(firestore, 'references'), dataToSave);

    toast({
      title: 'Success!',
      description: 'New reference has been added.',
    });

    form.reset();
    setLogoFile(null);
    setIsAddDialogOpen(false);
  };
  
  const onEditSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !editingReference) return;

    let logoUrl = editingReference.logoUrl;
    if (logoFile) {
      if (editingReference.logoUrl && storage) {
        try {
          const oldLogoRef = ref(storage, editingReference.logoUrl);
          await deleteObject(oldLogoRef);
        } catch (error) { console.error("Error deleting old logo: ", error); }
      }
      logoUrl = await handleFileUpload(logoFile) || editingReference.logoUrl;
    }
    
    const docRef = doc(firestore, 'references', editingReference.id);
    const dataToSave = { ...values, logoUrl };
    
    setDocumentNonBlocking(docRef, dataToSave, { merge: true });

    toast({
      title: 'Success!',
      description: `Reference "${values.name}" has been updated.`,
    });

    setIsEditDialogOpen(false);
    setEditingReference(null);
    setLogoFile(null);
    setPreviewUrl(null);
  };

  const openDeleteDialog = (reference: Reference) => {
    setReferenceToDelete(reference);
    setIsDeleteDialogOpen(true);
  };
  
  const openEditDialog = (reference: Reference) => {
    setEditingReference(reference);
    setPreviewUrl(reference.logoUrl);
    setIsEditDialogOpen(true);
    setLogoFile(null);
  };

  const handleDeleteReference = () => {
    if (!firestore || !referenceToDelete) return;
    
    if (referenceToDelete.logoUrl && storage) {
      const logoRef = ref(storage, referenceToDelete.logoUrl);
      deleteObject(logoRef).catch(error => console.error("Error deleting logo: ", error));
    }

    const docRef = doc(firestore, 'references', referenceToDelete.id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Reference Deleted",
      description: "The reference has been permanently deleted.",
    });
    setIsDeleteDialogOpen(false);
    setReferenceToDelete(null);
  };

  const renderAddForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4 py-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Company Name</FormLabel>
            <FormControl><Input placeholder="e.g., Acme Inc." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="logoUrl" render={({ field }) => (
            <FormItem>
                <FormLabel>Company Logo</FormLabel>
                <FormControl>
                    <Input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setLogoFile(file);
                        field.onChange(file ? file.name : ''); // Update form value for validation
                    }} />
                </FormControl>
                <FormMessage />
            </FormItem>
        )} />
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving...' : 'Save Reference'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  const renderEditForm = () => (
    <Form {...editForm}>
      <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
        <FormField control={editForm.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Company Name</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={editForm.control} name="logoUrl" render={({ field }) => (
            <FormItem>
                <FormLabel>Company Logo</FormLabel>
                {previewUrl && <Image src={previewUrl} alt="Current logo" width={120} height={40} className="object-contain my-2 rounded-sm border p-2" />}
                <FormControl>
                    <Input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setLogoFile(file);
                      if (file) {
                        setPreviewUrl(URL.createObjectURL(file));
                      } else {
                        setPreviewUrl(editingReference?.logoUrl || null);
                      }
                      field.onChange(file ? file.name : editingReference?.logoUrl || '');
                    }} />
                </FormControl>
                <FormMessage />
            </FormItem>
        )} />
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="submit" disabled={editForm.formState.isSubmitting}>
              {editForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  return (
    <>
      <div className="container mx-auto px-4 py-12 md:px-6 space-y-8">
        <header>
          <h1 className="text-xl font-bold tracking-tight">References Management</h1>
          <p className="text-sm text-muted-foreground">Add, edit, or remove company references.</p>
        </header>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Company References</CardTitle>
              <CardDescription>A list of companies you have worked with.</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add Reference</Button></DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Add New Reference</DialogTitle></DialogHeader>
                    {renderAddForm()}
                </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areReferencesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : references && references.length > 0 ? (
                  references.map((ref) => (
                    <TableRow key={ref.id}>
                      <TableCell>
                        {ref.logoUrl ? (
                           <Image src={ref.logoUrl} alt={ref.name} width={96} height={40} className="object-contain h-10" />
                        ) : (
                          <div className="h-10 w-24 bg-muted rounded-sm flex items-center justify-center text-xs text-muted-foreground">No Logo</div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{ref.name}</TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => openEditDialog(ref as Reference)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                        </Button>
                         <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(ref as Reference)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                            <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No references found. Add one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if (!isOpen) setPreviewUrl(null); }}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Edit Reference: {editingReference?.name}</DialogTitle></DialogHeader>
              {renderEditForm()}
          </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the reference <span className="font-semibold">{referenceToDelete?.name}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReference} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

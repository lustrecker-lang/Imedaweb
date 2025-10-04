
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, useStorage, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { Trash2, Edit, X, Plus } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Campus name is required.'),
  slug: z.string().min(1, 'Slug is required.'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

interface Campus {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

// Function to generate a URL-friendly slug
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with -
    .replace(/(^-|-$)+/g, '');   // Remove leading/trailing dashes
};


export default function CampusPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [campusToDelete, setCampusToDelete] = useState<Campus | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const campusesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'campuses'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: campuses, isLoading: areCampusesLoading } = useCollection<Campus>(campusesQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', slug: '', description: '', imageUrl: '' },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  // Watch the name field in the "add" form to auto-generate the slug
  const addCampusName = form.watch('name');
  useEffect(() => {
    if (addCampusName) {
      form.setValue('slug', generateSlug(addCampusName), { shouldValidate: true });
    }
  }, [addCampusName, form]);

  // Watch the name field in the "edit" form to auto-generate the slug
  const editCampusName = editForm.watch('name');
  useEffect(() => {
    if (editCampusName && isEditDialogOpen) {
      editForm.setValue('slug', generateSlug(editCampusName), { shouldValidate: true });
    }
  }, [editCampusName, editForm, isEditDialogOpen]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);
  
  useEffect(() => {
    if (editingCampus) {
      editForm.reset(editingCampus);
    }
  }, [editingCampus, editForm]);


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
    const storageRef = ref(storage, `campus-assets/${fileName}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
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

  const onAddSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;

    let imageUrl = '';
    if (imageFile) {
        imageUrl = await handleFileUpload(imageFile) || '';
    }

    const dataToSave = { ...values, imageUrl };
    const campusesCollection = collection(firestore, 'campuses');
    
    addDocumentNonBlocking(campusesCollection, dataToSave);

    toast({
      title: 'Success!',
      description: 'New campus has been added.',
    });

    form.reset();
    setImageFile(null);
    setIsAddDialogOpen(false);
  };
  
  const onEditSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !editingCampus) return;

    let imageUrl = editingCampus.imageUrl;

    if (imageFile) {
      // If there was an old image, delete it from storage
      if (editingCampus.imageUrl && storage) {
        try {
          const oldImageRef = ref(storage, editingCampus.imageUrl);
          await deleteObject(oldImageRef);
        } catch (error) {
          console.error("Error deleting old image from storage: ", error);
        }
      }
      imageUrl = await handleFileUpload(imageFile) || editingCampus.imageUrl;
    }

    const docRef = doc(firestore, 'campuses', editingCampus.id);
    const dataToSave = { ...values, imageUrl };
    
    setDocumentNonBlocking(docRef, dataToSave, { merge: true });

    toast({
      title: 'Success!',
      description: `Campus "${values.name}" has been updated.`,
    });

    setIsEditDialogOpen(false);
    setEditingCampus(null);
    setImageFile(null);
  };
  
  const handleRemoveImage = async () => {
    if (!firestore || !editingCampus || !editingCampus.imageUrl) return;

    // Also delete from storage
    if (storage) {
        try {
            const imageRef = ref(storage, editingCampus.imageUrl);
            await deleteObject(imageRef);
        } catch (error) {
            console.error("Error deleting image from storage: ", error);
        }
    }
    
    const docRef = doc(firestore, 'campuses', editingCampus.id);
    setDocumentNonBlocking(docRef, { imageUrl: '' }, { merge: true });
    
    setEditingCampus(prev => prev ? { ...prev, imageUrl: '' } : null);
    
    toast({
      title: 'Image Removed',
      description: 'The campus image has been removed.',
    });
  }

  const openDeleteDialog = (campus: Campus) => {
    setCampusToDelete(campus);
    setIsDeleteDialogOpen(true);
  };
  
  const openEditDialog = (campus: Campus) => {
    setEditingCampus(campus);
    setIsEditDialogOpen(true);
    setImageFile(null);
  };

  const handleDeleteCampus = () => {
    if (!firestore || !campusToDelete) return;
    
    // Delete image from storage if it exists
    if (campusToDelete.imageUrl && storage) {
      const imageRef = ref(storage, campusToDelete.imageUrl);
      deleteObject(imageRef).catch(error => {
        console.error("Error deleting image from storage during campus deletion: ", error);
      });
    }

    const docRef = doc(firestore, 'campuses', campusToDelete.id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Campus Deleted",
      description: "The campus has been permanently deleted.",
    });
    setIsDeleteDialogOpen(false);
    setCampusToDelete(null);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-12 md:px-6 space-y-8">
        <header>
          <h1 className="text-xl font-bold tracking-tight">Campus Management</h1>
          <p className="text-sm text-muted-foreground">Add, edit, or remove school campuses.</p>
        </header>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Existing Campuses</CardTitle>
              <CardDescription>A list of all current campuses.</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="h-4 w-4" />
                        Add Campus
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New Campus</DialogTitle>
                        <DialogDescription>
                            Fill out the details for the new campus. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Campus Name</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., Paris" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="slug"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Slug</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., paris" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                    <Textarea placeholder="A short description of the campus." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormItem>
                                <FormLabel>Campus Image</FormLabel>
                                <FormControl>
                                <Input 
                                    id="campus-image-input"
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        setImageFile(e.target.files[0]);
                                    }
                                    }}
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                             <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? 'Saving...' : 'Save Campus'}
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
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areCampusesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : campuses && campuses.length > 0 ? (
                  campuses.map((campus) => (
                    <TableRow key={campus.id}>
                      <TableCell>
                        {campus.imageUrl ? (
                           <Image src={campus.imageUrl} alt={campus.name} width={64} height={40} className="object-cover rounded-sm" />
                        ) : (
                          <div className="h-10 w-16 bg-muted rounded-sm flex items-center justify-center text-xs text-muted-foreground">No Image</div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{campus.name}</TableCell>
                      <TableCell className="font-mono text-xs">{campus.slug}</TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-xs">{campus.description}</TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => openEditDialog(campus)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                        </Button>
                         <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(campus)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                            <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No campuses found. Add one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <SheetContent>
              <SheetHeader>
                  <SheetTitle>Edit Campus: {editingCampus?.name}</SheetTitle>
                  <SheetDescription>
                    Make changes to the campus details below. Click save when you're done.
                  </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                        <FormField
                            control={editForm.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Campus Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={editForm.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Slug</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={editForm.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl><Textarea {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormItem>
                            <FormLabel>Campus Image</FormLabel>
                            <div className="flex items-center gap-4">
                                {editingCampus?.imageUrl && (
                                    <div className="relative">
                                        <Image src={editingCampus.imageUrl} alt={editingCampus.name} width={80} height={50} className="object-cover rounded-sm" />
                                        <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={handleRemoveImage}>
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Remove Image</span>
                                        </Button>
                                    </div>
                                )}
                                <FormControl className="flex-1">
                                    <Input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setImageFile(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </FormControl>
                            </div>
                            <FormMessage />
                        </FormItem>
                        <SheetFooter className="pt-4">
                            <SheetClose asChild>
                                <Button type="button" variant="outline">Cancel</Button>
                            </SheetClose>
                            <Button type="submit" disabled={editForm.formState.isSubmitting}>
                                {editForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
              </div>
          </SheetContent>
      </Sheet>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the campus <span className="font-semibold">{campusToDelete?.name}</span> and its associated image. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCampus} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

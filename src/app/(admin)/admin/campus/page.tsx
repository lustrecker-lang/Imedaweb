
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, useStorage, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Campus name is required.'),
  imageUrl: z.string().optional(),
});

interface Campus {
  id: string;
  name: string;
  imageUrl?: string;
}

export default function CampusPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [campusToDelete, setCampusToDelete] = useState<Campus | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const campusesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'campuses'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: campuses, isLoading: areCampusesLoading } = useCollection<Campus>(campusesQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;

    let imageUrl = '';
    if (imageFile) {
        imageUrl = await handleFileUpload(imageFile) || '';
    }

    const dataToSave = { name: values.name, imageUrl };
    const campusesCollection = collection(firestore, 'campuses');
    
    addDocumentNonBlocking(campusesCollection, dataToSave);

    toast({
      title: 'Success!',
      description: 'New campus has been added.',
    });

    form.reset();
    setImageFile(null);
    const fileInput = document.getElementById('campus-image-input') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  };

  const openDeleteDialog = (campus: Campus) => {
    setCampusToDelete(campus);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCampus = () => {
    if (!firestore || !campusToDelete) return;
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
        <CardHeader>
          <CardTitle>Add New Campus</CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
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
            </CardContent>
            <CardContent>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Adding...' : 'Add Campus'}
              </Button>
            </CardContent>
          </form>
        </Form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Existing Campuses</CardTitle>
          <CardDescription>A list of all current campuses.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areCampusesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
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
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(campus)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                          <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No campuses found. Add one above to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the campus <span className="font-semibold">{campusToDelete?.name}</span>. This action cannot be undone.
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

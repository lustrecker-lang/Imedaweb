
'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { Trash2, Edit, X, Plus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  name: z.string().min(1, 'Service name is required.'),
  description: z.string().optional(),
  mediaUrl: z.string().optional(),
  isPremium: z.boolean().default(false),
  isOptional: z.boolean().default(false),
});

interface Service extends z.infer<typeof formSchema> {
  id: string;
}

const isVideoUrl = (url?: string | null) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    try {
      const pathname = new URL(url).pathname.split('?')[0];
      return videoExtensions.some(ext => pathname.toLowerCase().endsWith(ext));
    } catch (e) {
      return false; // Invalid URL
    }
};

const MediaPreview = ({ url, alt }: { url: string, alt: string }) => {
    if (isVideoUrl(url)) {
        return (
            <video src={url} width="64" height="40" className="object-cover rounded-sm bg-muted" muted playsInline />
        );
    }
    return (
        <Image src={url} alt={alt} width={64} height={40} className="object-cover rounded-sm" />
    );
}

export default function ServicesPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const servicesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'services'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: services, isLoading: areServicesLoading } = useCollection<Omit<Service, 'id'>>(servicesQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      name: '', 
      description: '', 
      mediaUrl: '',
      isPremium: false,
      isOptional: false,
    },
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
    if (editingService) {
      editForm.reset({
        name: editingService.name || '',
        description: editingService.description || '',
        mediaUrl: editingService.mediaUrl || '',
        isPremium: editingService.isPremium || false,
        isOptional: editingService.isOptional || false,
      });
    }
  }, [editingService, editForm]);

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
    const storageRef = ref(storage, `service-assets/${fileName}`);
    
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

    let mediaUrl = '';
    if (mediaFile) {
        mediaUrl = await handleFileUpload(mediaFile) || '';
    }

    const dataToSave = { ...values, mediaUrl };
    const servicesCollection = collection(firestore, 'services');
    
    addDocumentNonBlocking(servicesCollection, dataToSave);

    toast({
      title: 'Success!',
      description: 'New service has been added.',
    });

    form.reset();
    setMediaFile(null);
    setIsAddDialogOpen(false);
  };
  
  const onEditSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !editingService) return;

    let mediaUrl = editingService.mediaUrl;

    if (mediaFile) {
      if (editingService.mediaUrl && storage) {
        try {
          const oldMediaRef = ref(storage, editingService.mediaUrl);
          await deleteObject(oldMediaRef);
        } catch (error) { console.error("Error deleting old media: ", error); }
      }
      mediaUrl = await handleFileUpload(mediaFile) || editingService.mediaUrl;
    }
    
    const docRef = doc(firestore, 'services', editingService.id);
    const dataToSave = { 
      ...values, 
      mediaUrl,
    };
    
    setDocumentNonBlocking(docRef, dataToSave, { merge: true });

    toast({
      title: 'Success!',
      description: `Service "${values.name}" has been updated.`,
    });

    setIsEditDialogOpen(false);
    setEditingService(null);
    setMediaFile(null);
  };

  const openDeleteDialog = (service: Service) => {
    setServiceToDelete(service);
    setIsDeleteDialogOpen(true);
  };
  
  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setIsEditDialogOpen(true);
    setMediaFile(null);
  };

  const handleDeleteService = () => {
    if (!firestore || !serviceToDelete) return;
    
    if (serviceToDelete.mediaUrl && storage) {
      const mediaRef = ref(storage, serviceToDelete.mediaUrl);
      deleteObject(mediaRef).catch(error => console.error("Error deleting media: ", error));
    }

    const docRef = doc(firestore, 'services', serviceToDelete.id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Service Deleted",
      description: "The service has been permanently deleted.",
    });
    setIsDeleteDialogOpen(false);
    setServiceToDelete(null);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-12 md:px-6 space-y-8">
        <header>
          <h1 className="text-xl font-bold tracking-tight">Service Management</h1>
          <p className="text-sm text-muted-foreground">Add, edit, or remove services.</p>
        </header>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Existing Services</CardTitle>
              <CardDescription>A list of all current services.</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="h-4 w-4" />
                        Add Service
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Service</DialogTitle>
                        <DialogDescription>
                            Fill out the details for the new service. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Service Name</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., Web Development" {...field} />
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
                                    <Textarea placeholder="A short description of the service." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormItem>
                                <FormLabel>Media Asset</FormLabel>
                                <FormControl>
                                <Input 
                                    type="file" 
                                    accept="image/*,video/*,.mov"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) {
                                          setMediaFile(e.target.files[0]);
                                      }
                                    }}
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                             <FormField
                                control={form.control}
                                name="isPremium"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                      <FormLabel>Premium Service</FormLabel>
                                      <FormMessage />
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="isOptional"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                      <FormLabel>Optional Service</FormLabel>
                                      <FormMessage />
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                             <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? 'Saving...' : 'Save Service'}
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
                  <TableHead>Media</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areServicesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : services && services.length > 0 ? (
                  services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        {service.mediaUrl ? (
                           <MediaPreview url={service.mediaUrl} alt={service.name} />
                        ) : (
                          <div className="h-10 w-16 bg-muted rounded-sm flex items-center justify-center text-xs text-muted-foreground">No Media</div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>
                        <Badge variant={service.isPremium ? 'default' : 'secondary'}>
                          {service.isPremium ? 'Premium' : 'Basic'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={service.isOptional ? 'outline' : 'secondary'}>
                          {service.isOptional ? 'Optional' : 'Included'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-xs">{service.description}</TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => openEditDialog(service as Service)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                        </Button>
                         <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(service as Service)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                            <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No services found. Add one to get started.
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
                  <DialogTitle>Edit Service: {editingService?.name}</DialogTitle>
                  <DialogDescription>
                    Make changes to the service content below. Click save when you're done.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                      <FormField control={editForm.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Service Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                      <FormField control={editForm.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Description</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                      <FormItem>
                          <FormLabel>Media Asset</FormLabel>
                          <div className="flex items-center gap-4">
                              {editForm.watch('mediaUrl') && (
                                  <div className="relative">
                                      <MediaPreview url={editForm.watch('mediaUrl')!} alt={editForm.watch('name')} />
                                  </div>
                              )}
                              <FormControl className="flex-1">
                                  <Input type="file" accept="image/*,video/*,.mov" onChange={(e) => { if (e.target.files?.[0]) { setMediaFile(e.target.files[0]) } }}/>
                              </FormControl>
                          </div>
                          <FormMessage />
                      </FormItem>
                      <FormField
                        control={editForm.control}
                        name="isPremium"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Premium Service</FormLabel>
                              <FormMessage />
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="isOptional"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Optional Service</FormLabel>
                              <FormMessage />
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
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
              This will permanently delete the service <span className="font-semibold">{serviceToDelete?.name}</span> and all its associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteService} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

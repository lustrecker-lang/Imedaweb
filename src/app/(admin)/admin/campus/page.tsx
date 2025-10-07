

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, useStorage } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Trash2, Edit, X, Plus, User } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const featureSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Feature name is required"),
    description: z.string().optional(),
    mediaUrl: z.string().optional(),
});

const faqSchema = z.object({
    id: z.string(),
    question: z.string().min(1, "Question is required"),
    answer: z.string().optional(),
});

const courseSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Course name is required"),
    description: z.string().optional(),
})

const formSchema = z.object({
  name: z.string().min(1, 'Campus name is required.'),
  slug: z.string().min(1, 'Slug is required.'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  hero: z.object({
    backgroundMediaUrl: z.string().optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
  }).optional(),
  campusDescription: z.object({
    headline: z.string().optional(),
    body: z.string().optional(),
  }).optional(),
  bannerSection: z.object({
    title: z.string().optional(),
    text: z.string().optional(),
    mediaUrl: z.string().optional(),
  }).optional(),
  academicOffering: z.object({
      headline: z.string().optional(),
      subtitle: z.string().optional(),
      courses: z.array(courseSchema).optional(),
  }).optional(),
  campusExperience: z.object({
      headline: z.string().optional(),
      features: z.array(featureSchema).optional(),
  }).optional(),
  visitAndContact: z.object({
      headline: z.string().optional(),
      subtitle: z.string().optional(),
      address: z.string().optional(),
      name: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email({ message: "Invalid email format" }).optional().or(z.literal('')),
      imageUrl: z.string().optional(),
  }).optional(),
  faq: z.object({
      headline: z.string().optional(),
      faqs: z.array(faqSchema).optional(),
  }).optional(),
});

interface Campus extends z.infer<typeof formSchema> {
  id: string;
}

// Function to generate a URL-friendly slug
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with -
    .replace(/(^-|-$)+/g, '');   // Remove leading/trailing dashes
};

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


export default function CampusPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [heroBgFile, setHeroBgFile] = useState<File | null>(null);
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [featureFiles, setFeatureFiles] = useState<(File | null)[]>([]);
  const [contactImageFile, setContactImageFile] = useState<File | null>(null);

  const [campusToDelete, setCampusToDelete] = useState<Campus | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const campusesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'campuses'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: campuses, isLoading: areCampusesLoading } = useCollection<Omit<Campus, 'id'>>(campusesQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', slug: '', description: '', imageUrl: '' },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const { fields: featureFields, append: appendFeature, remove: removeFeature } = useFieldArray({
    control: editForm.control,
    name: "campusExperience.features",
  });

  const { fields: faqFields, append: appendFaq, remove: removeFaq } = useFieldArray({
    control: editForm.control,
    name: "faq.faqs",
  });

  // Watch the name field in the "add" form to auto-generate the slug
  const addCampusName = form.watch('name');
  useEffect(() => {
    if (addCampusName) {
      form.setValue('slug', generateSlug(addCampusName), { shouldValidate: true });
    }
  }, [addCampusName, form]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);
  
  useEffect(() => {
    if (editingCampus) {
      const defaultValues: z.infer<typeof formSchema> = {
        name: editingCampus.name || '',
        slug: editingCampus.slug || '',
        description: editingCampus.description || '',
        imageUrl: editingCampus.imageUrl || '',
        ogTitle: editingCampus.ogTitle || '',
        ogDescription: editingCampus.ogDescription || '',
        ogImage: editingCampus.ogImage || '',
        hero: {
          title: editingCampus.hero?.title || '',
          subtitle: editingCampus.hero?.subtitle || '',
          backgroundMediaUrl: editingCampus.hero?.backgroundMediaUrl || '',
        },
        campusDescription: {
          headline: editingCampus.campusDescription?.headline || '',
          body: editingCampus.campusDescription?.body || '',
        },
        bannerSection: {
            title: editingCampus.bannerSection?.title || '',
            text: editingCampus.bannerSection?.text || '',
            mediaUrl: editingCampus.bannerSection?.mediaUrl || '',
        },
        academicOffering: {
          headline: editingCampus.academicOffering?.headline || '',
          subtitle: editingCampus.academicOffering?.subtitle || '',
          courses: editingCampus.academicOffering?.courses || [],
        },
        campusExperience: {
          headline: editingCampus.campusExperience?.headline || '',
          features: editingCampus.campusExperience?.features || [],
        },
        visitAndContact: {
          headline: editingCampus.visitAndContact?.headline || '',
          subtitle: editingCampus.visitAndContact?.subtitle || '',
          address: editingCampus.visitAndContact?.address || '',
          name: editingCampus.visitAndContact?.name || '',
          title: editingCampus.visitAndContact?.title || '',
          description: editingCampus.visitAndContact?.description || '',
          phone: editingCampus.visitAndContact?.phone || '',
          email: editingCampus.visitAndContact?.email || '',
          imageUrl: editingCampus.visitAndContact?.imageUrl || '',
        },
        faq: {
          headline: editingCampus.faq?.headline || '',
          faqs: editingCampus.faq?.faqs || [],
        },
      };
      editForm.reset(defaultValues);
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
    let heroBackgroundMediaUrl = values.hero?.backgroundMediaUrl;
    let contactImageUrl = values.visitAndContact?.imageUrl;
    let ogImageUrl = values.ogImage;
    let bannerMediaUrl = values.bannerSection?.mediaUrl;

    if (imageFile) {
      if (editingCampus.imageUrl && storage) {
        try { const oldImageRef = ref(storage, editingCampus.imageUrl); await deleteObject(oldImageRef); } catch (error) { console.error("Error deleting old image: ", error); }
      }
      imageUrl = await handleFileUpload(imageFile) || editingCampus.imageUrl;
    }

    if (heroBgFile) {
      if (editingCampus.hero?.backgroundMediaUrl && storage) {
        try { const oldImageRef = ref(storage, editingCampus.hero.backgroundMediaUrl); await deleteObject(oldImageRef); } catch (error) { console.error("Error deleting old hero background: ", error); }
      }
      heroBackgroundMediaUrl = await handleFileUpload(heroBgFile) || editingCampus.hero?.backgroundMediaUrl;
    }
    
    if (bannerFile) {
        if (editingCampus.bannerSection?.mediaUrl && storage) {
          try { const oldImageRef = ref(storage, editingCampus.bannerSection.mediaUrl); await deleteObject(oldImageRef); } catch (error) { console.error("Error deleting old banner media: ", error); }
        }
        bannerMediaUrl = await handleFileUpload(bannerFile) || editingCampus.bannerSection?.mediaUrl;
    }

    if (ogImageFile) {
        if (editingCampus.ogImage && storage) {
          try { const oldImageRef = ref(storage, editingCampus.ogImage); await deleteObject(oldImageRef); } catch (error) { console.error("Error deleting old OG image: ", error); }
        }
        ogImageUrl = await handleFileUpload(ogImageFile) || editingCampus.ogImage;
    }

    if (contactImageFile) {
        if (editingCampus.visitAndContact?.imageUrl && storage) {
          try { const oldImageRef = ref(storage, editingCampus.visitAndContact.imageUrl); await deleteObject(oldImageRef); } catch (error) { console.error("Error deleting old contact image: ", error); }
        }
        contactImageUrl = await handleFileUpload(contactImageFile) || editingCampus.visitAndContact?.imageUrl;
      }

    const updatedFeatures = [...(values.campusExperience?.features || [])];
    for (let i = 0; i < featureFiles.length; i++) {
        const file = featureFiles[i];
        if (file && updatedFeatures[i]) {
            if(updatedFeatures[i].mediaUrl && storage) {
                try { const oldImageRef = ref(storage, updatedFeatures[i].mediaUrl!); await deleteObject(oldImageRef); } catch (error) { console.error(`Error deleting old feature media at index ${i}: `, error); }
            }
            const newMediaUrl = await handleFileUpload(file);
            if(newMediaUrl) { updatedFeatures[i].mediaUrl = newMediaUrl; }
        }
    }
    
    const docRef = doc(firestore, 'campuses', editingCampus.id);
    const dataToSave = { 
      ...values, 
      imageUrl,
      ogImage: ogImageUrl,
      hero: { ...values.hero, backgroundMediaUrl: heroBackgroundMediaUrl },
      bannerSection: { ...values.bannerSection, mediaUrl: bannerMediaUrl },
      campusExperience: { ...values.campusExperience, features: updatedFeatures },
      visitAndContact: { ...values.visitAndContact, imageUrl: contactImageUrl }
    };
    
    setDocumentNonBlocking(docRef, dataToSave, { merge: true });

    toast({
      title: 'Success!',
      description: `Campus "${values.name}" has been updated.`,
    });

    setIsEditDialogOpen(false);
    setEditingCampus(null);
    setImageFile(null);
    setHeroBgFile(null);
    setOgImageFile(null);
    setBannerFile(null);
    setFeatureFiles([]);
    setContactImageFile(null);
  };
  
  const handleRemoveImage = async (field: keyof Campus | `hero.backgroundMediaUrl` | `campusExperience.features.${number}.mediaUrl` | 'visitAndContact.imageUrl' | 'ogImage' | 'bannerSection.mediaUrl', index?: number) => {
    if (!firestore || !editingCampus) return;

    let imageUrl: string | undefined;

    if (field === 'imageUrl') imageUrl = editingCampus.imageUrl;
    else if (field === 'hero.backgroundMediaUrl') imageUrl = editingCampus.hero?.backgroundMediaUrl;
    else if (field === 'visitAndContact.imageUrl') imageUrl = editingCampus.visitAndContact?.imageUrl;
    else if (field === 'ogImage') imageUrl = editingCampus.ogImage;
    else if (field === 'bannerSection.mediaUrl') imageUrl = editingCampus.bannerSection?.mediaUrl;
    else if (typeof index === 'number' && field.startsWith('campusExperience.features')) imageUrl = editingCampus.campusExperience?.features?.[index]?.mediaUrl;

    if (!imageUrl) return;

    if (storage) {
        try { await deleteObject(ref(storage, imageUrl)); } catch (error) { console.error("Error deleting image from storage: ", error); }
    }
    
    const docRef = doc(firestore, 'campuses', editingCampus.id);
    let updatedData: any = {};
    if (field === 'imageUrl') { updatedData = { imageUrl: '' }; editForm.setValue('imageUrl', ''); setEditingCampus(prev => prev ? { ...prev, imageUrl: '' } : null); } 
    else if (field === 'hero.backgroundMediaUrl') { updatedData = { 'hero.backgroundMediaUrl': '' }; editForm.setValue('hero.backgroundMediaUrl', ''); setEditingCampus(prev => prev ? { ...prev, hero: { ...prev.hero, backgroundMediaUrl: '' } } : null); }
    else if (field === 'ogImage') { updatedData = { 'ogImage': '' }; editForm.setValue('ogImage', ''); setEditingCampus(prev => prev ? { ...prev, ogImage: '' } : null); }
    else if (field === 'bannerSection.mediaUrl') { updatedData = { 'bannerSection.mediaUrl': '' }; editForm.setValue('bannerSection.mediaUrl', ''); setEditingCampus(prev => prev ? { ...prev, bannerSection: { ...prev.bannerSection, mediaUrl: ''} } : null); }
    else if (field === 'visitAndContact.imageUrl') { updatedData = { 'visitAndContact.imageUrl': '' }; editForm.setValue('visitAndContact.imageUrl', ''); setEditingCampus(prev => prev ? { ...prev, visitAndContact: { ...prev.visitAndContact, imageUrl: ''} } : null); }
    else if (typeof index === 'number' && field.startsWith('campusExperience.features')) {
        const features = [...(editingCampus.campusExperience?.features || [])];
        if(features[index]) {
            features[index].mediaUrl = '';
            updatedData = { campusExperience: { ...editingCampus.campusExperience, features } };
            const updatedFormFeatures = editForm.getValues('campusExperience.features');
            if(updatedFormFeatures && updatedFormFeatures[index]) { updatedFormFeatures[index].mediaUrl = ''; editForm.setValue('campusExperience.features', updatedFormFeatures); }
            setEditingCampus(prev => prev ? { ...prev, campusExperience: { ...prev.campusExperience, features: features } } : null);
        }
    }

    if (Object.keys(updatedData).length > 0) { setDocumentNonBlocking(docRef, updatedData, { merge: true }); }
    
    toast({ title: 'Image Removed', description: 'The image has been removed.' });
  }

  const openDeleteDialog = (campus: Campus) => {
    setCampusToDelete(campus);
    setIsDeleteDialogOpen(true);
  };
  
  const openEditDialog = (campus: Campus) => {
    setEditingCampus(campus);
    setIsEditDialogOpen(true);
    setImageFile(null);
    setHeroBgFile(null);
    setOgImageFile(null);
    setBannerFile(null);
    setFeatureFiles([]);
    setContactImageFile(null);
  };

  const handleDeleteCampus = () => {
    if (!firestore || !campusToDelete) return;
    
    if (campusToDelete.imageUrl && storage) deleteObject(ref(storage, campusToDelete.imageUrl)).catch(error => console.error("Error deleting image: ", error));
    if (campusToDelete.hero?.backgroundMediaUrl && storage) deleteObject(ref(storage, campusToDelete.hero.backgroundMediaUrl)).catch(error => console.error("Error deleting hero image: ", error));
    if (campusToDelete.ogImage && storage) deleteObject(ref(storage, campusToDelete.ogImage)).catch(error => console.error("Error deleting OG image: ", error));
    if (campusToDelete.bannerSection?.mediaUrl && storage) deleteObject(ref(storage, campusToDelete.bannerSection.mediaUrl)).catch(error => console.error("Error deleting banner image: ", error));
    if (campusToDelete.visitAndContact?.imageUrl && storage) deleteObject(ref(storage, campusToDelete.visitAndContact.imageUrl)).catch(error => console.error("Error deleting contact image: ", error));
    campusToDelete.campusExperience?.features?.forEach(f => {
      if(f.mediaUrl && storage) deleteObject(ref(storage, f.mediaUrl)).catch(error => console.error(`Error deleting feature image ${f.mediaUrl}: `, error));
    });

    const docRef = doc(firestore, 'campuses', campusToDelete.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Campus Deleted", description: "The campus has been permanently deleted." });
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
                            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Campus Name</FormLabel> <FormControl> <Input placeholder="e.g., Paris" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                            <FormField control={form.control} name="slug" render={({ field }) => ( <FormItem> <FormLabel>Slug</FormLabel> <FormControl> <Input placeholder="e.g., paris" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Description (for menus)</FormLabel> <FormControl> <Textarea placeholder="A short description of the campus." {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                            <FormItem>
                                <FormLabel>Campus Media (for listings)</FormLabel>
                                <FormControl>
                                  <Input id="campus-image-input" type="file" accept="image/*,video/*,.mov" onChange={(e) => { if (e.target.files?.[0]) { setImageFile(e.target.files[0]); } }} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                             <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                <Button type="submit" disabled={form.formState.isSubmitting}> {form.formState.isSubmitting ? 'Saving...' : 'Save Campus'} </Button>
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
                  <TableHead>Slug</TableHead>
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
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : campuses && campuses.length > 0 ? (
                  campuses.map((campus) => (
                    <TableRow key={campus.id}>
                      <TableCell>{campus.imageUrl ? ( <MediaPreview url={campus.imageUrl} alt={campus.name} /> ) : ( <div className="h-10 w-16 bg-muted rounded-sm flex items-center justify-center text-xs text-muted-foreground">No Media</div> )}</TableCell>
                      <TableCell className="font-medium">{campus.name}</TableCell>
                      <TableCell className="font-mono text-xs">{campus.slug}</TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => openEditDialog(campus as Campus)}><Edit className="h-4 w-4" /><span className="sr-only">Edit</span></Button>
                         <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(campus as Campus)}><Trash2 className="h-4 w-4 text-red-600" /><span className="sr-only">Delete</span></Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center"> No campuses found. Add one to get started. </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
              <SheetHeader>
                  <SheetTitle>Edit Campus: {editingCampus?.name}</SheetTitle>
                  <SheetDescription> Make changes to the campus content below. Click save when you're done. </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                      <Accordion type="multiple" defaultValue={['info']} className="w-full">
                        <AccordionItem value="info">
                           <AccordionTrigger>Campus Information</AccordionTrigger>
                           <AccordionContent className="space-y-4 p-1">
                              <FormField control={editForm.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Campus Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                              <FormField control={editForm.control} name="slug" render={({ field }) => ( <FormItem> <FormLabel>Slug</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                              <FormField control={editForm.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Description (for nav menus)</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                              <FormItem>
                                  <FormLabel>Campus Media (for listings)</FormLabel>
                                  <div className="flex items-center gap-4">
                                      {editForm.watch('imageUrl') && ( <div className="relative"> <MediaPreview url={editForm.watch('imageUrl')!} alt={editForm.watch('name')} /> <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => handleRemoveImage('imageUrl')}> <X className="h-4 w-4" /> </Button> </div> )}
                                      <FormControl>
                                        <Input type="file" accept="image/*,video/*,.mov" onChange={(e) => { if (e.target.files?.[0]) { setImageFile(e.target.files[0]) } }}/>
                                      </FormControl>
                                  </div>
                                  <FormMessage />
                              </FormItem>
                           </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="hero">
                           <AccordionTrigger>Hero Section</AccordionTrigger>
                           <AccordionContent className="space-y-4 p-1">
                                <FormField control={editForm.control} name="hero.title" render={({ field }) => ( <FormItem> <FormLabel>Hero Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <FormField control={editForm.control} name="hero.subtitle" render={({ field }) => ( <FormItem> <FormLabel>Hero Subtitle</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <FormItem>
                                  <FormLabel>Background Media</FormLabel>
                                  <div className="flex items-center gap-4">
                                      {editForm.watch('hero.backgroundMediaUrl') && ( <div className="relative"> <MediaPreview url={editForm.watch('hero.backgroundMediaUrl')!} alt="Hero Background"/> <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => handleRemoveImage('hero.backgroundMediaUrl')}> <X className="h-4 w-4" /> </Button> </div> )}
                                      <FormControl>
                                        <Input type="file" accept="image/*,video/*" onChange={(e) => { if (e.target.files?.[0]) { setHeroBgFile(e.target.files[0]) } }}/>
                                      </FormControl>
                                  </div>
                                  <FormMessage />
                              </FormItem>
                           </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="description-section">
                           <AccordionTrigger>Campus Description Section</AccordionTrigger>
                           <AccordionContent className="space-y-4 p-1">
                                <FormField control={editForm.control} name="campusDescription.headline" render={({ field }) => ( <FormItem> <FormLabel>Headline</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <FormField control={editForm.control} name="campusDescription.body" render={({ field }) => ( <FormItem> <FormLabel>Body Text</FormLabel> <FormControl><Textarea {...field} rows={5} /></FormControl> <FormMessage /> </FormItem> )}/>
                           </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="banner-section">
                            <AccordionTrigger>Banner Section</AccordionTrigger>
                            <AccordionContent className="space-y-4 p-1">
                                <FormField control={editForm.control} name="bannerSection.title" render={({ field }) => ( <FormItem> <FormLabel>Banner Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <FormField control={editForm.control} name="bannerSection.text" render={({ field }) => ( <FormItem> <FormLabel>Banner Text</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <FormItem>
                                    <FormLabel>Banner Media</FormLabel>
                                    <div className="flex items-center gap-4">
                                        {editForm.watch('bannerSection.mediaUrl') && ( <div className="relative"> <MediaPreview url={editForm.watch('bannerSection.mediaUrl')!} alt="Banner Media"/> <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => handleRemoveImage('bannerSection.mediaUrl')}> <X className="h-4 w-4" /> </Button> </div> )}
                                        <FormControl>
                                            <Input type="file" accept="image/*,video/*" onChange={(e) => { if (e.target.files?.[0]) { setBannerFile(e.target.files[0]) } }}/>
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="academics">
                           <AccordionTrigger>Academic Offering</AccordionTrigger>
                           <AccordionContent className="space-y-4 p-1">
                                <FormField control={editForm.control} name="academicOffering.headline" render={({ field }) => ( <FormItem> <FormLabel>Headline</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <FormField control={editForm.control} name="academicOffering.subtitle" render={({ field }) => ( <FormItem> <FormLabel>Subtitle</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                {/* Course list management will be added later */}
                           </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="experience">
                           <AccordionTrigger>Campus Experience</AccordionTrigger>
                           <AccordionContent className="space-y-4 p-1">
                                <FormField control={editForm.control} name="campusExperience.headline" render={({ field }) => ( <FormItem> <FormLabel>Features Section Headline</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <div className="space-y-4">
                                    <FormLabel>Features</FormLabel>
                                    {featureFields.map((field, index) => (
                                        <div key={field.id} className="p-4 border rounded-md space-y-2 relative">
                                             <Button type="button" variant="destructive" size="icon" onClick={() => removeFeature(index)} className="absolute top-2 right-2 h-6 w-6"> <Trash2 className="h-4 w-4" /> </Button>
                                            <FormField control={editForm.control} name={`campusExperience.features.${index}.name`} render={({ field }) => ( <FormItem> <FormLabel>Feature Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                            <FormField control={editForm.control} name={`campusExperience.features.${index}.description`} render={({ field }) => ( <FormItem> <FormLabel>Description</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                            <FormItem>
                                                <FormLabel>Image or Video</FormLabel>
                                                <div className="flex items-center gap-4">
                                                     {editForm.watch(`campusExperience.features.${index}.mediaUrl`) && ( <div className="relative"> <MediaPreview url={editForm.watch(`campusExperience.features.${index}.mediaUrl`)!} alt={`Feature ${index + 1}`} /> <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => handleRemoveImage(`campusExperience.features.${index}.mediaUrl`, index)}> <X className="h-4 w-4" /> </Button> </div> )}
                                                    <FormControl>
                                                      <Input type="file" accept="image/*,video/*" onChange={(e) => { if (e.target.files?.[0]) { const newFiles = [...featureFiles]; newFiles[index] = e.target.files[0]; setFeatureFiles(newFiles); } }}/>
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={() => appendFeature({ id: uuidv4(), name: '', description: '', mediaUrl: '' })}> <Plus className="mr-2 h-4 w-4" /> Add Feature </Button>
                                </div>
                           </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="visit">
                           <AccordionTrigger>Visit</AccordionTrigger>
                           <AccordionContent className="space-y-4 p-1">
                                <FormField control={editForm.control} name="visitAndContact.headline" render={({ field }) => ( <FormItem> <FormLabel>Location Headline</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <FormField control={editForm.control} name="visitAndContact.subtitle" render={({ field }) => ( <FormItem> <FormLabel>Location Subtitle</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <FormField control={editForm.control} name="visitAndContact.address" render={({ field }) => ( <FormItem> <FormLabel>Address</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="contact-person">
                            <AccordionTrigger>Contact Person</AccordionTrigger>
                            <AccordionContent className="space-y-4 p-1">
                                <FormField control={editForm.control} name="visitAndContact.name" render={({ field }) => ( <FormItem> <FormLabel>Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <FormField control={editForm.control} name="visitAndContact.title" render={({ field }) => ( <FormItem> <FormLabel>Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <FormField control={editForm.control} name="visitAndContact.description" render={({ field }) => ( <FormItem> <FormLabel>Description</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <FormField control={editForm.control} name="visitAndContact.phone" render={({ field }) => ( <FormItem> <FormLabel>Phone</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <FormField control={editForm.control} name="visitAndContact.email" render={({ field }) => ( <FormItem> <FormLabel>Email</FormLabel> <FormControl><Input type="email" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <FormItem>
                                    <FormLabel>Contact Person Image</FormLabel>
                                    <div className="flex items-center gap-4">
                                        {editForm.watch('visitAndContact.imageUrl') && ( <div className="relative"> <Image src={editForm.watch('visitAndContact.imageUrl')!} alt="Contact Person" width={80} height={80} className="object-cover rounded-full" /> <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => handleRemoveImage('visitAndContact.imageUrl')}><X className="h-4 w-4" /></Button> </div> )}
                                        <FormControl>
                                            <Input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) { setContactImageFile(e.target.files[0]) } }}/>
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="faq">
                           <AccordionTrigger>Help &amp; Information (FAQ)</AccordionTrigger>
                           <AccordionContent className="space-y-4 p-1">
                                <FormField control={editForm.control} name="faq.headline" render={({ field }) => ( <FormItem> <FormLabel>FAQ Section Headline</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <div className="space-y-4">
                                    <FormLabel>FAQs</FormLabel>
                                    {faqFields.map((field, index) => (
                                        <div key={field.id} className="p-4 border rounded-md space-y-2 relative">
                                            <Button type="button" variant="destructive" size="icon" onClick={() => removeFaq(index)} className="absolute top-2 right-2 h-6 w-6"> <Trash2 className="h-4 w-4" /> </Button>
                                            <FormField control={editForm.control} name={`faq.faqs.${index}.question`} render={({ field }) => ( <FormItem> <FormLabel>Question</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                            <FormField control={editForm.control} name={`faq.faqs.${index}.answer`} render={({ field }) => ( <FormItem> <FormLabel>Answer</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={() => appendFaq({ id: uuidv4(), question: '', answer: '' })}> <Plus className="mr-2 h-4 w-4" /> Add FAQ </Button>
                                </div>
                           </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="social">
                          <AccordionTrigger>Social Media / SEO</AccordionTrigger>
                          <AccordionContent className="space-y-4 p-1">
                            <FormField control={editForm.control} name="ogTitle" render={({ field }) => ( <FormItem> <FormLabel>Social Media Title</FormLabel> <FormControl><Input {...field} placeholder="Title for social sharing..."/></FormControl> <FormMessage /> </FormItem> )}/>
                            <FormField control={editForm.control} name="ogDescription" render={({ field }) => ( <FormItem> <FormLabel>Social Media Description</FormLabel> <FormControl><Textarea {...field} placeholder="Description for social sharing..."/></FormControl> <FormMessage /> </FormItem> )}/>
                            <FormItem>
                                <FormLabel>Social Media Image</FormLabel>
                                <div className="flex items-center gap-4">
                                    {editForm.watch('ogImage') && ( <div className="relative w-24 h-24"> <Image src={editForm.watch('ogImage')!} alt="OG Image" layout="fill" className="object-cover rounded-md" /> <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => handleRemoveImage('ogImage')}> <X className="h-4 w-4" /> </Button> </div> )}
                                    <FormControl>
                                      <Input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) { setOgImageFile(e.target.files[0]) } }}/>
                                    </FormControl>
                                </div>
                                <FormMessage />
                            </FormItem>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>

                      <SheetFooter className="pt-4 sticky bottom-0 bg-background py-4">
                          <SheetClose asChild><Button type="button" variant="outline">Cancel</Button></SheetClose>
                          <Button type="submit" disabled={editForm.formState.isSubmitting}>{editForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
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
            <AlertDialogDescription> This will permanently delete the campus <span className="font-semibold">{campusToDelete?.name}</span> and all its associated data. This action cannot be undone. </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCampus} className="bg-destructive hover:bg-destructive/90"> Delete </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

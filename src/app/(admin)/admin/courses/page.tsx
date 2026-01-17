
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, useStorage } from '@/firebase';
import { collection, doc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import courseData from './importcourse.json';
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import Image from 'next/image';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
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
import { ScrollArea } from '@/components/ui/scroll-area';

// Schemas
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required."),
  description: z.string().optional(),
  mediaUrl: z.string().optional(),
  isOnline: z.boolean().default(false).optional(),
});

const themeSchema = z.object({
  name: z.string().min(1, "Theme name is required."),
  description: z.string().optional(),
  isOnline: z.boolean().default(false).optional(),
  categoryId: z.string(),
});

const formationSchema = z.object({
  name: z.string().min(1, "Formation name is required."),
  themeId: z.string(),
  formationId: z.string().min(1, "Formation ID is required."),
  description: z.string().optional(),
  isOnline: z.boolean().default(false).optional(),
  objectifPedagogique: z.string().optional(),
  preRequis: z.string().optional(),
  publicConcerne: z.string().optional(),
  methodesMobilisees: z.string().optional(),
  moyensPedagogiques: z.string().optional(),
  modalitesEvaluation: z.string().optional(),
  prixAvecHebergement: z.string().optional(),
  prixSansHebergement: z.string().optional(),
  pricePerMonth: z.string().optional(),
  durationMonths: z.string().optional(),
  format: z.string().optional(),
  accessibilite: z.string().optional(),
  duree: z.string().optional(),
  modalitesDelaisAcces: z.string().optional(),
  tarifs: z.string().optional(),
  contacts: z.string().optional(),
  objectifsPedagogiques: z.string().optional(),
});

const moduleSchema = z.object({
  name: z.string().min(1, "Module name is required."),
  description: z.string().optional(),
  formationId: z.string(),
});

// Interfaces
interface Category extends z.infer<typeof categorySchema> {
  id: string;
}

interface Theme extends z.infer<typeof themeSchema> {
  id: string;
}

interface Formation extends z.infer<typeof formationSchema> {
  id: string;
  Theme?: string;
  Formation?: string;
  FormationID?: string;
  'Objectif Pédagogique'?: string;
  'Pré-requis'?: string;
  'Public Concerné'?: string;
  'Méthodes Mobilisées'?: string;
  'Moyens Pédagogiques'?: string;
  'Modalités d\'Évaluation'?: string;
  'Prix avec hebergement'?: string;
  'Prix sans hebergement'?: string;
  Format?: string;
  pricePerMonth?: string;
  durationMonths?: string;
}

interface Module extends z.infer<typeof moduleSchema> {
  id: string;
}

// Interfaces
interface Category extends z.infer<typeof categorySchema> {
  id: string;
}

interface Theme extends z.infer<typeof themeSchema> {
  id: string;
}

interface Formation extends z.infer<typeof formationSchema> {
  id: string;
}

interface Module extends z.infer<typeof moduleSchema> {
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

import { Switch } from '@/components/ui/switch';

export default function CoursesPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  // State Management
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);

  const [categoryMediaFile, setCategoryMediaFile] = useState<File | null>(null);

  const [isCategoryAddDialogOpen, setIsCategoryAddDialogOpen] = useState(false);
  const [isCategoryEditDialogOpen, setIsCategoryEditDialogOpen] = useState(false);
  const [isCategoryDeleteDialogOpen, setIsCategoryDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const [isThemeAddDialogOpen, setIsThemeAddDialogOpen] = useState(false);
  const [isThemeEditDialogOpen, setIsThemeEditDialogOpen] = useState(false);
  const [isThemeDeleteDialogOpen, setIsThemeDeleteDialogOpen] = useState(false);
  const [editingTheme, setThemeToEdit] = useState<Theme | null>(null);
  const [themeToDelete, setThemeToDelete] = useState<Theme | null>(null);

  const [isFormationAddDialogOpen, setIsFormationAddDialogOpen] = useState(false);
  const [isFormationEditDialogOpen, setIsFormationEditDialogOpen] = useState(false);
  const [isFormationDeleteDialogOpen, setIsFormationDeleteDialogOpen] = useState(false);
  const [editingFormation, setEditingFormation] = useState<Formation | null>(null);
  const [formationToDelete, setFormationToDelete] = useState<Formation | null>(null);

  const [isModuleAddDialogOpen, setIsModuleAddDialogOpen] = useState(false);
  const [isModuleEditDialogOpen, setIsModuleEditDialogOpen] = useState(false);
  const [isModuleDeleteDialogOpen, setIsModuleDeleteDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);


  // Firestore Queries
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'course_categories'), orderBy('name', 'asc'));
  }, [firestore]);

  const themesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedCategory) return null;
    return query(collection(firestore, 'course_themes'), where('categoryId', '==', selectedCategory.id), orderBy('name', 'asc'));
  }, [firestore, selectedCategory]);

  const formationsQuery = useMemoFirebase(() => {
    if (!firestore || !selectedTheme) return null;
    return query(collection(firestore, 'course_formations'), where('themeId', '==', selectedTheme.id), orderBy('name', 'asc'));
  }, [firestore, selectedTheme]);

  const modulesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedFormation) return null;
    return query(collection(firestore, 'course_modules'), where('formationId', '==', selectedFormation.id), orderBy('name', 'asc'));
  }, [firestore, selectedFormation]);

  const { data: categories, isLoading: areCategoriesLoading } = useCollection<Omit<Category, 'id'>>(categoriesQuery);
  const { data: themes, isLoading: areThemesLoading } = useCollection<Omit<Theme, 'id'>>(themesQuery);
  const { data: formations, isLoading: areFormationsLoading } = useCollection<Omit<Formation, 'id'>>(formationsQuery);
  const { data: modules, isLoading: areModulesLoading } = useCollection<Omit<Module, 'id'>>(modulesQuery);

  // Forms
  const addCategoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '', mediaUrl: '', isOnline: false },
  });

  const editCategoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {},
  });

  const themeFormSchema = themeSchema.omit({ categoryId: true });
  const addThemeForm = useForm<z.infer<typeof themeFormSchema>>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: { name: '', description: '', isOnline: false },
  });

  const editThemeForm = useForm<z.infer<typeof themeFormSchema>>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: {},
  });

  const formationFormSchema = formationSchema.omit({ themeId: true });
  const addFormationForm = useForm<z.infer<typeof formationFormSchema>>({
    resolver: zodResolver(formationFormSchema),
    defaultValues: {
      name: '',
      formationId: '',
      isOnline: false,
      objectifPedagogique: '',
      preRequis: '',
      publicConcerne: '',
      methodesMobilisees: '',
      moyensPedagogiques: '',
      modalitesEvaluation: '',
      prixAvecHebergement: '',
      prixSansHebergement: '',
      pricePerMonth: '',
      durationMonths: '',
      format: '',
    },
  });

  const editFormationForm = useForm<z.infer<typeof formationFormSchema>>({
    resolver: zodResolver(formationFormSchema),
    defaultValues: {},
  });

  const moduleFormSchema = moduleSchema.omit({ formationId: true });
  const addModuleForm = useForm<z.infer<typeof moduleFormSchema>>({
    resolver: zodResolver(moduleFormSchema),
    defaultValues: { name: '', description: '' },
  });

  const editModuleForm = useForm<z.infer<typeof moduleFormSchema>>({
    resolver: zodResolver(moduleFormSchema),
    defaultValues: {},
  });


  // Effects
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (editingCategory) {
      editCategoryForm.reset(editingCategory);
    }
  }, [editingCategory, editCategoryForm]);

  useEffect(() => {
    if (editingTheme) {
      editThemeForm.reset(editingTheme);
    }
  }, [editingTheme, editThemeForm]);

  useEffect(() => {
    if (editingFormation) {
      editFormationForm.reset({
        name: editingFormation.name,
        formationId: editingFormation.formationId,
        objectifPedagogique: editingFormation.objectifPedagogique || '',
        preRequis: editingFormation.preRequis || '',
        publicConcerne: editingFormation.publicConcerne || '',
        methodesMobilisees: editingFormation.methodesMobilisees || '',
        moyensPedagogiques: editingFormation.moyensPedagogiques || '',
        modalitesEvaluation: editingFormation.modalitesEvaluation || '',
        prixAvecHebergement: editingFormation.prixAvecHebergement || '',
        prixSansHebergement: editingFormation.prixSansHebergement || '',
        pricePerMonth: editingFormation.pricePerMonth || '',
        durationMonths: editingFormation.durationMonths || '',
        isOnline: editingFormation.isOnline || false,
        format: editingFormation.format || '',
      });
    }
  }, [editingFormation, editFormationForm]);

  useEffect(() => {
    if (editingModule) {
      editModuleForm.reset(editingModule);
    }
  }, [editingModule, editModuleForm]);

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
    const storageRef = ref(storage, `course-assets/${fileName}`);

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


  // Handlers for Category
  const onAddCategorySubmit = async (values: z.infer<typeof categorySchema>) => {
    if (!firestore) return;

    let mediaUrl = '';
    if (categoryMediaFile) {
      mediaUrl = await handleFileUpload(categoryMediaFile) || '';
    }

    const dataToSave = { ...values, mediaUrl };

    addDocumentNonBlocking(collection(firestore, 'course_categories'), dataToSave);
    toast({ title: 'Success!', description: 'New category has been added.' });
    addCategoryForm.reset();
    setCategoryMediaFile(null);
    setIsCategoryAddDialogOpen(false);
  };

  const onEditCategorySubmit = async (values: z.infer<typeof categorySchema>) => {
    if (!firestore || !editingCategory) return;

    let mediaUrl = editingCategory.mediaUrl;
    if (categoryMediaFile) {
      if (editingCategory.mediaUrl && storage) {
        try {
          const oldMediaRef = ref(storage, editingCategory.mediaUrl);
          await deleteObject(oldMediaRef);
        } catch (error) { console.error("Error deleting old media: ", error); }
      }
      mediaUrl = await handleFileUpload(categoryMediaFile) || editingCategory.mediaUrl;
    }
    const dataToSave = { ...values, mediaUrl };

    const docRef = doc(firestore, 'course_categories', editingCategory.id);
    setDocumentNonBlocking(docRef, dataToSave, { merge: true });
    toast({ title: 'Success!', description: 'Category has been updated.' });
    setIsCategoryEditDialogOpen(false);
    setEditingCategory(null);
    setCategoryMediaFile(null);
  };

  const openEditCategoryDialog = (category: Category) => {
    setEditingCategory(category);
    setCategoryMediaFile(null);
    setIsCategoryEditDialogOpen(true);
  };

  const openDeleteCategoryDialog = (category: Category) => {
    setCategoryToDelete(category);
    setIsCategoryDeleteDialogOpen(true);
  };

  const handleDeleteCategory = () => {
    if (!firestore || !categoryToDelete) return;

    if (categoryToDelete.mediaUrl && storage) {
      const mediaRef = ref(storage, categoryToDelete.mediaUrl);
      deleteObject(mediaRef).catch(error => console.error("Error deleting media: ", error));
    }

    // TODO: Add logic to delete sub-collections (themes, etc.) if required
    const docRef = doc(firestore, 'course_categories', categoryToDelete.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Category Deleted", description: "The category has been permanently deleted." });
    setIsCategoryDeleteDialogOpen(false);
    if (selectedCategory?.id === categoryToDelete.id) {
      setSelectedCategory(null);
      setSelectedTheme(null);
      setSelectedFormation(null);
    }
    setCategoryToDelete(null);
  };

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    setSelectedTheme(null);
    setSelectedFormation(null);
  }

  // Handlers for Theme
  const onAddThemeSubmit = async (values: z.infer<typeof themeFormSchema>) => {
    if (!firestore || !selectedCategory) return;
    const dataToSave = { ...values, categoryId: selectedCategory.id };
    addDocumentNonBlocking(collection(firestore, 'course_themes'), dataToSave);
    toast({ title: 'Success!', description: 'New theme has been added.' });
    addThemeForm.reset();
    setIsThemeAddDialogOpen(false);
  };

  const onEditThemeSubmit = async (values: z.infer<typeof themeFormSchema>) => {
    if (!firestore || !editingTheme) return;
    const docRef = doc(firestore, 'course_themes', editingTheme.id);
    setDocumentNonBlocking(docRef, values, { merge: true });
    toast({ title: 'Success!', description: 'Theme has been updated.' });
    setIsThemeEditDialogOpen(false);
    setThemeToEdit(null);
  };

  const openEditThemeDialog = (theme: Theme) => {
    setThemeToEdit(theme);
    setIsThemeEditDialogOpen(true);
  };

  const openDeleteThemeDialog = (theme: Theme) => {
    setThemeToDelete(theme);
    setIsThemeDeleteDialogOpen(true);
  };

  const handleDeleteTheme = () => {
    if (!firestore || !themeToDelete) return;
    const docRef = doc(firestore, 'course_themes', themeToDelete.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Theme Deleted", description: "The theme has been permanently deleted." });
    setIsThemeDeleteDialogOpen(false);
    if (selectedTheme?.id === themeToDelete.id) {
      setSelectedTheme(null);
      setSelectedFormation(null);
    }
    setThemeToDelete(null);
  };

  const handleSelectTheme = (theme: Theme) => {
    setSelectedTheme(theme);
    setSelectedFormation(null);
  }

  // Handlers for Formation
  const onAddFormationSubmit = async (values: z.infer<typeof formationFormSchema>) => {
    if (!firestore || !selectedTheme) return;
    const dataToSave = { ...values, themeId: selectedTheme.id };
    addDocumentNonBlocking(collection(firestore, 'course_formations'), dataToSave);
    toast({ title: 'Success!', description: 'New formation has been added.' });
    addFormationForm.reset();
    setIsFormationAddDialogOpen(false);
  };

  const onEditFormationSubmit = async (values: z.infer<typeof formationFormSchema>) => {
    if (!firestore || !editingFormation) return;
    const docRef = doc(firestore, 'course_formations', editingFormation.id);
    setDocumentNonBlocking(docRef, values, { merge: true });
    toast({ title: 'Success!', description: 'Formation has been updated.' });
    setIsFormationEditDialogOpen(false);
    setEditingFormation(null);
  };

  const openEditFormationDialog = (formation: Formation) => {
    setEditingFormation(formation);
    setIsFormationEditDialogOpen(true);
  };

  const openDeleteFormationDialog = (formation: Formation) => {
    setFormationToDelete(formation);
    setIsFormationDeleteDialogOpen(true);
  };

  const handleDeleteFormation = () => {
    if (!firestore || !formationToDelete) return;
    const docRef = doc(firestore, 'course_formations', formationToDelete.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Formation Deleted", description: "The formation has been permanently deleted." });
    setIsFormationDeleteDialogOpen(false);
    if (selectedFormation?.id === formationToDelete.id) {
      setSelectedFormation(null);
    }
    setFormationToDelete(null);
  };

  // Handlers for Module
  const onAddModuleSubmit = async (values: z.infer<typeof moduleFormSchema>) => {
    if (!firestore || !selectedFormation) return;
    const dataToSave = { ...values, formationId: selectedFormation.id };
    addDocumentNonBlocking(collection(firestore, 'course_modules'), dataToSave);
    toast({ title: 'Success!', description: 'New module has been added.' });
    addModuleForm.reset();
    setIsModuleAddDialogOpen(false);
  };

  const onEditModuleSubmit = async (values: z.infer<typeof moduleFormSchema>) => {
    if (!firestore || !editingModule) return;
    const docRef = doc(firestore, 'course_modules', editingModule.id);
    setDocumentNonBlocking(docRef, values, { merge: true });
    toast({ title: 'Success!', description: 'Module has been updated.' });
    setIsModuleEditDialogOpen(false);
    setEditingModule(null);
  };

  const openEditModuleDialog = (module: Module) => {
    setEditingModule(module);
    setIsModuleEditDialogOpen(true);
  };

  const openDeleteModuleDialog = (module: Module) => {
    setModuleToDelete(module);
    setIsModuleDeleteDialogOpen(true);
  };

  const handleDeleteModule = () => {
    if (!firestore || !moduleToDelete) return;
    const docRef = doc(firestore, 'course_modules', moduleToDelete.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Module Deleted", description: "The module has been permanently deleted." });
    setIsModuleDeleteDialogOpen(false);
    setModuleToDelete(null);
  };

  const handleSeedCourses = async () => {
    if (!firestore) return;
    toast({ title: "Seeding started...", description: "Please wait while the courses are being added." });

    let categoriesMap = new Map<string, string>();
    let themesMap = new Map<string, string>();

    for (const course of courseData) {
      let categoryId: string;
      // Handle Category
      if (categoriesMap.has(course.Category)) {
        categoryId = categoriesMap.get(course.Category)!;
      } else {
        const categoryQuery = query(collection(firestore, 'course_categories'), where('name', '==', course.Category));
        const categorySnapshot = await getDocs(categoryQuery);
        if (!categorySnapshot.empty) {
          categoryId = categorySnapshot.docs[0].id;
        } else {
          const categoryDoc = await addDocumentNonBlocking(collection(firestore, 'course_categories'), { name: course.Category });
          categoryId = categoryDoc!.id;
        }
        categoriesMap.set(course.Category, categoryId);
      }

      let themeId: string;
      const themeMapKey = `${categoryId}-${course.Theme}`;
      // Handle Theme
      if (themesMap.has(themeMapKey)) {
        themeId = themesMap.get(themeMapKey)!;
      } else {
        const themeQuery = query(collection(firestore, 'course_themes'), where('categoryId', '==', categoryId), where('name', '==', course.Theme));
        const themeSnapshot = await getDocs(themeQuery);
        if (!themeSnapshot.empty) {
          themeId = themeSnapshot.docs[0].id;
        } else {
          const themeDoc = await addDocumentNonBlocking(collection(firestore, 'course_themes'), { name: course.Theme, categoryId: categoryId });
          themeId = themeDoc!.id;
        }
        themesMap.set(themeMapKey, themeId);
      }

      // Handle Formation
      const formationData = {
        themeId: themeId,
        name: course.Formation,
        formationId: course.FormationID,
        objectifPedagogique: course['Objectif Pédagogique'],
        preRequis: course['Pré-requis'],
        publicConcerne: course['Public Concerné'],
        methodesMobilisees: course['Méthodes Mobilisées'],
        moyensPedagogiques: course['Moyens Pédagogiques'],
        modalitesEvaluation: course['Modalités d\'Évaluation'],
        prixAvecHebergement: course['Prix avec hebergement']?.toString() || '',
        prixSansHebergement: course['Prix sans hebergement']?.toString() || '',
        format: course.Format,
      };
      const formationDoc = await addDocumentNonBlocking(collection(firestore, 'course_formations'), formationData);
      const formationId = formationDoc!.id;

      // Handle Modules
      for (let i = 1; i <= 7; i++) {
        const moduleKey = `Module ${i}` as keyof typeof course;
        if (course[moduleKey]) {
          const moduleData = {
            formationId: formationId,
            name: course[moduleKey] as string,
            description: `Module ${i} for ${course.Formation}`
          };
          addDocumentNonBlocking(collection(firestore, 'course_modules'), moduleData);
        }
      }
    }
    toast({ title: "Seeding complete!", description: "All courses have been added to the database." });
  };

  return (
    <>
      <div className="container mx-auto px-4 py-12 md:px-6 space-y-8">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Courses Management</h1>
            <p className="text-sm text-muted-foreground">Manage your academic content hierarchy: Catégories, Thèmes, Formations, and Modules.</p>
          </div>
          <Button variant="outline" onClick={handleSeedCourses}>Seed Courses from JSON</Button>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Categories Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Catégories</CardTitle>
                <CardDescription>Manage disciplines. A category can have multiple themes.</CardDescription>
              </div>
              <Dialog open={isCategoryAddDialogOpen} onOpenChange={setIsCategoryAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Category</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <Form {...addCategoryForm}>
                    <form onSubmit={addCategoryForm.handleSubmit(onAddCategorySubmit)} className="space-y-4 py-4">
                      <FormField control={addCategoryForm.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category Name</FormLabel>
                          <FormControl><Input placeholder="e.g., Business" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addCategoryForm.control} name="description" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl><Textarea placeholder="A short description of the category." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addCategoryForm.control} name="isOnline" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Catégorie en ligne</FormLabel>
                            <CardDescription>Visible only on Online portal</CardDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormItem>
                        <FormLabel>Media</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*,video/*,.mov"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setCategoryMediaFile(e.target.files[0]);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                      <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={addCategoryForm.formState.isSubmitting}>Save</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Media</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {areCategoriesLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell className="py-2"><Skeleton className="h-10 w-16" /></TableCell>
                          <TableCell className="py-2"><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="text-right py-2"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : categories && categories.length > 0 ? (
                      categories.map((category) => (
                        <TableRow
                          key={category.id}
                          onClick={() => handleSelectCategory(category as Category)}
                          className={cn("cursor-pointer", selectedCategory?.id === category.id && "bg-muted/50")}
                        >
                          <TableCell className="py-2">
                            {category.mediaUrl ? (
                              <MediaPreview url={category.mediaUrl} alt={category.name} />
                            ) : (
                              <div className="h-10 w-16 bg-muted rounded-sm" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium py-2">{category.name}</TableCell>
                          <TableCell className="text-right py-2">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditCategoryDialog(category as Category); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDeleteCategoryDialog(category as Category); }}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">No categories found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Themes Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Thèmes</CardTitle>
                <CardDescription>Manage topics for {selectedCategory ? `"${selectedCategory.name}"` : 'a selected category'}.</CardDescription>
              </div>
              <Dialog open={isThemeAddDialogOpen} onOpenChange={setIsThemeAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={!selectedCategory}><Plus className="mr-2 h-4 w-4" /> Add Theme</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Theme</DialogTitle>
                    <DialogDescription>For category: {selectedCategory?.name}</DialogDescription>
                  </DialogHeader>
                  <Form {...addThemeForm}>
                    <form onSubmit={addThemeForm.handleSubmit(onAddThemeSubmit)} className="space-y-4 py-4">
                      <FormField control={addThemeForm.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Theme Name</FormLabel>
                          <FormControl><Input placeholder="e.g., Digital Marketing" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addThemeForm.control} name="description" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl><Textarea placeholder="A short description of the theme." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addThemeForm.control} name="isOnline" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Thème en ligne</FormLabel>
                            <CardDescription>Visible only on Online portal</CardDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )} />
                      <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={addThemeForm.formState.isSubmitting}>Save</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {!selectedCategory ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-sm text-muted-foreground text-center">Select a category to manage its themes.</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {areThemesLoading ? (
                        Array.from({ length: 2 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell className="py-2"><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell className="text-right py-2"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : themes && themes.length > 0 ? (
                        themes.map((theme) => (
                          <TableRow
                            key={theme.id}
                            onClick={() => handleSelectTheme(theme as Theme)}
                            className={cn("cursor-pointer", selectedTheme?.id === theme.id && "bg-muted/50")}
                          >
                            <TableCell className="font-medium py-2">{theme.name}</TableCell>
                            <TableCell className="text-right py-2">
                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditThemeDialog(theme as Theme); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDeleteThemeDialog(theme as Theme); }}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="h-24 text-center">No themes found for this category.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Formations Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Formations</CardTitle>
                <CardDescription>Manage courses for {selectedTheme ? `"${selectedTheme.name}"` : 'a selected theme'}.</CardDescription>
              </div>
              <Dialog open={isFormationAddDialogOpen} onOpenChange={setIsFormationAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={!selectedTheme}><Plus className="mr-2 h-4 w-4" /> Add Formation</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Formation</DialogTitle>
                    <DialogDescription>For theme: {selectedTheme?.name}</DialogDescription>
                  </DialogHeader>
                  <Form {...addFormationForm}>
                    <form onSubmit={addFormationForm.handleSubmit(onAddFormationSubmit)} className="grid grid-cols-2 gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                      <FormField control={addFormationForm.control} name="name" render={({ field }) => (
                        <FormItem className="col-span-2 sm:col-span-1">
                          <FormLabel>Formation Name</FormLabel>
                          <FormControl><Input placeholder="e.g., Advanced SEO" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addFormationForm.control} name="isOnline" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mb-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Formation en ligne (Enterprise)</FormLabel>
                            <CardDescription>Is this an online-only course for enterprises?</CardDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )} />

                      {addFormationForm.watch('isOnline') ? (
                        <>
                          <FormField control={addFormationForm.control} name="pricePerMonth" render={({ field }) => (
                            <FormItem className="col-span-2 sm:col-span-1">
                              <FormLabel>Price per Month</FormLabel>
                              <FormControl><Input placeholder="e.g., 50€" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={addFormationForm.control} name="durationMonths" render={({ field }) => (
                            <FormItem className="col-span-2 sm:col-span-1">
                              <FormLabel>Duration (Months)</FormLabel>
                              <FormControl><Input placeholder="e.g., 6" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </>
                      ) : (
                        <>
                          <FormField control={addFormationForm.control} name="prixAvecHebergement" render={({ field }) => (
                            <FormItem className="col-span-2 sm:col-span-1">
                              <FormLabel>Prix avec hebergement</FormLabel>
                              <FormControl><Input placeholder="e.g., 2500€" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={addFormationForm.control} name="prixSansHebergement" render={({ field }) => (
                            <FormItem className="col-span-2 sm:col-span-1">
                              <FormLabel>Prix sans hebergement</FormLabel>
                              <FormControl><Input placeholder="e.g., 2000€" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </>
                      )}

                      <FormField control={addFormationForm.control} name="formationId" render={({ field }) => (
                        <FormItem className="col-span-2 sm:col-span-1">
                          <FormLabel>Formation ID</FormLabel>
                          <FormControl><Input placeholder="Custom ID" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addFormationForm.control} name="format" render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Format</FormLabel>
                          <FormControl><Input placeholder="e.g., En ligne, Présentiel" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addFormationForm.control} name="objectifPedagogique" render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Objectif Pédagogique</FormLabel>
                          <FormControl><Textarea {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addFormationForm.control} name="preRequis" render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Pré-requis</FormLabel>
                          <FormControl><Textarea {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addFormationForm.control} name="publicConcerne" render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Public Concerné</FormLabel>
                          <FormControl><Textarea {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addFormationForm.control} name="methodesMobilisees" render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Méthodes Mobilisées</FormLabel>
                          <FormControl><Textarea {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addFormationForm.control} name="moyensPedagogiques" render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Moyens Pédagogiques</FormLabel>
                          <FormControl><Textarea {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addFormationForm.control} name="modalitesEvaluation" render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Modalités d'Évaluation</FormLabel>
                          <FormControl><Textarea {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <DialogFooter className="col-span-2">
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={addFormationForm.formState.isSubmitting}>Save</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {!selectedTheme ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-sm text-muted-foreground text-center">Select a theme to manage its formations.</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {areFormationsLoading ? (
                        Array.from({ length: 2 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell className="py-2"><Skeleton className="h-5 w-16" /></TableCell>
                            <TableCell className="py-2"><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell className="text-right py-2"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : formations && formations.length > 0 ? (
                        formations.map((formation) => (
                          <TableRow
                            key={formation.id}
                            onClick={() => setSelectedFormation(formation as Formation)}
                            className={cn("cursor-pointer", selectedFormation?.id === formation.id && "bg-muted/50")}
                          >
                            <TableCell className="font-mono text-xs py-2">{formation.formationId}</TableCell>
                            <TableCell className="font-medium py-2">{formation.name}</TableCell>
                            <TableCell className="text-right py-2">
                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditFormationDialog(formation as Formation) }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDeleteFormationDialog(formation as Formation) }}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center">No formations found for this theme.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Modules Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Modules</CardTitle>
                <CardDescription>Manage learning modules for {selectedFormation ? `"${selectedFormation.name}"` : 'a selected formation'}.</CardDescription>
              </div>
              <Dialog open={isModuleAddDialogOpen} onOpenChange={setIsModuleAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={!selectedFormation}><Plus className="mr-2 h-4 w-4" /> Add Module</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Module</DialogTitle>
                    <DialogDescription>For formation: {selectedFormation?.name}</DialogDescription>
                  </DialogHeader>
                  <Form {...addModuleForm}>
                    <form onSubmit={addModuleForm.handleSubmit(onAddModuleSubmit)} className="space-y-4 py-4">
                      <FormField control={addModuleForm.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Module Name</FormLabel>
                          <FormControl><Input placeholder="e.g., Introduction to SEO" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addModuleForm.control} name="description" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl><Textarea placeholder="A short description of the module." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={addModuleForm.formState.isSubmitting}>Save</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {!selectedFormation ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-sm text-muted-foreground text-center">Select a formation to manage its modules.</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {areModulesLoading ? (
                        Array.from({ length: 2 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell className="py-2"><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell className="text-right py-2"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : modules && modules.length > 0 ? (
                        modules.map((module) => (
                          <TableRow key={module.id}>
                            <TableCell className="font-medium py-2">{module.name}</TableCell>
                            <TableCell className="text-right py-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditModuleDialog(module as Module)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openDeleteModuleDialog(module as Module)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="h-24 text-center">No modules found for this formation.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={isCategoryEditDialogOpen} onOpenChange={setIsCategoryEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Category: {editingCategory?.name}</DialogTitle>
          </DialogHeader>
          <Form {...editCategoryForm}>
            <form onSubmit={editCategoryForm.handleSubmit(onEditCategorySubmit)} className="space-y-4 py-4">
              <FormField control={editCategoryForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editCategoryForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editCategoryForm.control} name="isOnline" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Catégorie en ligne</FormLabel>
                    <CardDescription>Visible only on Online portal</CardDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )} />
              <FormItem>
                <FormLabel>Media</FormLabel>
                {editCategoryForm.watch('mediaUrl') && (
                  <div className="mb-2">
                    <MediaPreview url={editCategoryForm.watch('mediaUrl')!} alt={editCategoryForm.watch('name')} />
                  </div>
                )}
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*,video/*,.mov"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setCategoryMediaFile(e.target.files[0]);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={editCategoryForm.formState.isSubmitting}>Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Alert Dialog */}
      <AlertDialog open={isCategoryDeleteDialogOpen} onOpenChange={setIsCategoryDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category <span className="font-semibold">{categoryToDelete?.name}</span> and all its themes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Theme Dialog */}
      <Dialog open={isThemeEditDialogOpen} onOpenChange={setIsThemeEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Theme: {editingTheme?.name}</DialogTitle>
          </DialogHeader>
          <Form {...editThemeForm}>
            <form onSubmit={editThemeForm.handleSubmit(onEditThemeSubmit)} className="space-y-4 py-4">
              <FormField control={editThemeForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Theme Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editThemeForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editThemeForm.control} name="isOnline" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Thème en ligne</FormLabel>
                    <CardDescription>Visible only on Online portal</CardDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={editThemeForm.formState.isSubmitting}>Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Theme Alert Dialog */}
      <AlertDialog open={isThemeDeleteDialogOpen} onOpenChange={setIsThemeDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the theme <span className="font-semibold">{themeToDelete?.name}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTheme} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Formation Dialog */}
      <Dialog open={isFormationEditDialogOpen} onOpenChange={setIsFormationEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Formation: {editingFormation?.name}</DialogTitle>
          </DialogHeader>
          <Form {...editFormationForm}>
            <form onSubmit={editFormationForm.handleSubmit(onEditFormationSubmit)} className="grid grid-cols-2 gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <FormField control={editFormationForm.control} name="name" render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Formation Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editFormationForm.control} name="isOnline" render={({ field }) => (
                <FormItem className="col-span-2 flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Formation en ligne (Enterprise)</FormLabel>
                    <CardDescription>Is this an online-only course for enterprises?</CardDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )} />

              {editFormationForm.watch('isOnline') ? (
                <>
                  <FormField control={editFormationForm.control} name="pricePerMonth" render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel>Price per Month</FormLabel>
                      <FormControl><Input placeholder="e.g., 50€" {...field} value={field.value || ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editFormationForm.control} name="durationMonths" render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel>Duration (Months)</FormLabel>
                      <FormControl><Input placeholder="e.g., 6" {...field} value={field.value || ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </>
              ) : (
                <>
                  <FormField control={editFormationForm.control} name="prixAvecHebergement" render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel>Prix avec hebergement</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editFormationForm.control} name="prixSansHebergement" render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel>Prix sans hebergement</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </>
              )}

              <FormField control={editFormationForm.control} name="formationId" render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Formation ID</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editFormationForm.control} name="format" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Format</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editFormationForm.control} name="objectifPedagogique" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Objectif Pédagogique</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editFormationForm.control} name="preRequis" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Pré-requis</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editFormationForm.control} name="publicConcerne" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Public Concerné</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editFormationForm.control} name="methodesMobilisees" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Méthodes Mobilisées</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editFormationForm.control} name="moyensPedagogiques" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Moyens Pédagogiques</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editFormationForm.control} name="modalitesEvaluation" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Modalités d'Évaluation</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="col-span-2">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={editFormationForm.formState.isSubmitting}>Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Formation Alert Dialog */}
      <AlertDialog open={isFormationDeleteDialogOpen} onOpenChange={setIsFormationDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the formation <span className="font-semibold">{formationToDelete?.name}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFormation} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Module Dialog */}
      <Dialog open={isModuleEditDialogOpen} onOpenChange={setIsModuleEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Module: {editingModule?.name}</DialogTitle>
          </DialogHeader>
          <Form {...editModuleForm}>
            <form onSubmit={editModuleForm.handleSubmit(onEditModuleSubmit)} className="space-y-4 py-4">
              <FormField control={editModuleForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Module Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editModuleForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={editModuleForm.formState.isSubmitting}>Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Module Alert Dialog */}
      <AlertDialog open={isModuleDeleteDialogOpen} onOpenChange={setIsModuleDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the module <span className="font-semibold">{moduleToDelete?.name}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteModule} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


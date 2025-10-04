

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, orderBy } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';

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
});

const themeSchema = z.object({
  name: z.string().min(1, "Theme name is required."),
  description: z.string().optional(),
  categoryId: z.string(),
});

const formationSchema = z.object({
    name: z.string().min(1, "Formation name is required."),
    themeId: z.string(),
    formationId: z.string().min(1, "Formation ID is required."),
    objectifPedagogique: z.string().optional(),
    preRequis: z.string().optional(),
    publicConcerne: z.string().optional(),
    methodesMobilisees: z.string().optional(),
    moyensPedagogiques: z.string().optional(),
    modalitesEvaluation: z.string().optional(),
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
}

export default function CoursesPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  // State Management
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

  const [isCategoryAddDialogOpen, setIsCategoryAddDialogOpen] = useState(false);
  const [isCategoryEditDialogOpen, setIsCategoryEditDialogOpen] = useState(false);
  const [isCategoryDeleteDialogOpen, setIsCategoryDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const [isThemeAddDialogOpen, setIsThemeAddDialogOpen] = useState(false);
  const [isThemeEditDialogOpen, setIsThemeEditDialogOpen] = useState(false);
  const [isThemeDeleteDialogOpen, setIsThemeDeleteDialogOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [themeToDelete, setThemeToDelete] = useState<Theme | null>(null);
  
  const [isFormationAddDialogOpen, setIsFormationAddDialogOpen] = useState(false);
  const [isFormationEditDialogOpen, setIsFormationEditDialogOpen] = useState(false);
  const [isFormationDeleteDialogOpen, setIsFormationDeleteDialogOpen] = useState(false);
  const [editingFormation, setEditingFormation] = useState<Formation | null>(null);
  const [formationToDelete, setFormationToDelete] = useState<Formation | null>(null);


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

  const { data: categories, isLoading: areCategoriesLoading } = useCollection<Omit<Category, 'id'>>(categoriesQuery);
  const { data: themes, isLoading: areThemesLoading } = useCollection<Omit<Theme, 'id'>>(themesQuery);
  const { data: formations, isLoading: areFormationsLoading } = useCollection<Omit<Formation, 'id'>>(formationsQuery);

  // Forms
  const addCategoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  });

  const editCategoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {},
  });

  const addThemeForm = useForm<z.infer<Omit<typeof themeSchema, 'categoryId'>>>({
    resolver: zodResolver(themeSchema.omit({ categoryId: true })),
    defaultValues: { name: '', description: '' },
  });

  const editThemeForm = useForm<z.infer<Omit<typeof themeSchema, 'categoryId'>>>({
    resolver: zodResolver(themeSchema.omit({ categoryId: true })),
    defaultValues: {},
  });
  
  const addFormationForm = useForm<z.infer<Omit<typeof formationSchema, 'themeId'>>>({
    resolver: zodResolver(formationSchema.omit({ themeId: true })),
    defaultValues: { 
        name: '',
        formationId: '',
        objectifPedagogique: '',
        preRequis: '',
        publicConcerne: '',
        methodesMobilisees: '',
        moyensPedagogiques: '',
        modalitesEvaluation: '',
    },
  });

  const editFormationForm = useForm<z.infer<Omit<typeof formationSchema, 'themeId'>>>({
    resolver: zodResolver(formationSchema.omit({ themeId: true })),
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
      });
    }
  }, [editingFormation, editFormationForm]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Handlers for Category
  const onAddCategorySubmit = async (values: z.infer<typeof categorySchema>) => {
    if (!firestore) return;
    addDocumentNonBlocking(collection(firestore, 'course_categories'), values);
    toast({ title: 'Success!', description: 'New category has been added.' });
    addCategoryForm.reset();
    setIsCategoryAddDialogOpen(false);
  };

  const onEditCategorySubmit = async (values: z.infer<typeof categorySchema>) => {
    if (!firestore || !editingCategory) return;
    const docRef = doc(firestore, 'course_categories', editingCategory.id);
    setDocumentNonBlocking(docRef, values, { merge: true });
    toast({ title: 'Success!', description: 'Category has been updated.' });
    setIsCategoryEditDialogOpen(false);
    setEditingCategory(null);
  };

  const openEditCategoryDialog = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryEditDialogOpen(true);
  };

  const openDeleteCategoryDialog = (category: Category) => {
    setCategoryToDelete(category);
    setIsCategoryDeleteDialogOpen(true);
  };

  const handleDeleteCategory = () => {
    if (!firestore || !categoryToDelete) return;
    // TODO: Add logic to delete sub-collections (themes, etc.) if required
    const docRef = doc(firestore, 'course_categories', categoryToDelete.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Category Deleted", description: "The category has been permanently deleted." });
    setIsCategoryDeleteDialogOpen(false);
    if(selectedCategory?.id === categoryToDelete.id) {
        setSelectedCategory(null);
    }
    setCategoryToDelete(null);
  };
  
  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    setSelectedTheme(null);
  }

  // Handlers for Theme
  const onAddThemeSubmit = async (values: z.infer<Omit<typeof themeSchema, 'categoryId'>>) => {
    if (!firestore || !selectedCategory) return;
    const dataToSave = { ...values, categoryId: selectedCategory.id };
    addDocumentNonBlocking(collection(firestore, 'course_themes'), dataToSave);
    toast({ title: 'Success!', description: 'New theme has been added.' });
    addThemeForm.reset();
    setIsThemeAddDialogOpen(false);
  };

  const onEditThemeSubmit = async (values: z.infer<Omit<typeof themeSchema, 'categoryId'>>) => {
    if (!firestore || !editingTheme) return;
    const docRef = doc(firestore, 'course_themes', editingTheme.id);
    setDocumentNonBlocking(docRef, values, { merge: true });
    toast({ title: 'Success!', description: 'Theme has been updated.' });
    setIsThemeEditDialogOpen(false);
    setEditingTheme(null);
  };
  
  const openEditThemeDialog = (theme: Theme) => {
    setEditingTheme(theme);
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
     if(selectedTheme?.id === themeToDelete.id) {
        setSelectedTheme(null);
    }
    setThemeToDelete(null);
  };

  // Handlers for Formation
    const onAddFormationSubmit = async (values: z.infer<Omit<typeof formationSchema, 'themeId'>>) => {
        if (!firestore || !selectedTheme) return;
        const dataToSave = { ...values, themeId: selectedTheme.id };
        addDocumentNonBlocking(collection(firestore, 'course_formations'), dataToSave);
        toast({ title: 'Success!', description: 'New formation has been added.' });
        addFormationForm.reset();
        setIsFormationAddDialogOpen(false);
    };

    const onEditFormationSubmit = async (values: z.infer<Omit<typeof formationSchema, 'themeId'>>) => {
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
        setFormationToDelete(null);
    };

  return (
    <>
      <div className="container mx-auto px-4 py-12 md:px-6 space-y-8">
        <header>
          <h1 className="text-xl font-bold tracking-tight">Courses Management</h1>
          <p className="text-sm text-muted-foreground">Manage your academic content hierarchy: Catégories, Thèmes, Formations, and Modules.</p>
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
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {areCategoriesLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
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
                        <TableCell colSpan={2} className="h-24 text-center">No categories found.</TableCell>
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
                                onClick={() => setSelectedTheme(theme as Theme)}
                                className={cn("cursor-pointer", selectedTheme?.id === theme.id && "bg-muted/50")}
                            >
                                <TableCell className="font-medium py-2">{theme.name}</TableCell>
                                <TableCell className="text-right py-2">
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditThemeDialog(theme as Theme);}}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDeleteThemeDialog(theme as Theme);}}>
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
                      <FormField control={addFormationForm.control} name="formationId" render={({ field }) => (
                        <FormItem className="col-span-2 sm:col-span-1">
                          <FormLabel>Formation ID</FormLabel>
                          <FormControl><Input placeholder="Custom ID" {...field} /></FormControl>
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
                                <TableRow key={formation.id}>
                                    <TableCell className="font-mono text-xs py-2">{formation.formationId}</TableCell>
                                    <TableCell className="font-medium py-2">{formation.name}</TableCell>
                                    <TableCell className="text-right py-2">
                                    <Button variant="ghost" size="icon" onClick={() => openEditFormationDialog(formation as Formation)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => openDeleteFormationDialog(formation as Formation)}>
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
                    <CardDescription>Manage learning modules.</CardDescription>
                </div>
                <Button size="sm" disabled><Plus className="mr-2 h-4 w-4" /> Add Module</Button>
                </CardHeader>
                <CardContent>
                <div className="h-[400px] flex items-center justify-center">
                    <p className="text-sm text-muted-foreground text-center">Select a formation to manage its modules.</p>
                </div>
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
                      <FormField control={editFormationForm.control} name="formationId" render={({ field }) => (
                        <FormItem className="col-span-2 sm:col-span-1">
                          <FormLabel>Formation ID</FormLabel>
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
    </>
  );
}

    

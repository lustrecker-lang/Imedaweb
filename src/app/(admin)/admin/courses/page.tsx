
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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

// Schemas
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required."),
  description: z.string().optional(),
});

// Interfaces
interface Category extends z.infer<typeof categorySchema> {
  id: string;
}

export default function CoursesPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  // State Management
  const [isCategoryAddDialogOpen, setIsCategoryAddDialogOpen] = useState(false);
  const [isCategoryEditDialogOpen, setIsCategoryEditDialogOpen] = useState(false);
  const [isCategoryDeleteDialogOpen, setIsCategoryDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Firestore Queries
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'course_categories'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: categories, isLoading: areCategoriesLoading } = useCollection<Omit<Category, 'id'>>(categoriesQuery);

  // Forms
  const addCategoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  });

  const editCategoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
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
    const docRef = doc(firestore, 'course_categories', categoryToDelete.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Category Deleted", description: "The category has been permanently deleted." });
    setIsCategoryDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-12 md:px-6 space-y-8">
        <header>
          <h1 className="text-xl font-bold tracking-tight">Courses Management</h1>
          <p className="text-sm text-muted-foreground">Manage your academic content hierarchy: Catégories, Thèmes, Formations, and Modules.</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-1">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areCategoriesLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : categories && categories.length > 0 ? (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-muted-foreground">{category.description}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditCategoryDialog(category as Category)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteCategoryDialog(category as Category)}>
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
            </CardContent>
          </Card>
          
          {/* Themes Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Thèmes</CardTitle>
                <CardDescription>Manage topics within categories. A theme can have multiple formations.</CardDescription>
              </div>
              <Button size="sm" disabled><Plus className="mr-2 h-4 w-4" /> Add Theme</Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Select a category to manage its themes.</p>
            </CardContent>
          </Card>

          {/* Formations Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Formations</CardTitle>
                <CardDescription>Manage specific courses. A formation can have multiple modules.</CardDescription>
              </div>
              <Button size="sm" disabled><Plus className="mr-2 h-4 w-4" /> Add Formation</Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Select a theme to manage its formations.</p>
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
              <p className="text-sm text-muted-foreground">Select a formation to manage its modules.</p>
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
              This will permanently delete the category <span className="font-semibold">{categoryToDelete?.name}</span>. This action cannot be undone.
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
    </>
  );
}

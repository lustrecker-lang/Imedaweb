
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Trash2, Edit, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const jobOpeningSchema = z.object({
  positionName: z.string().min(1, 'Position name is required.'),
  type: z.enum(['Trainer', 'Administrator', 'Marketing', 'Tech', 'Other']),
  workMode: z.enum(['Full-time', 'Part-time']),
  description: z.string().min(1, 'A short description is required.'),
  fullDescription: z.string().optional(),
});

interface JobOpening extends z.infer<typeof jobOpeningSchema> {
  id: string;
}

export default function JobsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [jobToDelete, setJobToDelete] = useState<JobOpening | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobOpening | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jobOpenings'), orderBy('positionName', 'asc'));
  }, [firestore]);

  const { data: jobs, isLoading: areJobsLoading } = useCollection<Omit<JobOpening, 'id'>>(jobsQuery);

  const form = useForm<z.infer<typeof jobOpeningSchema>>({
    resolver: zodResolver(jobOpeningSchema),
    defaultValues: {
      positionName: '',
      type: 'Other',
      workMode: 'Full-time',
      description: '',
      fullDescription: '',
    },
  });

  const editForm = useForm<z.infer<typeof jobOpeningSchema>>({
    resolver: zodResolver(jobOpeningSchema),
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (editingJob) {
      editForm.reset(editingJob);
    }
  }, [editingJob, editForm]);


  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const onAddSubmit = async (values: z.infer<typeof jobOpeningSchema>) => {
    if (!firestore) return;
    addDocumentNonBlocking(collection(firestore, 'jobOpenings'), values);
    toast({ title: 'Success!', description: 'New job opening has been added.' });
    form.reset();
    setIsAddDialogOpen(false);
  };
  
  const onEditSubmit = async (values: z.infer<typeof jobOpeningSchema>) => {
    if (!firestore || !editingJob) return;
    const docRef = doc(firestore, 'jobOpenings', editingJob.id);
    setDocumentNonBlocking(docRef, values, { merge: true });
    toast({ title: 'Success!', description: `Job opening "${values.positionName}" has been updated.` });
    setIsEditDialogOpen(false);
    setEditingJob(null);
  };

  const openDeleteDialog = (job: JobOpening) => {
    setJobToDelete(job);
    setIsDeleteDialogOpen(true);
  };
  
  const openEditDialog = (job: JobOpening) => {
    setEditingJob(job);
    setIsEditDialogOpen(true);
  };

  const handleDeleteJob = () => {
    if (!firestore || !jobToDelete) return;
    const docRef = doc(firestore, 'jobOpenings', jobToDelete.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Job Deleted", description: "The job opening has been permanently deleted." });
    setIsDeleteDialogOpen(false);
    setJobToDelete(null);
  };

  const renderForm = (formInstance: any, onSubmitFn: any) => {
    const { control, handleSubmit, formState } = formInstance;
    return (
      <Form {...formInstance}>
        <form onSubmit={handleSubmit(onSubmitFn)} className="space-y-4 py-4">
          <FormField control={control} name="positionName" render={({ field }) => (
              <FormItem><FormLabel>Position Name</FormLabel><FormControl><Input placeholder="e.g., Senior Developer" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a job type" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="Trainer">Trainer</SelectItem>
                        <SelectItem value="Administrator">Administrator</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Tech">Tech</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select><FormMessage />
              </FormItem>
          )} />
           <FormField control={control} name="workMode" render={({ field }) => (
              <FormItem>
                <FormLabel>Work Mode</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a work mode" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                    </SelectContent>
                </Select><FormMessage />
              </FormItem>
          )} />
          <FormField control={control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Short Description</FormLabel><FormControl><Textarea placeholder="A brief summary of the role." {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="fullDescription" render={({ field }) => (
              <FormItem><FormLabel>Full Description (Optional)</FormLabel><FormControl><Textarea placeholder="Detailed job description..." {...field} rows={6} /></FormControl><FormMessage /></FormItem>
          )} />
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={formState.isSubmitting}>Save</Button>
          </DialogFooter>
        </form>
      </Form>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-12 md:px-6 space-y-8">
        <header>
          <h1 className="text-xl font-bold tracking-tight">Job Openings Management</h1>
          <p className="text-sm text-muted-foreground">Add, edit, or remove job openings for the careers page.</p>
        </header>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Open Positions</CardTitle>
              <CardDescription>A list of all current job openings.</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add Job</Button></DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader><DialogTitle>Add New Job Opening</DialogTitle></DialogHeader>
                    {renderForm(form, onAddSubmit)}
                </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Work Mode</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areJobsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : jobs && jobs.length > 0 ? (
                  jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.positionName}</TableCell>
                      <TableCell><Badge variant="outline">{job.type}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{job.workMode}</Badge></TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => openEditDialog(job as JobOpening)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                        </Button>
                         <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(job as JobOpening)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                            <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center">No job openings found. Add one to get started.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-xl">
              <DialogHeader><DialogTitle>Edit Job Opening: {editingJob?.positionName}</DialogTitle></DialogHeader>
              {renderForm(editForm, onEditSubmit)}
          </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the job opening for <span className="font-semibold">{jobToDelete?.positionName}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteJob} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

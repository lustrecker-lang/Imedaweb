'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc } from 'firebase/firestore';
import { format } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
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
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';


interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  message: string;
  createdAt: Timestamp;
  leadType?: string;
  courseName?: string;
}

export default function LeadsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const leadsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'leads'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: leads, isLoading: areLeadsLoading } = useCollection<Lead>(leadsQuery);

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

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (lead: Lead) => {
    setLeadToDelete(lead);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteLead = () => {
    if (!firestore || !leadToDelete) return;
    const docRef = doc(firestore, 'leads', leadToDelete.id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Lead Deleted",
      description: "The lead has been permanently deleted.",
    });
    setIsDeleteDialogOpen(false);
    setLeadToDelete(null);
  };
  
  return (
    <>
      <div className="container mx-auto px-4 py-12 md:px-6">
        <header className="mb-8">
          <h1 className="text-xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Submissions from the website contact form.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Incoming Leads</CardTitle>
            <CardDescription>
              Here are all the leads captured from your website.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Received</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Lead Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areLeadsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="py-2"><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="py-2"><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell className="py-2"><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell className="py-2"><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="py-2 text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : leads && leads.length > 0 ? (
                  leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="py-2">
                        {lead.createdAt ? format(lead.createdAt.toDate(), 'PP p') : 'N/A'}
                      </TableCell>
                      <TableCell className="py-2 font-medium">{lead.fullName}</TableCell>
                      <TableCell className="py-2">{lead.email}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant={lead.leadType === 'Course Inquiry' ? 'default' : 'secondary'}>
                          {lead.leadType || 'Contact Form'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewLead(lead)}>
                              View Message
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteDialog(lead)} className="text-red-600 focus:text-red-600">
                               <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No leads yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Lead from: {selectedLead?.fullName}</DialogTitle>
            <DialogDescription>
              {selectedLead?.email} {selectedLead?.phone && `· ${selectedLead.phone}`}
            </DialogDescription>
            {selectedLead?.leadType === 'Course Inquiry' && selectedLead?.courseName && (
              <p className="text-sm pt-2">Inquiry about: <span className="font-semibold">{selectedLead.courseName}</span></p>
            )}
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md border">
              {selectedLead?.message}
            </p>
          </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead from
              your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLead} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

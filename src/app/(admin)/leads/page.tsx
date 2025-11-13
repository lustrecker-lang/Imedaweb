
// src/app/admin/leads/page.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc } from 'firebase/firestore';
import { format, getMonth, getYear } from 'date-fns';
import { fr } from 'date-fns/locale';

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
import { MoreHorizontal, Trash2, Copy, Search, ArrowLeft, ArrowRight, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';


interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  message: string;
  createdAt: Timestamp;
  leadType?: string;
  courseName?: string;
  positionAppliedFor?: string;
  cvUrl?: string;
}

const LEADS_PER_PAGE = 10;

export default function LeadsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [leadTypeFilter, setLeadTypeFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

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

  const monthOptions = useMemo(() => {
    if (!leads) return [];
    const months = new Set<string>();
    leads.forEach(lead => {
        if (lead.createdAt) {
            const monthYear = format(lead.createdAt.toDate(), 'MMMM yyyy', { locale: fr });
            months.add(monthYear);
        }
    });
    return Array.from(months).map(my => ({ value: my, label: my }));
  }, [leads]);
  
  const filteredLeads = useMemo(() => {
      if (!leads) return [];
      let filtered = leads;

      if (searchTerm) {
          const lowercasedTerm = searchTerm.toLowerCase();
          filtered = filtered.filter(lead => 
              lead.fullName.toLowerCase().includes(lowercasedTerm) ||
              lead.email.toLowerCase().includes(lowercasedTerm) ||
              (lead.positionAppliedFor && lead.positionAppliedFor.toLowerCase().includes(lowercasedTerm))
          );
      }

      if (leadTypeFilter !== 'all') {
          filtered = filtered.filter(lead => (lead.leadType || 'Contact Form') === leadTypeFilter);
      }

      if (monthFilter !== 'all') {
          filtered = filtered.filter(lead => {
              if (!lead.createdAt) return false;
              const leadMonthYear = format(lead.createdAt.toDate(), 'MMMM yyyy', { locale: fr });
              return leadMonthYear === monthFilter;
          });
      }

      return filtered;
  }, [leads, searchTerm, leadTypeFilter, monthFilter]);

  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * LEADS_PER_PAGE;
    return filteredLeads.slice(startIndex, startIndex + LEADS_PER_PAGE);
  }, [filteredLeads, currentPage]);

  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);

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

  const handleCopyToClipboard = () => {
    if (!selectedLead) return;

    const leadDetails = [
      `Name: ${selectedLead.fullName}`,
      `Email: ${selectedLead.email}`,
      selectedLead.phone ? `Phone: ${selectedLead.phone}` : null,
      `Received: ${selectedLead.createdAt ? format(selectedLead.createdAt.toDate(), 'PP p') : 'N/A'}`,
      `Type: ${selectedLead.leadType || 'Contact Form'}`,
      selectedLead.courseName ? `Course: ${selectedLead.courseName}` : null,
      selectedLead.positionAppliedFor ? `Applied for: ${selectedLead.positionAppliedFor}` : null,
      selectedLead.cvUrl ? `CV: ${selectedLead.cvUrl}` : null,
      `\nMessage:\n${selectedLead.message}`
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(leadDetails).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: "Lead details have been copied successfully.",
      });
    }, (err) => {
      toast({
        variant: 'destructive',
        title: "Copy Failed",
        description: "Could not copy lead details to clipboard.",
      });
    });
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

  const leadTypeColor = (leadType?: string) => {
      switch (leadType) {
          case 'Course Inquiry': return 'default';
          case 'Job Application': return 'destructive';
          case 'Catalog Download': return 'outline';
          default: return 'secondary';
      }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-12 md:px-6">
        <header className="mb-8">
          <h1 className="text-xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Submissions from the website contact forms.
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
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name or email..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={leadTypeFilter} onValueChange={setLeadTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Lead Types</SelectItem>
                        <SelectItem value="Contact Form">Contact Form</SelectItem>
                        <SelectItem value="Course Inquiry">Course Inquiry</SelectItem>
                        <SelectItem value="Catalog Download">Catalog Download</SelectItem>
                        <SelectItem value="Job Application">Job Application</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by month" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
                        {monthOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
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
                  Array.from({ length: LEADS_PER_PAGE }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="py-2"><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="py-2"><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell className="py-2"><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell className="py-2"><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="py-2 text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedLeads && paginatedLeads.length > 0 ? (
                  paginatedLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="py-2">
                        {lead.createdAt ? format(lead.createdAt.toDate(), 'PP p') : 'N/A'}
                      </TableCell>
                      <TableCell className="py-2 font-medium">{lead.fullName}</TableCell>
                      <TableCell className="py-2">{lead.email}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant={leadTypeColor(lead.leadType)}>
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
                              View Details
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
                      No leads found for the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {totalPages > 1 && (
                <Pagination className="mt-6">
                    <PaginationContent>
                        <PaginationItem>
                            <Button variant="outline" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                            </Button>
                        </PaginationItem>
                         <PaginationItem className="hidden sm:block text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </PaginationItem>
                        <PaginationItem>
                            <Button variant="outline" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
             <DialogDescription>
              Received on {selectedLead?.createdAt ? format(selectedLead.createdAt.toDate(), 'PP p') : 'N/A'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 grid gap-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <h4 className="font-semibold">Name</h4>
                    <p className="text-muted-foreground">{selectedLead?.fullName}</p>
                </div>
                 <div>
                    <h4 className="font-semibold">Email</h4>
                    <p className="text-muted-foreground">{selectedLead?.email}</p>
                </div>
                {selectedLead?.phone && (
                  <div>
                      <h4 className="font-semibold">Phone</h4>
                      <p className="text-muted-foreground">{selectedLead.phone}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold">Lead Type</h4>
                  <div className="text-muted-foreground">
                    <Badge variant={leadTypeColor(selectedLead?.leadType)}>
                      {selectedLead?.leadType || 'Contact Form'}
                    </Badge>
                  </div>
                </div>
                 {selectedLead?.leadType === 'Course Inquiry' && selectedLead?.courseName && (
                  <div className="col-span-2">
                    <h4 className="font-semibold">Course Inquiry</h4>
                    <p className="text-muted-foreground">{selectedLead.courseName}</p>
                  </div>
                )}
                {selectedLead?.leadType === 'Job Application' && selectedLead?.positionAppliedFor && (
                  <div className="col-span-2">
                    <h4 className="font-semibold">Position Applied For</h4>
                    <p className="text-muted-foreground">{selectedLead.positionAppliedFor}</p>
                  </div>
                )}
                 {selectedLead?.leadType === 'Job Application' && selectedLead?.cvUrl && (
                  <div className="col-span-2">
                    <h4 className="font-semibold">Curriculum Vitae</h4>
                     <Button asChild variant="outline" size="sm" className="mt-1">
                        <a href={selectedLead.cvUrl} target="_blank" rel="noopener noreferrer">
                           <Download className="mr-2 h-4 w-4" /> Download CV
                        </a>
                    </Button>
                  </div>
                )}
              </div>
              {selectedLead?.message && (
                <div>
                  <h4 className="font-semibold">Message</h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md border mt-2 whitespace-pre-wrap">
                    {selectedLead?.message}
                  </p>
                </div>
              )}
          </div>
          <DialogFooter>
             <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
            <Button onClick={handleCopyToClipboard}>
              <Copy className="mr-2 h-4 w-4"/>
              Copy to Clipboard
            </Button>
          </DialogFooter>
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

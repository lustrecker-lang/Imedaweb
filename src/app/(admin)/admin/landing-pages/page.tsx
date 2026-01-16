// src/app/(admin)/admin/landing-pages/page.tsx
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Pencil, Trash2, Plus, ExternalLink } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LandingPage {
    id: string;
    slug: string;
    published: boolean;
    title: string;
    headline: string;
}

export default function LandingPagesPage() {
    const firestore = useFirestore();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const landingPagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const landingPagesRef = collection(firestore, 'landing_pages');
        return query(landingPagesRef, orderBy('slug', 'asc'));
    }, [firestore]);

    const { data: landingPages, isLoading } = useCollection<LandingPage>(landingPagesQuery);

    const handleDelete = async () => {
        if (!firestore || !deleteId) return;
        try {
            await deleteDoc(doc(firestore, 'landing_pages', deleteId));
            setDeleteId(null);
        } catch (error) {
            console.error('Error deleting landing page:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-normal tracking-tighter font-headline">Landing Pages</h1>
                <Button asChild>
                    <Link href="/admin/landing-pages/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Landing Page
                    </Link>
                </Button>
            </div>

            {landingPages && landingPages.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground text-center">No landing pages yet. Create your first one!</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead className="w-[100px]">Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {landingPages?.map((page) => (
                                <TableRow key={page.id}>
                                    <TableCell className="font-medium">{page.headline}</TableCell>
                                    <TableCell className="text-muted-foreground">/landing/{page.slug}</TableCell>
                                    <TableCell>
                                        {page.published ? (
                                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ring-green-600/20 text-green-700 bg-green-50">
                                                Published
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ring-yellow-600/20 text-yellow-800 bg-yellow-50">
                                                Draft
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {page.published && (
                                                <Button variant="ghost" size="icon" asChild title="View Live Page">
                                                    <Link href={`/landing/${page.slug}`} target="_blank">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" asChild title="Edit Page">
                                                <Link href={`/admin/landing-pages/${page.id}`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Delete Page"
                                                onClick={() => setDeleteId(page.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Landing Page</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this landing page? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

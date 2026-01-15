// src/app/(admin)/admin/landing-pages/page.tsx
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
                <div className="grid gap-4">
                    {landingPages?.map((page) => (
                        <Card key={page.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-xl font-normal">
                                            {page.headline}
                                            {!page.published && (
                                                <span className="ml-2 text-sm text-muted-foreground">(Draft)</span>
                                            )}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            /landing/{page.slug}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {page.published && (
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/landing/${page.slug}`} target="_blank">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/admin/landing-pages/${page.id}`}>
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeleteId(page.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
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


'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Formation {
    id: string;
    name: string;
    formationId: string;
    themeId: string;
    publicConcerne?: string;
    format?: string;
}

export default function CoursesPage() {
    const firestore = useFirestore();

    const formationsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'course_formations'), orderBy('name', 'asc'));
    }, [firestore]);

    const { data: formations, isLoading } = useCollection<Omit<Formation, 'id'>>(formationsQuery);

    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <header className="mb-12 text-center">
                <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline">
                    Catalogue des Formations
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                    Explorez notre catalogue complet de formations conçues pour répondre à vos besoins de développement professionnel.
                </p>
            </header>

            <main>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <Card key={i} className="flex flex-col">
                                <CardHeader>
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-1/2" />
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <Skeleton className="h-10 w-full" />
                                </CardContent>
                            </Card>
                        ))
                    ) : formations && formations.length > 0 ? (
                        formations.map(formation => (
                            <Link key={formation.id} href={`/courses/${formation.id}`} className="block">
                                <Card className="h-full flex flex-col transition-shadow hover:shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="text-base font-medium">{formation.name}</CardTitle>
                                        <CardDescription className="text-xs">{formation.formationId}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <p className="text-xs text-muted-foreground line-clamp-3">
                                            {formation.publicConcerne || 'Public varié'}
                                        </p>
                                    </CardContent>
                                    <div className="p-6 pt-0 text-xs font-semibold text-primary">{formation.format || 'Format flexible'}</div>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <p className="col-span-full text-center text-muted-foreground">Aucune formation disponible pour le moment.</p>
                    )}
                </div>
            </main>
        </div>
    );
}


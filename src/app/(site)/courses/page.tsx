
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

// Interfaces
interface Category {
    id: string;
    name: string;
}

interface Theme {
    id: string;
    name: string;
    categoryId: string;
}

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
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

    // Queries
    const categoriesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'course_categories'), orderBy('name', 'asc'));
    }, [firestore]);

    const themesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'course_themes'), orderBy('name', 'asc'));
    }, [firestore]);
    
    const formationsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'course_formations'), orderBy('name', 'asc'));
    }, [firestore]);

    // Data fetching
    const { data: categories, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesQuery);
    const { data: themes, isLoading: areThemesLoading } = useCollection<Theme>(themesQuery);
    const { data: formations, isLoading: areFormationsLoading } = useCollection<Omit<Formation, 'id'>>(formationsQuery);

    // Memoized filtering
    const filteredThemes = useMemo(() => {
        if (!themes || !selectedCategory) return [];
        return themes.filter(theme => theme.categoryId === selectedCategory);
    }, [themes, selectedCategory]);

    const filteredFormations = useMemo(() => {
        if (!formations) return [];
        if (!selectedTheme) {
            if (!selectedCategory) {
                return formations;
            }
            const themeIdsInCategory = themes?.filter(t => t.categoryId === selectedCategory).map(t => t.id) || [];
            return formations.filter(f => themeIdsInCategory.includes(f.themeId));
        }
        return formations.filter(f => f.themeId === selectedTheme);
    }, [formations, selectedCategory, selectedTheme, themes]);

    const handleCategoryChange = (categoryId: string) => {
        setSelectedCategory(categoryId === 'all' ? null : categoryId);
        setSelectedTheme(null); // Reset theme when category changes
    };

    const handleThemeChange = (themeId: string) => {
        setSelectedTheme(themeId === 'all' ? null : themeId);
    };

    const isLoading = areCategoriesLoading || areThemesLoading || areFormationsLoading;

    const selectedThemeName = useMemo(() => {
        if (!selectedTheme || !themes) return null;
        return themes.find(t => t.id === selectedTheme)?.name || null;
    }, [selectedTheme, themes]);

    const formationCount = filteredFormations?.length || 0;
    const dynamicCardTitle = selectedThemeName
        ? `${formationCount} Formation${formationCount !== 1 ? 's' : ''} in ${selectedThemeName}`
        : `${formationCount} Formation${formationCount !== 1 ? 's' : ''}`;
    
    const dynamicCardDescription = selectedThemeName
        ? `A list of available courses for the selected theme.`
        : `A list of all available courses. Use the filters to narrow down your search.`;


    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <Card className="mb-12 text-center shadow-sm">
                <CardHeader>
                    <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline">
                        Catalogue des Formations
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                        Explorez notre catalogue complet de formations conçues pour répondre à vos besoins de développement professionnel.
                    </p>
                </CardHeader>
                <CardContent>
                     <div className="mx-auto max-w-lg grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block text-left">Catégorie</label>
                            <Select onValueChange={handleCategoryChange} value={selectedCategory || 'all'}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filtrer par catégorie" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toutes les catégories</SelectItem>
                                    {categories?.map(category => (
                                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block text-left">Thème</label>
                            <Select onValueChange={handleThemeChange} value={selectedTheme || 'all'} disabled={!selectedCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filtrer par thème" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les thèmes</SelectItem>
                                    {filteredThemes.map(theme => (
                                        <SelectItem key={theme.id} value={theme.id}>{theme.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <main>
                <Card>
                    <CardHeader>
                        <CardTitle>{dynamicCardTitle}</CardTitle>
                        <CardDescription>{dynamicCardDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Formation</TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 10 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredFormations && filteredFormations.length > 0 ? (
                                    filteredFormations.map(formation => (
                                        <TableRow key={formation.id}>
                                            <TableCell className="font-medium">{formation.name}</TableCell>
                                            <TableCell className="font-mono text-xs">{formation.formationId}</TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/courses/${formation.id}`} className="text-sm text-primary hover:underline">
                                                    Voir les détails
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            Aucune formation ne correspond à votre sélection.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

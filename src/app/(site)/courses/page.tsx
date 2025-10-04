
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
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

type SortKey = 'formationId' | 'name';
type SortDirection = 'ascending' | 'descending';

export default function CoursesPage() {
    const firestore = useFirestore();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'formationId', direction: 'ascending' });


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
        // The default orderBy can be removed if we sort client-side, or kept for initial load.
        // Let's remove it to ensure client-side sorting is always applied consistently.
        return query(collection(firestore, 'course_formations'));
    }, [firestore]);

    // Data fetching
    const { data: categories, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesQuery);
    const { data: themes, isLoading: areThemesLoading } = useCollection<Theme>(themesQuery);
    const { data: formations, isLoading: areFormationsLoading } = useCollection<Omit<Formation, 'id'>>(formationsQuery);

    // Memoized filtering and sorting
    const filteredAndSortedFormations = useMemo(() => {
        if (!formations) return [];

        // Filtering logic
        let filtered = formations;
        if (selectedTheme) {
            filtered = formations.filter(f => f.themeId === selectedTheme);
        } else if (selectedCategory) {
            const themeIdsInCategory = themes?.filter(t => t.categoryId === selectedCategory).map(t => t.id) || [];
            filtered = formations.filter(f => themeIdsInCategory.includes(f.themeId));
        }

        // Sorting logic
        const sorted = [...filtered].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        
        return sorted;

    }, [formations, selectedCategory, selectedTheme, themes, sortConfig]);


    const handleCategoryChange = (categoryId: string) => {
        setSelectedCategory(categoryId === 'all' ? null : categoryId);
        setSelectedTheme(null); // Reset theme when category changes
    };

    const handleThemeChange = (themeId: string) => {
        setSelectedTheme(themeId === 'all' ? null : themeId);
    };

    const handleSort = (key: SortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return null;
        if (sortConfig.direction === 'ascending') return <ArrowUp className="ml-2 h-4 w-4" />;
        return <ArrowDown className="ml-2 h-4 w-4" />;
    };


    const isLoading = areCategoriesLoading || areThemesLoading || areFormationsLoading;

    const filteredThemes = useMemo(() => {
        if (!themes || !selectedCategory) return [];
        return themes.filter(theme => theme.categoryId === selectedCategory);
    }, [themes, selectedCategory]);

    const selectedThemeName = useMemo(() => {
        if (!selectedTheme || !themes) return null;
        return themes.find(t => t.id === selectedTheme)?.name || null;
    }, [selectedTheme, themes]);

    const formationCount = filteredAndSortedFormations?.length || 0;
    
    const dynamicCardTitle = useMemo(() => {
        const formationText = formationCount !== 1 ? 'Formations' : 'Formation';
        if (selectedThemeName) {
            return `${formationCount} ${formationText} en ${selectedThemeName}`;
        }
        return `${formationCount} ${formationText}`;
    }, [formationCount, selectedThemeName]);

    const dynamicCardDescription = selectedThemeName
        ? `Liste des formations disponibles pour le thème sélectionné.`
        : `Liste de toutes les formations disponibles. Utilisez les filtres pour affiner votre recherche.`;


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
                        <CardTitle className="font-headline text-3xl font-normal">{dynamicCardTitle}</CardTitle>
                        <CardDescription>{dynamicCardDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[120px]">
                                        <Button variant="ghost" onClick={() => handleSort('formationId')} className="px-0 hover:bg-transparent">
                                            ID {getSortIcon('formationId')}
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button variant="ghost" onClick={() => handleSort('name')} className="px-0 hover:bg-transparent">
                                            Formation {getSortIcon('name')}
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 10 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredAndSortedFormations && filteredAndSortedFormations.length > 0 ? (
                                    filteredAndSortedFormations.map(formation => (
                                        <TableRow key={formation.id}>
                                            <TableCell className="font-mono text-xs">{formation.formationId}</TableCell>
                                            <TableCell className="font-medium">{formation.name}</TableCell>
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


'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import Image from 'next/image';

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

interface Section {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
}

interface Page {
  id: string;
  title: string;
  sections: Section[];
}

type SortKey = 'formationId' | 'name';
type SortDirection = 'ascending' | 'descending';

export default function CoursesView() {
    const firestore = useFirestore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const themeIdFromUrl = searchParams.get('themeId');
    const categoryIdFromUrl = searchParams.get('categoryId');
    const isMobile = useIsMobile();

    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(categoryIdFromUrl);
    const [selectedTheme, setSelectedTheme] = React.useState<string | null>(themeIdFromUrl);
    const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: SortDirection }>({ key: 'formationId', direction: 'ascending' });

    const pageRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'pages', 'courses');
    }, [firestore]);
    
    const { data: pageData, isLoading: isPageLoading } = useDoc<Page>(pageRef);

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
        return query(collection(firestore, 'course_formations'));
    }, [firestore]);

    // Data fetching
    const { data: categories, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesQuery);
    const { data: themes, isLoading: areThemesLoading } = useCollection<Theme>(themesQuery);
    const { data: formations, isLoading: areFormationsLoading } = useCollection<Omit<Formation, 'id'>>(formationsQuery);

    const heroSection = pageData?.sections.find(s => s.id === 'hero');
    const heroImageUrl = heroSection?.imageUrl;

    // Effect to sync URL themeId with state
    React.useEffect(() => {
        const theme = themes?.find(t => t.id === themeIdFromUrl);
        if (themeIdFromUrl && theme) {
            setSelectedTheme(themeIdFromUrl);
            if (selectedCategory !== theme.categoryId) {
                setSelectedCategory(theme.categoryId);
            }
        } else if (categoryIdFromUrl) {
            setSelectedCategory(categoryIdFromUrl);
            setSelectedTheme(null);
        } else {
            setSelectedCategory(null);
            setSelectedTheme(null);
        }
    }, [themeIdFromUrl, categoryIdFromUrl, themes, selectedCategory]);


    // Memoized filtering and sorting
    const filteredAndSortedFormations = React.useMemo(() => {
        if (!formations) return [];

        let filtered = formations;
        if (selectedTheme) {
            filtered = formations.filter(f => f.themeId === selectedTheme);
        } else if (selectedCategory) {
            const themeIdsInCategory = themes?.filter(t => t.categoryId === selectedCategory).map(t => t.id) || [];
            filtered = formations.filter(f => themeIdsInCategory.includes(f.themeId));
        }

        const sorted = [...filtered].sort((a, b) => {
            const key = sortConfig.key;
            const valA = a[key] ?? '';
            const valB = b[key] ?? '';
            if (valA < valB) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (valA > valB) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        
        return sorted;

    }, [formations, selectedCategory, selectedTheme, themes, sortConfig]);


    const handleCategoryChange = (categoryId: string) => {
        const newCategoryId = categoryId === 'all' ? null : categoryId;
        setSelectedCategory(newCategoryId);
        setSelectedTheme(null); // Reset theme when category changes
        if (newCategoryId) {
            router.push(`/courses?categoryId=${newCategoryId}`);
        } else {
            router.push('/courses');
        }
    };

    const handleThemeChange = (themeId: string) => {
        const newThemeId = themeId === 'all' ? null : themeId;
        setSelectedTheme(newThemeId);
        if (newThemeId) {
             router.push(`/courses?themeId=${newThemeId}`);
        } else if (selectedCategory) {
             router.push(`/courses?categoryId=${selectedCategory}`);
        } else {
             router.push('/courses');
        }
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


    const isLoading = areCategoriesLoading || areThemesLoading || areFormationsLoading || isPageLoading;

    const filteredThemes = React.useMemo(() => {
        if (!themes) return [];
        if (!selectedCategory) return themes;
        return themes.filter(theme => theme.categoryId === selectedCategory);
    }, [themes, selectedCategory]);

    const selectedThemeName = React.useMemo(() => {
        if (!selectedTheme || !themes) return null;
        return themes.find(t => t.id === selectedTheme)?.name || null;
    }, [selectedTheme, themes]);

    const formationCount = filteredAndSortedFormations?.length || 0;
    
    const dynamicCardTitle = React.useMemo(() => {
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
            <Card className="mb-8 rounded-none border-x-0 md:min-h-[250px] flex flex-col justify-center text-center relative overflow-hidden">
                {heroImageUrl && (
                  <Image
                    src={heroImageUrl}
                    alt={heroSection?.title || "Catalogue des Formations"}
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative z-10 p-6 text-white">
                    <CardHeader>
                        <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline">
                            {isLoading ? <Skeleton className="h-10 w-3/4 mx-auto bg-gray-400/50" /> : heroSection?.title || "Catalogue des Formations"}
                        </h1>
                         {isLoading ? (
                            <div className="mx-auto mt-4 max-w-2xl text-gray-200">
                                <Skeleton className="h-6 w-full max-w-lg mx-auto bg-gray-400/50" />
                            </div>
                        ) : (
                            <p className="mx-auto mt-4 max-w-2xl text-gray-200">
                                {heroSection?.content || "Explorez notre catalogue complet de formations..."}
                            </p>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="mx-auto max-w-lg grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-2 block text-left">Catégorie</label>
                                <Select onValueChange={handleCategoryChange} value={selectedCategory || 'all'}>
                                    <SelectTrigger className="bg-transparent text-white border-white/50 hover:bg-white/10 hover:text-white">
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
                                <label className="text-sm font-medium text-gray-300 mb-2 block text-left">Thème</label>
                                <Select onValueChange={handleThemeChange} value={selectedTheme || 'all'} disabled={!themes || themes.length === 0}>
                                    <SelectTrigger className="bg-transparent text-white border-white/50 hover:bg-white/10 hover:text-white">
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
                </div>
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
                                    <TableHead className="w-[120px] hidden md:table-cell">
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
                                            <TableCell className="py-2 hidden md:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                                            <TableCell className="py-2"><Skeleton className="h-5 w-3/4" /></TableCell>
                                            <TableCell className="text-right py-2"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredAndSortedFormations && filteredAndSortedFormations.length > 0 ? (
                                    filteredAndSortedFormations.map(formation => (
                                        <TableRow key={formation.id}>
                                            <TableCell className="font-mono text-xs py-2 hidden md:table-cell">{formation.formationId}</TableCell>
                                            <TableCell className="font-medium py-2">{formation.name}</TableCell>
                                            <TableCell className="text-right py-2">
                                                <Button variant={isMobile ? "ghost" : "link"} size={isMobile ? "icon" : "default"} asChild>
                                                    <Link href={`/courses/${formation.id}?from=catalog`}>
                                                        {isMobile ? <ArrowRight className="h-4 w-4" /> : 'Voir les détails'}
                                                        <span className="sr-only">Voir les détails</span>
                                                    </Link>
                                                </Button>
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

    
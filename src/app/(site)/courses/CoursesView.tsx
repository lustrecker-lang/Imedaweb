'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';

// Interfaces
interface Category { id: string; name: string; }
interface Theme { id: string; name: string; categoryId: string; }
interface Formation { id: string; name: string; formationId: string; themeId: string; publicConcerne?: string; format?: string; }
interface Section { id: string; title: string; content: string; imageUrl?: string; }
interface Page { id: string; title: string; sections: Section[]; }
interface CoursesViewProps { formations: Formation[]; themes: Theme[]; categories: Category[]; pageData: Page | null; }
type SortKey = 'formationId' | 'name';
type SortDirection = 'ascending' | 'descending';

export default function CoursesView({ formations, themes, categories, pageData }: CoursesViewProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const themeIdFromUrl = searchParams.get('themeId');
    const categoryIdFromUrl = searchParams.get('categoryId');
    const [isMobile, setIsMobile] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(categoryIdFromUrl);
    const [selectedTheme, setSelectedTheme] = React.useState<string | null>(themeIdFromUrl);
    const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: SortDirection }>({ key: 'formationId', direction: 'ascending' });

    const heroSection = pageData?.sections?.find(s => s.id === 'hero');
    const heroImageUrl = heroSection?.imageUrl;

    // Sync URL params and handle loading state
    React.useEffect(() => {
        const theme = themes?.find(t => t.id === themeIdFromUrl);
        if (themeIdFromUrl && theme) {
            setSelectedTheme(themeIdFromUrl);
            if (selectedCategory !== theme.categoryId) setSelectedCategory(theme.categoryId);
        } else if (categoryIdFromUrl) {
            setSelectedCategory(categoryIdFromUrl);
            setSelectedTheme(null);
        } else {
            setSelectedCategory(null);
            setSelectedTheme(null);
        }

        if (formations) {
            setIsLoading(false);
        }

    }, [themeIdFromUrl, categoryIdFromUrl, themes, selectedCategory, formations]);

    // Filter and sort formations
    const filteredAndSortedFormations = React.useMemo(() => {
        if (!formations) return [];
        let filtered = formations;

        if (selectedTheme) {
            filtered = formations.filter(f => f.themeId === selectedTheme);
        } else if (selectedCategory) {
            const themeIdsInCategory = themes?.filter(t => t.categoryId === selectedCategory).map(t => t.id) || [];
            filtered = formations.filter(f => themeIdsInCategory.includes(f.themeId));
        }

        return [...filtered].sort((a, b) => {
            const key = sortConfig.key;
            const valA = a[key] ?? '';
            const valB = b[key] ?? '';
            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }, [formations, selectedCategory, selectedTheme, themes, sortConfig]);

    const handleCategoryChange = (categoryId: string) => {
        const newCategoryId = categoryId === 'all' ? null : categoryId;
        setSelectedCategory(newCategoryId);
        setSelectedTheme(null);
        if (newCategoryId) router.push(`/courses?categoryId=${newCategoryId}`);
        else router.push('/courses');
    };

    const handleThemeChange = (themeId: string) => {
        const newThemeId = themeId === 'all' ? null : themeId;
        setSelectedTheme(newThemeId);
        if (newThemeId) router.push(`/courses?themeId=${newThemeId}`);
        else if (selectedCategory) router.push(`/courses?categoryId=${selectedCategory}`);
        else router.push('/courses');
    };

    const handleSort = (key: SortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };

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
        if (isLoading) {
            return "Recherche de formations...";
        }
        const formationText = formationCount !== 1 ? 'Formations' : 'Formation';
        if (selectedThemeName) return `${formationCount} ${formationText} en ${selectedThemeName}`;
        return `${formationCount} ${formationText}`;
    }, [formationCount, selectedThemeName, isLoading]);

    const dynamicCardDescription = selectedThemeName
        ? `Liste des formations disponibles pour le thème sélectionné.`
        : `Liste de toutes les formations disponibles. Utilisez les filtres pour affiner votre recherche.`;

    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <Card className="mb-8 rounded-none border-x-0 md:min-h-[250px] flex flex-col justify-center relative overflow-hidden">
                {heroImageUrl && (
                    <Image
                        src={heroImageUrl}
                        alt={heroSection?.title || "Catalogue des Formations"}
                        fill
                        className="object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative z-10 p-6 w-full">
                    {/* Title and subtitle centered */}
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline text-white">
                            {heroSection?.title || "Catalogue des Formations"}
                        </h1>
                        <p className="mt-4 text-gray-200">
                            {heroSection?.content || "Explorez notre catalogue complet de formations..."}
                        </p>
                    </div>

                    {/* Filters responsive */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                        <div className="flex flex-col w-full sm:w-64">
                            <Select onValueChange={handleCategoryChange} value={selectedCategory || 'all'}>
                                <SelectTrigger className="bg-transparent text-white border-white/50 hover:bg-white/10 hover:text-white w-full">
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
                        <div className="flex flex-col w-full sm:w-64">
                            <Select onValueChange={handleThemeChange} value={selectedTheme || 'all'} disabled={!themes || themes.length === 0}>
                                <SelectTrigger className="bg-transparent text-white border-white/50 hover:bg-white/10 hover:text-white w-full">
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
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            <p className="flex items-center justify-center space-x-2">
                                                <span>Chargement des formations...</span>
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAndSortedFormations && filteredAndSortedFormations.length > 0 ? (
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
                                    )
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
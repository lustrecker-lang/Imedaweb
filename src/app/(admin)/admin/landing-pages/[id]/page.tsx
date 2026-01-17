// src/app/(admin)/admin/landing-pages/[id]/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Check, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface LandingPageData {
    slug: string;
    published: boolean;
    title: string;
    metaDescription: string;
    headline: string;
    description: string;
    cta: {
        text: string;
        type?: 'plp' | 'pdp';
        themeId?: string;
        categoryId?: string;
        courseId?: string;
        targetPLP?: 'catalog' | 'online';
    };
}

interface Category {
    id: string;
    name: string;
    isOnline?: boolean;
}

interface Theme {
    id: string;
    name: string;
    categoryId?: string;
}

interface Course {
    id: string;
    name: string;
    formationId?: string;
    isOnline?: boolean;
    themeId?: string;
}

export default function LandingPageEditorPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const params = useParams();
    const pageId = params.id as string;
    const isNew = pageId === 'new';

    const landingPageRef = useMemoFirebase(() => {
        if (isNew || !firestore || !pageId) return null;
        return doc(firestore, 'landing_pages', pageId);
    }, [firestore, isNew, pageId]);
    const { data: landingPage, isLoading: isLoadingPage } = useDoc<LandingPageData>(landingPageRef);


    const themesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const themesRef = collection(firestore, 'course_themes');
        return query(themesRef, orderBy('name', 'asc'));
    }, [firestore]);
    const { data: themes } = useCollection<Theme>(themesQuery);

    const categoriesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const categoriesRef = collection(firestore, 'course_categories');
        return query(categoriesRef, orderBy('name', 'asc'));
    }, [firestore]);
    const { data: categories } = useCollection<Category>(categoriesQuery);

    const coursesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const coursesRef = collection(firestore, 'course_formations');
        return query(coursesRef, orderBy('name', 'asc'));
    }, [firestore]);
    const { data: courses } = useCollection<Course>(coursesQuery);

    const [formData, setFormData] = useState<LandingPageData>({
        slug: '',
        published: false,
        title: '',
        metaDescription: '',
        headline: '',
        description: '',
        cta: {
            text: 'Découvrir nos formations',
            type: 'plp',
            themeId: '',
            categoryId: '',
            courseId: '',
            targetPLP: 'catalog',
        },
    });
    const [open, setOpen] = useState(false);

    const filteredCategories = useMemo(() => {
        if (!categories) return [];
        if (formData.cta.targetPLP === 'online') {
            return categories.filter(c => c.isOnline);
        }
        return categories.filter(c => !c.isOnline);
    }, [categories, formData.cta.targetPLP]);

    const filteredThemes = useMemo(() => {
        if (!themes || !categories) return [];
        if (formData.cta.targetPLP === 'online') {
            const onlineCatIds = categories.filter(c => c.isOnline).map(c => c.id);
            return themes.filter(t => onlineCatIds.includes(t.categoryId || ''));
        }
        const standardCatIds = categories.filter(c => !c.isOnline).map(c => c.id);
        return themes.filter(t => standardCatIds.includes(t.categoryId || ''));
    }, [themes, categories, formData.cta.targetPLP]);

    const filteredCourses = useMemo(() => {
        if (!courses) return [];
        if (formData.cta.targetPLP === 'online') {
            return courses.filter(c => c.isOnline);
        }
        return courses.filter(c => !c.isOnline);
    }, [courses, formData.cta.targetPLP]);

    useEffect(() => {
        if (landingPage && !isNew) {
            setFormData(landingPage);
        }
    }, [landingPage, isNew]);

    const handleSave = async () => {
        if (!firestore) return;

        try {
            const docRef = isNew ? doc(collection(firestore, 'landing_pages')) : doc(firestore, 'landing_pages', pageId);

            await setDoc(docRef, {
                ...formData,
                updatedAt: serverTimestamp(),
                ...(isNew && { createdAt: serverTimestamp() }),
            }, { merge: true });

            toast({
                title: 'Success',
                description: 'Landing page saved successfully',
            });

            if (isNew) {
                router.push('/admin/landing-pages');
            }
        } catch (error) {
            console.error('Error saving landing page:', error);
            toast({
                title: 'Error',
                description: 'Failed to save landing page',
                variant: 'destructive',
            });
        }
    };

    if (isLoadingPage && !isNew) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/landing-pages">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-3xl font-normal tracking-tighter font-headline">
                    {isNew ? 'Create Landing Page' : 'Edit Landing Page'}
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Page Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="published"
                            checked={formData.published}
                            onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                        />
                        <Label htmlFor="published">Published</Label>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">URL Slug *</Label>
                        <Input
                            id="slug"
                            placeholder="leadership-training-africa"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                        />
                        <p className="text-sm text-muted-foreground">Will be accessible at: /landing/{formData.slug || 'your-slug'}</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">SEO Title *</Label>
                        <Input
                            id="title"
                            placeholder="Leadership Training in Africa | IMEDA"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="metaDescription">SEO Meta Description *</Label>
                        <Textarea
                            id="metaDescription"
                            placeholder="Discover our comprehensive leadership training programs designed for African professionals..."
                            value={formData.metaDescription}
                            onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Hero Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="headline">Headline (Big Title) *</Label>
                        <Input
                            id="headline"
                            placeholder="Transform Your Leadership Skills"
                            value={formData.headline}
                            onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            placeholder="Join over 10,000 professionals who have enhanced their leadership capabilities through our world-class training programs."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Call to Action</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="ctaText">Button Text *</Label>
                        <Input
                            id="ctaText"
                            placeholder="Découvrir nos formations"
                            value={formData.cta.text}
                            onChange={(e) => setFormData({ ...formData, cta: { ...formData.cta, text: e.target.value } })}
                        />
                    </div>

                    <div className="space-y-4">
                        <Label>Destination Environment</Label>
                        <RadioGroup
                            value={formData.cta.targetPLP || 'catalog'}
                            onValueChange={(value: 'catalog' | 'online') => setFormData({
                                ...formData,
                                cta: {
                                    ...formData.cta,
                                    targetPLP: value,
                                    themeId: '',
                                    categoryId: '',
                                    courseId: '',
                                }
                            })}
                            className="flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="catalog" id="env-catalog" />
                                <Label htmlFor="env-catalog">Standard Catalog (/courses)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="online" id="env-online" />
                                <Label htmlFor="env-online">IMEDA Online (/online)</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label>Link Destination Type</Label>
                        <RadioGroup
                            value={formData.cta.type || 'plp'}
                            onValueChange={(value: 'plp' | 'pdp') => setFormData({
                                ...formData,
                                cta: {
                                    ...formData.cta,
                                    type: value,
                                    text: value === 'pdp' ? 'Voir la formation' : 'Découvrir nos formations'
                                }
                            })}
                            className="flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="plp" id="plp" />
                                <Label htmlFor="plp">Course List (PLP)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="pdp" id="pdp" />
                                <Label htmlFor="pdp">Specific Course (PDP)</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {(formData.cta.type === 'plp' || !formData.cta.type) && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="themeId">Filter by Theme (Optional)</Label>
                                <Select
                                    value={formData.cta.themeId || 'none'}
                                    onValueChange={(value) => setFormData({
                                        ...formData,
                                        cta: { ...formData.cta, themeId: value === 'none' ? '' : value, categoryId: '' }
                                    })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a theme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No filter</SelectItem>
                                        {filteredThemes?.map((theme: Theme) => (
                                            <SelectItem key={theme.id} value={theme.id}>
                                                {theme.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="categoryId">Filter by Category (Optional)</Label>
                                <Select
                                    value={formData.cta.categoryId || 'none'}
                                    onValueChange={(value) => setFormData({
                                        ...formData,
                                        cta: { ...formData.cta, categoryId: value === 'none' ? '' : value, themeId: '' }
                                    })}
                                    disabled={!!formData.cta.themeId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No filter</SelectItem>
                                        {filteredCategories?.map((category: Category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formData.cta.themeId && (
                                    <p className="text-sm text-muted-foreground">Clear theme filter to select a category</p>
                                )}
                            </div>
                        </>
                    )}

                    {formData.cta.type === 'pdp' && (
                        <div className="space-y-2">
                            <Label htmlFor="courseId">Select Course</Label>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="w-full justify-between"
                                    >
                                        {formData.cta.courseId
                                            ? courses?.find((course) => course.id === formData.cta.courseId)?.name
                                            : "Select a course..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search course by name or code..." />
                                        <CommandList>
                                            <CommandEmpty>No course found.</CommandEmpty>
                                            <CommandGroup>
                                                {filteredCourses?.map((course: Course) => (
                                                    <CommandItem
                                                        key={course.id}
                                                        value={`${course.name} ${course.formationId || ''}`}
                                                        onSelect={() => {
                                                            setFormData({
                                                                ...formData,
                                                                cta: { ...formData.cta, courseId: course.id }
                                                            });
                                                            setOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.cta.courseId === course.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span>{course.name}</span>
                                                            {course.formationId && (
                                                                <span className="text-xs text-muted-foreground">{course.formationId}</span>
                                                            )}
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button variant="outline" asChild>
                    <Link href="/admin/landing-pages">Cancel</Link>
                </Button>
                <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Landing Page
                </Button>
            </div>
        </div>
    );
}

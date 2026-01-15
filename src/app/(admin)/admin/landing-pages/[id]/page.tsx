// src/app/(admin)/admin/landing-pages/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
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
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

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
    };
}

interface Course {
    id: string;
    name: string;
}

interface Theme {
    id: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
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
        },
    });

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
                                        {themes?.map((theme) => (
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
                                        {categories?.map((category) => (
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
                            <Select
                                value={formData.cta.courseId || ''}
                                onValueChange={(value) => setFormData({
                                    ...formData,
                                    cta: { ...formData.cta, courseId: value }
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a course" />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses?.map((course) => (
                                        <SelectItem key={course.id} value={course.id}>
                                            {course.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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

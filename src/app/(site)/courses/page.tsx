// src/app/courses/page.tsx

import { Suspense } from 'react';
import { adminDb } from '@/firebase/admin';
import { Metadata } from 'next';
import CoursesView from './CoursesView';
import { Skeleton } from '@/components/ui/skeleton';

// Force dynamic rendering to ensure fresh data from Firestore on each request
export const dynamic = 'force-dynamic';

// Interfaces for server-side data fetching
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

// 1. Dynamic Metadata Generation
export async function generateMetadata(): Promise<Metadata> {
    try {
        const formationsSnap = await adminDb.collection('course_formations').get();
        const numberOfFormations = formationsSnap.size;

        return {
            title: `Découvrez nos ${numberOfFormations} formations professionnelles`,
            description: `Parcourez notre catalogue complet de ${numberOfFormations} formations pour trouver le programme idéal.`,
            alternates: { canonical: '/courses' },
        };
    } catch (error) {
        console.error("Error fetching metadata:", error);
        return {
            title: 'Catalogue des Formations',
            description: 'Découvrez notre catalogue complet de formations professionnelles.',
        };
    }
}

// Data fetching function on the server
async function getCoursesData() {
    try {
        const [formationsSnap, themesSnap, categoriesSnap, pageSnap] = await Promise.all([
            adminDb.collection('course_formations').get(),
            adminDb.collection('course_themes').get(),
            adminDb.collection('course_categories').get(),
            adminDb.collection('pages').doc('courses').get() // Fetch the hero section data
        ]);

        const formations = formationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Formation[];
        const themes = themesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Theme[];
        const categories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
        const pageData = pageSnap.exists ? pageSnap.data() as Page : null;

        return {
            formations,
            themes,
            categories,
            pageData, // Return the hero section data
        };
    } catch (error) {
        console.error("Error fetching courses data:", error);
        return { formations: [], themes: [], categories: [], pageData: null };
    }
}

// 2. Define the loading skeleton component here
const CoursesPageSkeleton = () => {
    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <Skeleton className="mb-8 h-[250px] w-full" />
            <div className="space-y-4">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="mt-6 h-48 w-full" />
            </div>
        </div>
    );
};

// 3. The main page component
export default async function CoursesPage() {
    const coursesData = await getCoursesData();

    return (
        <Suspense fallback={<CoursesPageSkeleton />}>
            {/* Pass the hero section data to the client component */}
            <CoursesView {...coursesData} />
        </Suspense>
    );
}
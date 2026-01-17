// src/app/online/page.tsx

import { Suspense } from 'react';
import { adminDb } from '@/firebase/admin';
import { Metadata } from 'next';
import CoursesView from '../courses/CoursesView';
import { Skeleton } from '@/components/ui/skeleton';

// Force dynamic rendering to ensure fresh data from Firestore on each request
export const dynamic = 'force-dynamic';

// Interfaces for server-side data fetching
interface Category {
    id: string;
    name: string;
    isOnline?: boolean;
}

interface Theme {
    id: string;
    name: string;
    categoryId: string;
    isOnline?: boolean;
}

interface Formation {
    id: string;
    name: string;
    formationId: string;
    themeId: string;
    publicConcerne?: string;
    format?: string;
    isOnline?: boolean;
    pricePerMonth?: string;
    durationMonths?: string;
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
    return {
        title: 'Formations en Ligne | IMEDA',
        description: 'Découvrez nos formations en ligne pour les entreprises et les professionnels.',
        alternates: { canonical: '/online' },
    };
}

// Data fetching function on the server
async function getCoursesData() {
    try {
        const [formationsSnap, themesSnap, categoriesSnap, pageSnap] = await Promise.all([
            adminDb.collection('course_formations').get(),
            adminDb.collection('course_themes').get(),
            adminDb.collection('course_categories').get(),
            adminDb.collection('pages').doc('online').get() // Fetch specific hero section for online if exists, else fallback or use 'courses'
        ]);

        // Fallback to courses hero if online doesn't exist, or just use it. 
        // For now, let's assume we might want to use the 'courses' one if 'online' page content isn't defined yet, 
        // or just pass null and let CoursesView handle a default.
        // Actually, let's fetch 'courses' page data as fallback if 'online' doc is missing, 
        // but ideally we should have a separate page doc.
        // Let's stick to simple: try 'online', if empty use 'courses'.
        let pageData = pageSnap.exists ? pageSnap.data() as Page : null;
        if (!pageData) {
            const coursesPageSnap = await adminDb.collection('pages').doc('courses').get();
            pageData = coursesPageSnap.exists ? coursesPageSnap.data() as Page : null;
            // Override title for the fallback
            if (pageData && pageData.sections) {
                const heroValues = pageData.sections.find(s => s.id === 'hero');
                if (heroValues) {
                    // We create a new object to avoid mutating if cached (though it's fresh request)
                    pageData = {
                        ...pageData,
                        sections: pageData.sections.map(s => s.id === 'hero' ? { ...s, title: "Formations en Ligne", content: "Solutions de formation flexibles pour les entreprises" } : s)
                    };
                }
            }
        }


        const formations = formationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Formation[];
        const themes = themesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Theme[];
        const categories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];

        return {
            formations,
            themes,
            categories,
            pageData,
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
export default async function OnlineCoursesPage() {
    const coursesData = await getCoursesData();

    return (
        <Suspense fallback={<CoursesPageSkeleton />}>
            {/* Pass mode='online' to filter accordingly */}
            <CoursesView {...coursesData} mode="online" />
        </Suspense>
    );
}

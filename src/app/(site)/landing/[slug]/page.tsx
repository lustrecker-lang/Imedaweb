import { Suspense } from 'react';
import { adminDb } from '@/firebase/admin';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Skeleton } from '@/components/ui/skeleton';
import LandingPageView from './LandingPageView';
import { getHeroData, getReferencesData, getFeaturesData, getCatalogData } from '@/app/(site)/page';

interface LandingPage {
    id: string;
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

async function getLandingPage(slug: string): Promise<LandingPage | null> {
    try {
        const landingPagesRef = adminDb.collection('landing_pages');
        const querySnapshot = await landingPagesRef.where('slug', '==', slug).where('published', '==', true).limit(1).get();

        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
            id: doc.id,
            slug: data.slug,
            published: data.published,
            title: data.title,
            metaDescription: data.metaDescription,
            headline: data.headline,
            description: data.description,
            cta: data.cta,
        } as LandingPage;
    } catch (error) {
        console.error('Error fetching landing page:', error);
        return null;
    }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const landingPage = await getLandingPage(params.slug);

    if (!landingPage) {
        return {
            title: 'Page Not Found',
            description: 'The requested page could not be found.',
        };
    }

    return {
        title: landingPage.title,
        description: landingPage.metaDescription,
        alternates: {
            canonical: `/landing/${landingPage.slug}`,
        },
    };
}

const LandingPageSkeleton = () => (
    <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <Skeleton className="h-12 w-3/4 mb-6" />
            <Skeleton className="h-6 w-2/3 mb-8" />
            <Skeleton className="h-12 w-48" />
        </div>
    </div>
);

export default async function LandingPage({ params }: { params: { slug: string } }) {
    const landingPage = await getLandingPage(params.slug);

    if (!landingPage) {
        notFound();
    }

    const [heroData, referencesData, featuresData, catalogData] = await Promise.all([
        getHeroData(),
        getReferencesData(),
        getFeaturesData(),
        getCatalogData(),
    ]);

    return (
        <Suspense fallback={<LandingPageSkeleton />}>
            <LandingPageView
                landingPage={landingPage}
                heroData={heroData}
                referencesData={referencesData}
                featuresData={featuresData}
                catalogData={catalogData}
            />
        </Suspense>
    );
}

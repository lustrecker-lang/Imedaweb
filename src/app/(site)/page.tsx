// src/app/(site)/page.tsx
import { adminDb } from '@/firebase/admin';
import { HomeClient } from './home-client';
import { Metadata } from 'next';
import { DocumentData } from 'firebase-admin/firestore';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Interfaces
interface Section { id: string; title: string; content: string; imageUrl?: string; }
interface Page { id: string; title: string; sections: Section[]; ogTitle?: string; ogDescription?: string; ogImage?: string; }
interface Campus { id: string; name: string; slug: string; description?: string; imageUrl?: string; }
interface Category { id: string; name: string; description?: string; mediaUrl?: string; }
interface Theme { id: string; name: string; description?: string; categoryId: string; }
interface Formation { id: string; themeId: string; }

// Dynamic Metadata Generation for Home Page
export async function generateMetadata(): Promise<Metadata> {
  const pageSnap = await adminDb.collection('pages').doc('home').get();
  const pageContent = pageSnap.exists ? pageSnap.data() as DocumentData : null;

  const ogTitle = pageContent?.ogTitle || 'IMEDA';
  const ogDescription = pageContent?.ogDescription || 'A clean and professional web application.';
  const ogImage = pageContent?.ogImage || null;
  const canonicalUrl = 'https://imeda.com/'; // Replace with your actual domain

  return {
    title: pageContent?.title || 'IMEDA',
    description: pageContent?.description || 'A clean and professional web application.',
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      type: 'website',
      images: ogImage ? [{ url: ogImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImage || ''],
    },
  };
}

async function getHomePageData() {
  try {
    const [pageSnap, categoriesSnap, themesSnap, formationsSnap] = await Promise.all([
      adminDb.collection('pages').doc('home').get(),
      adminDb.collection('course_categories').orderBy('name', 'asc').get(),
      adminDb.collection('course_themes').orderBy('name', 'asc').get(),
      adminDb.collection('course_formations').get(),
    ]);

    const homePage = pageSnap.exists ? { id: pageSnap.id, ...pageSnap.data() } as Page : null;
    // Campuses are now fetched in the main layout, so we don't need to fetch them here
    const categories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
    const themes = themesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Theme[];
    const formations = formationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Formation[];

    // Fetch campuses separately just for this page's component props
    const campusesSnap = await adminDb.collection('campuses').orderBy('name', 'asc').get();
    const campuses = campusesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Campus[];


    return { homePage, campuses, categories, themes, formations };
  } catch (error) {
    console.error("Failed to fetch homepage data:", error);
    return { homePage: null, campuses: [], categories: [], themes: [], formations: [] };
  }
}

// Loading Skeleton for the home page
const HomePageSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <Skeleton className="h-[400px] w-full mb-12" />
      <div className="space-y-12">
        <Skeleton className="h-6 w-1/2 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
};

export default async function Home() {
  const data = await getHomePageData();
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomeClient {...data} />
    </Suspense>
  );
}

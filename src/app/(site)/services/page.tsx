// src/app/(site)/services/page.tsx
import { Suspense } from 'react';
import { adminDb } from '@/firebase/admin';
import { notFound } from 'next/navigation';
import { DocumentData } from 'firebase-admin/firestore';
import { Metadata } from 'next';
import ServicesView from './ServicesView';
import { Skeleton } from '@/components/ui/skeleton';

// Force dynamic rendering to ensure fresh data from Firestore on each request
export const dynamic = 'force-dynamic';

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
  themeId: string;
}

async function getPageData(): Promise<{ pageData: Page | null; categories: Category[]; themes: Theme[]; formations: Formation[] }> {
  try {
    const [pageSnap, categoriesSnap, themesSnap, formationsSnap] = await Promise.all([
      adminDb.collection('pages').doc('services').get(),
      adminDb.collection('course_categories').orderBy('name').get(),
      adminDb.collection('course_themes').orderBy('name').get(),
      adminDb.collection('course_formations').get(),
    ]);

    const pageData = pageSnap.exists ? { id: pageSnap.id, ...pageSnap.data() } as Page : null;
    const categories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    const themes = themesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Theme));
    const formations = formationsSnap.docs.map(doc => ({ id: doc.id, themeId: doc.data().themeId } as Formation));

    return { pageData, categories, themes, formations };

  } catch (error) {
    console.error("Error fetching 'Services' page data:", error);
    return { pageData: null, categories: [], themes: [], formations: [] };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { pageData } = await getPageData();
  if (!pageData) {
    return {
      title: 'Services | IMEDA',
      description: 'Des solutions sur mesure pour les entreprises.',
    };
  }
  const heroSection = pageData.sections.find(s => s.id === 'hero');
  return {
    title: `${heroSection?.title || pageData.title} | IMEDA`,
    description: heroSection?.content.substring(0, 160) || 'Des solutions sur mesure pour les entreprises.',
  };
}

const PageSkeleton = () => (
  <div className="container mx-auto px-4 py-12 md:px-6">
    <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
      <Skeleton className="h-full w-full" />
    </div>
  </div>
);

export default async function ServicesPage() {
  const data = await getPageData();

  if (!data.pageData) {
    notFound();
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <ServicesView {...data} />
    </Suspense>
  );
}

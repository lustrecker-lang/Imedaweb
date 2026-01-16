
// src/app/(site)/references/page.tsx
import { Suspense } from 'react';
import { adminDb } from '@/firebase/admin';
import { notFound } from 'next/navigation';
import { DocumentData } from 'firebase-admin/firestore';
import { Metadata } from 'next';
import ReferencesView from './ReferencesView';
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

interface Reference {
  id: string;
  name: string;
  logoUrl: string;
}

async function getPageData(): Promise<{ pageData: Page | null; references: Reference[] }> {
  try {
    const [pageSnap, referencesSnap] = await Promise.all([
      adminDb.collection('pages').doc('references').get(),
      adminDb.collection('references').orderBy('name', 'asc').get()
    ]);

    const pageData = pageSnap.exists ? { id: pageSnap.id, ...pageSnap.data() } as Page : null;
    const references = referencesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reference[];

    return { pageData, references };
  } catch (error) {
    console.error("Error fetching 'Références' page data:", error);
    return { pageData: null, references: [] };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { pageData } = await getPageData();
  if (!pageData) {
    return {
      title: 'Références | IMEDA',
      description: 'Découvrez les entreprises qui nous font confiance.',
    };
  }
  const heroSection = pageData.sections.find(s => s.id === 'hero');
  return {
    title: `${heroSection?.title || pageData.title} | IMEDA`,
    description: heroSection?.content.substring(0, 160) || 'Découvrez les entreprises qui nous font confiance.',
  };
}

const PageSkeleton = () => (
  <div className="container mx-auto px-4 py-12 md:px-6">
    <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
      <Skeleton className="h-full w-full" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mt-12">
      {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
    </div>
  </div>
);

export default async function ReferencesPage() {
  const { pageData, references } = await getPageData();

  if (!pageData) {
    notFound();
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <ReferencesView pageData={pageData} references={references} />
    </Suspense>
  );
}

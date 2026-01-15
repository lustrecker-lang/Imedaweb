// src/app/(site)/presentation/page.tsx
import { Suspense } from 'react';
import { adminDb } from '@/firebase/admin';
import { notFound } from 'next/navigation';
import { DocumentData } from 'firebase-admin/firestore';
import { Metadata } from 'next';
import PresentationView from './PresentationView';
import { Skeleton } from '@/components/ui/skeleton';

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

async function getPageData(): Promise<Page | null> {
  try {
    const pageSnap = await adminDb.collection('pages').doc('presentation').get();
    if (!pageSnap.exists) {
      return null;
    }
    return { id: pageSnap.id, ...pageSnap.data() } as Page;
  } catch (error) {
    console.error("Error fetching 'Présentation' page data:", error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const pageData = await getPageData();
  if (!pageData) {
    return {
      title: 'Présentation | IMEDA',
      description: 'Découvrez qui nous sommes, notre vision et notre engagement.',
    };
  }
  const heroSection = pageData.sections.find(s => s.id === 'hero');
  return {
    title: `${heroSection?.title || pageData.title} | IMEDA`,
    description: heroSection?.content.substring(0, 160) || 'Découvrez qui nous sommes, notre vision et notre engagement.',
    alternates: { canonical: '/presentation' },
  };
}

const PageSkeleton = () => (
  <div className="container mx-auto px-4 py-12 md:px-6">
    <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
      <Skeleton className="h-full w-full" />
    </div>
  </div>
);

export default async function PresentationPage() {
  const pageData = await getPageData();

  if (!pageData) {
    notFound();
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <PresentationView pageData={pageData} />
    </Suspense>
  );
}

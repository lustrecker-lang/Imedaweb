// src/app/(site)/partenariats/page.tsx
import { Suspense } from 'react';
import { adminDb } from '@/firebase/admin';
import { notFound } from 'next/navigation';
import { DocumentData } from 'firebase-admin/firestore';
import { Metadata } from 'next';
import PartnershipsView from './PartnershipsView';
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

async function getPageData(): Promise<Page | null> {
  try {
    const pageSnap = await adminDb.collection('pages').doc('partenariats').get();
    if (!pageSnap.exists) {
      return null;
    }
    return { id: pageSnap.id, ...pageSnap.data() } as Page;
  } catch (error) {
    console.error("Error fetching 'Partenariats' page data:", error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const pageData = await getPageData();
  if (!pageData) {
    return {
      title: 'Partenariats | IMEDA',
      description: 'Collaborez avec nous pour un succès mutuel.',
    };
  }
  const heroSection = pageData.sections.find(s => s.id === 'hero');
  return {
    title: `${heroSection?.title || pageData.title} | IMEDA`,
    description: heroSection?.content.substring(0, 160) || 'Collaborez avec nous pour un succès mutuel.',
  };
}

const PageSkeleton = () => (
  <div className="container mx-auto px-4 py-12 md:px-6">
    <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
      <Skeleton className="h-full w-full" />
    </div>
    <div className="py-16 md:py-24">
      <Skeleton className="h-10 w-2/3 mx-auto mb-4" />
      <Skeleton className="h-6 w-1/2 mx-auto" />
      <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    </div>
  </div>
);

export default async function PartnershipsPage() {
  const pageData = await getPageData();

  // If there's no data and we want to show a 404, we can uncomment this
  // if (!pageData) {
  //   notFound();
  // }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <PartnershipsView pageData={pageData} />
    </Suspense>
  );
}

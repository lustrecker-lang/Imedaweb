
// src/app/(site)/catalog/page.tsx
import { Suspense } from 'react';
import { adminDb } from '@/firebase/admin';
import { notFound } from 'next/navigation';
import { DocumentData } from 'firebase-admin/firestore';
import { Metadata } from 'next';
import CatalogView from './CatalogView';
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
    const pageSnap = await adminDb.collection('pages').doc('catalog').get();
    if (!pageSnap.exists) {
      return null;
    }
    return { id: pageSnap.id, ...pageSnap.data() } as Page;
  } catch (error) {
    console.error("Error fetching 'Catalog' page data:", error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const pageData = await getPageData();
  if (!pageData) {
    return {
      title: 'Catalogue | IMEDA',
      description: 'Téléchargez notre catalogue complet de formations.',
    };
  }
  const heroSection = pageData.sections.find(s => s.id === 'hero');
  return {
    title: `${heroSection?.title || pageData.title} | IMEDA`,
    description: heroSection?.content.substring(0, 160) || 'Téléchargez notre catalogue complet de formations.',
  };
}

const PageSkeleton = () => (
  <div className="container mx-auto max-w-4xl px-4 py-12 md:px-6 flex items-center justify-center min-h-[calc(100vh-10rem)]">
    <div className="w-full overflow-hidden border rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="p-8 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <div className="space-y-4 pt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <Skeleton className="aspect-[3/4] w-full" />
      </div>
    </div>
  </div>
);

export default async function CatalogPageWrapper() {
  let pageData = await getPageData();

  if (!pageData) {
    // If no data in Firestore, create default data
    pageData = {
      id: "catalog",
      title: "Catalogue",
      sections: [
        {
          id: "hero",
          title: "Télécharger le catalogue",
          content: "Entrez votre e-mail pour recevoir le catalogue complet de nos formations 2025-26.",
          imageUrl: "https://picsum.photos/seed/catalog-page/600/800",
        },
      ],
    };
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <CatalogView pageData={pageData} />
    </Suspense>
  );
}

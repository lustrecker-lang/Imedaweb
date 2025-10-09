// src/app/(site)/notre-approche/page.tsx
import { Suspense } from 'react';
import { adminDb } from '@/firebase/admin';
import { notFound } from 'next/navigation';
import { DocumentData } from 'firebase-admin/firestore';
import { Metadata } from 'next';
import NotreApprocheView from './NotreApprocheView';
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
    const pageSnap = await adminDb.collection('pages').doc('notre-approche').get();
    if (!pageSnap.exists) {
      return null;
    }
    return { id: pageSnap.id, ...pageSnap.data() } as Page;
  } catch (error) {
    console.error("Error fetching 'Notre approche' page data:", error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const pageData = await getPageData();
  if (!pageData) {
    return {
      title: 'Notre Approche | IMEDA',
      description: 'Découvrez notre méthodologie unique.',
    };
  }
  const heroSection = pageData.sections.find(s => s.id === 'hero');
  return {
    title: `${heroSection?.title || pageData.title} | IMEDA`,
    description: heroSection?.content.substring(0, 160) || 'Découvrez notre méthodologie unique.',
  };
}

const PageSkeleton = () => (
    <div className="flex flex-col">
        <div className="container py-8">
            <Skeleton className="h-[40vh] w-full" />
        </div>
        <div className="py-16 bg-muted/30">
            <div className="container text-center space-y-4 max-w-3xl mx-auto">
                 <Skeleton className="h-12 w-12 mx-auto" />
                 <Skeleton className="h-6 w-full" />
                 <Skeleton className="h-6 w-5/6" />
            </div>
        </div>
         <div className="py-16">
            <div className="container space-y-16">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <Skeleton className="aspect-square w-full" />
                    <div className="space-y-4"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /><Skeleton className="h-10 w-40 mt-4" /></div>
                </div>
                 <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-4 md:col-start-2"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /><Skeleton className="h-10 w-40 mt-4" /></div>
                    <Skeleton className="aspect-square w-full md:row-start-1" />
                </div>
            </div>
        </div>
    </div>
);

export default async function NotreApprochePage() {
  const pageData = await getPageData();

  if (!pageData) {
    notFound();
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <NotreApprocheView pageData={pageData} />
    </Suspense>
  );
}


// src/app/(site)/careers/page.tsx
import { Suspense } from 'react';
import { adminDb } from '@/firebase/admin';
import { notFound } from 'next/navigation';
import { DocumentData } from 'firebase-admin/firestore';
import { Metadata } from 'next';
import CareersView from './CareersView';
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

const jobOpeningSchema = {
  positionName: '',
  type: '',
  workMode: '',
  description: '',
  fullDescription: ''
};
interface JobOpening {
  id: string;
  positionName: string;
  type: string;
  workMode: string;
  description: string;
  fullDescription?: string;
}

async function getPageData(): Promise<{ pageData: Page | null; jobOpenings: JobOpening[] }> {
  try {
    const pageSnap = await adminDb.collection('pages').doc('careers').get();
    const pageData = pageSnap.exists ? { id: pageSnap.id, ...pageSnap.data() } as Page : null;

    const jobsSnap = await adminDb.collection('jobOpenings').orderBy('positionName', 'asc').get();
    const jobOpenings = jobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobOpening));

    return { pageData, jobOpenings };

  } catch (error) {
    console.error("Error fetching 'Carrières' page data:", error);
    return { pageData: null, jobOpenings: [] };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { pageData } = await getPageData();
  if (!pageData) {
    return {
      title: 'Carrières | IMEDA',
      description: 'Rejoignez notre équipe et construisons l\'avenir ensemble.',
    };
  }
  const heroSection = pageData.sections.find(s => s.id === 'hero');
  return {
    title: `${heroSection?.title || pageData.title} | IMEDA`,
    description: heroSection?.content.substring(0, 160) || 'Rejoignez notre équipe et construisons l\'avenir ensemble.',
  };
}

const PageSkeleton = () => (
  <div className="container mx-auto px-4 py-12 md:px-6">
    <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden rounded-lg">
      <Skeleton className="h-full w-full" />
    </div>
    <div className="py-16 md:py-24">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  </div>
);

export default async function CareersPage() {
  const { pageData, jobOpenings } = await getPageData();

  if (!pageData) {
    notFound();
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <CareersView pageData={pageData} jobOpenings={jobOpenings} />
    </Suspense>
  );
}

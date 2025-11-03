
// src/app/(site)/not-found.tsx
import { Suspense } from 'react';
import { adminDb } from '@/firebase/admin';
import { notFound } from 'next/navigation';
import { DocumentData } from 'firebase-admin/firestore';
import { Metadata } from 'next';
import NotFoundView from './not-found-view';
import { Skeleton } from '@/components/ui/skeleton';

interface Section {
  id: string;
  title: string;
  content: string;
}

interface Page {
  id: string;
  title: string;
  sections: Section[];
}

async function getPageData(): Promise<Page | null> {
  try {
    const pageSnap = await adminDb.collection('pages').doc('not-found').get();
    if (!pageSnap.exists) {
      return null;
    }
    return { id: pageSnap.id, ...pageSnap.data() } as Page;
  } catch (error) {
    console.error("Error fetching 'Not Found' page data:", error);
    return null;
  }
}

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
};

const PageSkeleton = () => (
    <div className="container mx-auto max-w-2xl px-4 py-12 md:px-6 text-center min-h-[50vh] flex flex-col items-center justify-center">
        <Skeleton className="h-20 w-48 mb-4" />
        <Skeleton className="h-10 w-2/3 mb-4" />
        <Skeleton className="h-6 w-full max-w-md mb-8" />
        <div className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
        </div>
    </div>
);

export default async function NotFoundPage() {
  let pageData = await getPageData();

  if (!pageData) {
    // Provide default content if it's not in the database
    pageData = {
        id: "not-found",
        title: "Page Not Found",
        sections: [
            {
                id: "main",
                title: "Page Introuvable",
                content: "Désolé, la page que vous recherchez n'existe pas ou a été déplacée.",
            },
        ],
    };
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <NotFoundView pageData={pageData} />
    </Suspense>
  );
}


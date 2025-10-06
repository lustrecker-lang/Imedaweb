// src/app/(site)/publications/page.tsx
import { Suspense } from 'react';
import { adminDb } from '@/firebase/admin';
import { DocumentData } from 'firebase-admin/firestore';
import { Metadata } from 'next';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import PublicationsView from './PublicationsView';
import { Skeleton } from '@/components/ui/skeleton';

// Interfaces for server-side data fetching
interface Article {
  id: string;
  title: string;
  author: string;
  // Type is now a string to be JSON-serializable
  publicationDate: string;
  summary?: string;
  imageUrl?: string;
  slug?: string;
}

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

// Data fetching function on the server
async function getPublicationsData() {
  try {
    const [articlesSnap, pageSnap] = await Promise.all([
      adminDb.collection('articles').orderBy('publicationDate', 'desc').get(),
      adminDb.collection('pages').doc('publications').get(),
    ]);

    const articles = articlesSnap.docs.map(doc => {
      const data = doc.data() as DocumentData;
      return {
        id: doc.id,
        title: data.title,
        slug: data.slug,
        author: data.author,
        // Format the date here on the server
        publicationDate: data.publicationDate ? format(data.publicationDate.toDate(), 'PPP', { locale: enUS }) : '',
        summary: data.summary,
        content: data.content,
        imageUrl: data.imageUrl,
      };
    }) as Article[];
    const pageData = pageSnap.exists ? pageSnap.data() as Page : null;
    
    return { articles, pageData };
  } catch (error) {
    console.error("Error fetching publications data:", error);
    return { articles: [], pageData: null };
  }
}

// Dynamic Metadata Generation
export const metadata: Metadata = {
  title: 'Publications',
  description: 'Explore our latest articles, research, and insights from our experts.',
};

// Loading Skeleton
const PublicationsPageSkeleton = () => {
    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <div className="h-[250px] w-full animate-pulse rounded-lg bg-muted" />
            <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({length: 6}).map((_, i) => (
                    <div key={i} className="space-y-4">
                        <div className="aspect-video w-full rounded-lg bg-muted" />
                        <div className="h-6 w-3/4 rounded-md bg-muted" />
                        <div className="h-4 w-1/2 rounded-md bg-muted" />
                        <div className="h-12 w-full rounded-md bg-muted" />
                    </div>
                ))}
            </div>
        </div>
    );
};

// Main Page Component (Server Component)
export default async function PublicationsPageWrapper() {
  const { articles, pageData } = await getPublicationsData();

  return (
    <Suspense fallback={<PublicationsPageSkeleton />}>
      <PublicationsView articles={articles} pageData={pageData} />
    </Suspense>
  );
}
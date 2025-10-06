// src/app/(site)/publications/page.tsx
import { Suspense } from 'react';
import { adminDb } from '@/firebase/admin';
import { DocumentData } from 'firebase-admin/firestore';
import { Metadata } from 'next';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import PublicationsView from './PublicationsView';
import { Skeleton } from '@/components/ui/skeleton';

interface Article {
  id: string;
  title: string;
  author: string;
  publicationDate: string;
  summary?: string;
  imageUrl?: string;
  slug?: string;
  topicId?: string;
}

interface Topic {
    id: string;
    name: string;
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

async function getPublicationsData() {
  try {
    const [articlesSnap, pageSnap, topicsSnap] = await Promise.all([
      adminDb.collection('articles').orderBy('publicationDate', 'desc').get(),
      adminDb.collection('pages').doc('publications').get(),
      adminDb.collection('article_topics').orderBy('name', 'asc').get(),
    ]);

    const articles = articlesSnap.docs.map(doc => {
      const data = doc.data() as DocumentData;
      return {
        id: doc.id,
        title: data.title,
        slug: data.slug,
        author: data.author,
        publicationDate: data.publicationDate ? format(data.publicationDate.toDate(), 'PPP', { locale: enUS }) : '',
        summary: data.summary,
        imageUrl: data.imageUrl,
        topicId: data.topicId,
      };
    }) as Article[];
    
    const pageData = pageSnap.exists ? pageSnap.data() as Page : null;
    const topics = topicsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Topic[];
    
    return { articles, pageData, topics };
  } catch (error) {
    console.error("Error fetching publications data:", error);
    return { articles: [], pageData: null, topics: [] };
  }
}

export const metadata: Metadata = {
  title: 'Publications',
  description: 'Explore our latest articles, research, and insights from our experts.',
};

const PublicationsPageSkeleton = () => {
    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <Skeleton className="mb-8 h-[250px] w-full" />
            <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({length: 6}).map((_, i) => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="aspect-video w-full" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default async function PublicationsPageWrapper() {
  const { articles, pageData, topics } = await getPublicationsData();

  return (
    <Suspense fallback={<PublicationsPageSkeleton />}>
      <PublicationsView articles={articles} pageData={pageData} topics={topics} />
    </Suspense>
  );
}

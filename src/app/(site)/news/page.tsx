// src/app/(site)/news/page.tsx
import { Suspense } from 'react';
import { adminDb } from '@/firebase/admin';
import { DocumentData } from 'firebase-admin/firestore';
import { Metadata } from 'next';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import NewsListView from './NewsListView';
import { Skeleton } from '@/components/ui/skeleton';

interface NewsStory {
  id: string;
  title: string;
  slug: string;
  publicationDate: string;
  summary?: string;
  mediaUrl?: string;
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

async function getNewsData() {
  try {
    const [newsSnap, pageSnap] = await Promise.all([
        adminDb.collection('news').orderBy('publicationDate', 'desc').get(),
        adminDb.collection('pages').doc('news').get()
    ]);
    
    const newsStories = newsSnap.docs.map(doc => {
      const data = doc.data() as DocumentData;
      return {
        id: doc.id,
        title: data.title,
        slug: data.slug,
        publicationDate: data.publicationDate ? format(data.publicationDate.toDate(), 'PPP', { locale: enUS }) : '',
        summary: data.summary,
        mediaUrl: data.mediaUrl,
      } as NewsStory;
    });

    const pageData = pageSnap.exists ? pageSnap.data() as Page : null;

    return { newsStories, pageData };
  } catch (error) {
    console.error("Error fetching news data:", error);
    return { newsStories: [], pageData: null };
  }
}

export const metadata: Metadata = {
  title: 'Company News',
  description: 'The latest news and updates from our company.',
};

const NewsPageSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <header className="mb-12 text-left">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-5 w-1/2 mt-4" />
      </header>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[9/16] w-full" />
        ))}
      </div>
    </div>
  );
};

export default async function NewsPage() {
  const { newsStories, pageData } = await getNewsData();

  return (
    <Suspense fallback={<NewsPageSkeleton />}>
      <NewsListView newsStories={newsStories} pageData={pageData} />
    </Suspense>
  );
}

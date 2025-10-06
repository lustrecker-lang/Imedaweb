// src/app/(site)/news/[slug]/page.tsx
import { Suspense } from 'react';
import { adminDb } from '@/firebase/admin';
import { notFound } from 'next/navigation';
import { DocumentData } from 'firebase-admin/firestore';
import { format } from 'date-fns';
import { Metadata } from 'next';
import NewsStoryView from './NewsStoryView';
import { Skeleton } from '@/components/ui/skeleton';

interface NewsStory {
  id: string;
  title: string;
  slug: string;
  publicationDate: string; // Keep as string for client component
  content: string;
  mediaUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

const NewsStoryPageSkeleton = () => {
    return (
        <div className="container mx-auto max-w-7xl px-4 py-12 md:px-6">
            <div className="mb-8">
                <Skeleton className="h-8 w-32" />
            </div>
            <div className="grid md:grid-cols-12 md:gap-12 lg:gap-16">
                <div className="md:col-span-5 lg:col-span-4 mb-8 md:mb-0">
                    <div className="sticky top-24">
                        <Skeleton className="aspect-[9/16] w-full" />
                    </div>
                </div>
                <div className="md:col-span-7 lg:col-span-8">
                    <header className="mb-8">
                        <Skeleton className="h-10 w-full mb-4" />
                        <Skeleton className="h-8 w-3/4" />
                        <div className="mt-4 flex justify-between">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                    </header>
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                         <Skeleton className="h-4 w-full mt-6" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </div>
            </div>
        </div>
    );
};

async function getNewsStory(slugOrId: string): Promise<NewsStory | null> {
  try {
    const newsRef = adminDb.collection('news');
    const slugQuerySnapshot = await newsRef.where('slug', '==', slugOrId).limit(1).get();

    let docSnap;
    if (!slugQuerySnapshot.empty) {
      docSnap = slugQuerySnapshot.docs[0];
    } else {
      docSnap = await newsRef.doc(slugOrId).get();
    }
    
    if (docSnap && docSnap.exists) {
      const data = docSnap.data() as DocumentData;
      const publicationDate = data.publicationDate?.toDate();
      const formattedDate = publicationDate ? format(publicationDate, 'MMMM d, yyyy') : '';

      return {
        id: docSnap.id,
        title: data.title,
        slug: data.slug,
        publicationDate: formattedDate,
        content: data.content,
        mediaUrl: data.mediaUrl,
        ogTitle: data.ogTitle,
        ogDescription: data.ogDescription,
        ogImage: data.ogImage,
      } as NewsStory;
    }
    
    return null;
  } catch (error) {
    console.error(`[getNewsStory] Error fetching story:`, error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const story = await getNewsStory(params.slug);

  if (story) {
    const title = story.ogTitle || story.title;
    const description = story.ogDescription || story.content.substring(0, 150);
    const imageUrl = story.ogImage || story.mediaUrl;

    return {
      title: `${story.title} | IMEDA News`,
      description: description,
      openGraph: {
        title: title,
        description: description,
        images: imageUrl ? [{ url: imageUrl }] : [],
      },
    };
  } else {
    return {
      title: 'News Story Not Found',
      description: 'The requested news story could not be found.',
    };
  }
}

export default async function NewsStoryPage({ params }: { params: { slug: string } }) {
  const story = await getNewsStory(params.slug);

  if (!story) {
    notFound();
  }

  return (
    <Suspense fallback={<NewsStoryPageSkeleton />}>
        <NewsStoryView story={story} />
    </Suspense>
  );
}

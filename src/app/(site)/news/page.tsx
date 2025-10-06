
import { Suspense } from 'react';
import { adminDb } from '@/firebase/admin';
import { DocumentData } from 'firebase-admin/firestore';
import { Metadata } from 'next';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface NewsStory {
  id: string;
  title: string;
  slug: string;
  publicationDate: string;
  summary?: string;
  mediaUrl?: string;
}

async function getNewsData() {
  try {
    const newsSnap = await adminDb.collection('news').orderBy('publicationDate', 'desc').get();
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
    return { newsStories };
  } catch (error) {
    console.error("Error fetching news data:", error);
    return { newsStories: [] };
  }
}

export const metadata: Metadata = {
  title: 'Company News',
  description: 'The latest news and updates from our company.',
};

const NewsPageSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <header className="mb-12 text-center">
        <Skeleton className="h-10 w-1/3 mx-auto" />
        <Skeleton className="h-5 w-1/2 mx-auto mt-4" />
      </header>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full" />
        ))}
      </div>
    </div>
  );
};

export default async function NewsPage() {
  const { newsStories } = await getNewsData();

  return (
    <Suspense fallback={<NewsPageSkeleton />}>
      <div className="container mx-auto px-4 py-12 md:px-6">
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline text-primary">
            Company News
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            The latest news, announcements, and updates from our team.
          </p>
        </header>

        {newsStories.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {newsStories.map((story) => (
              <Link key={story.id} href={`/news/${story.slug || story.id}`} className="block group">
                <Card className="relative flex flex-col overflow-hidden h-full aspect-[4/5] justify-end text-white">
                    {story.mediaUrl ? (
                      <Image
                        src={story.mediaUrl}
                        alt={story.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                    <div className="relative z-10 p-6">
                      <p className="text-xs text-white/80 mb-2">{story.publicationDate}</p>
                      <h2 className="font-headline font-normal text-lg leading-tight text-white">
                          {story.title}
                      </h2>
                      <div className="mt-4 text-white/90 flex items-center text-sm">
                          Read More <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No news stories have been published yet.</p>
          </div>
        )}
      </div>
    </Suspense>
  );
}

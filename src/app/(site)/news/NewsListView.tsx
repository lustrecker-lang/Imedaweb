'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

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

interface NewsListViewProps {
    newsStories: NewsStory[];
    pageData: Page | null;
}

const isVideoUrl = (url?: string | null) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    try {
      const pathname = new URL(url).pathname.split('?')[0];
      return videoExtensions.some(ext => pathname.toLowerCase().endsWith(ext));
    } catch (e) {
      return false; // Invalid URL
    }
};

export default function NewsListView({ newsStories, pageData }: NewsListViewProps) {
  const heroSection = pageData?.sections.find(s => s.id === 'hero');

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <header className="mb-12 text-left">
        <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline text-primary">
          {heroSection?.title || 'Company News'}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          {heroSection?.content || 'The latest news, announcements, and updates from our team.'}
        </p>
      </header>

      {newsStories.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {newsStories.map((story) => {
            const isVideo = isVideoUrl(story.mediaUrl);
            return (
              <Link key={story.id} href={`/news/${story.slug || story.id}`} className="block group">
                <Card className="relative flex flex-col overflow-hidden h-full aspect-[9/16] justify-end text-white rounded-lg">
                    {story.mediaUrl ? (
                      isVideo ? (
                         <video
                            src={story.mediaUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                         />
                      ) : (
                        <Image
                          src={story.mediaUrl}
                          alt={story.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )
                    ) : (
                      <div className="h-full w-full bg-muted" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                    <div className="relative z-10 p-6">
                      <p className="text-xs text-white/80 mb-2">{story.publicationDate}</p>
                      <h2 className="font-headline font-normal text-lg leading-tight text-white">
                          {story.title}
                      </h2>
                      <div className="mt-4 text-white/90 flex items-center text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          Read More <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </div>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No news stories have been published yet.</p>
        </div>
      )}
    </div>
  );
}

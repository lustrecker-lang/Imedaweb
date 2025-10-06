
import { adminDb } from '@/firebase/admin';
import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { DocumentData } from 'firebase-admin/firestore';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

interface NewsStory {
  id: string;
  title: string;
  slug: string;
  publicationDate: string;
  content: string;
  mediaUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
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
    console.error("[getNewsStory] Error fetching story:", error);
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
  
  const isVideo = isVideoUrl(story.mediaUrl);

  return (
    <article className="container mx-auto max-w-7xl px-4 py-12 md:px-6">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
            <Link href="/news">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to News
            </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-12 md:gap-12 lg:gap-16">
        <div className="md:col-span-5 lg:col-span-4 mb-8 md:mb-0">
           {story.mediaUrl && (
            <div className="sticky top-24">
                <div className="relative aspect-[9/16] w-full overflow-hidden rounded-lg">
                    {isVideo ? (
                        <video
                            src={story.mediaUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    ) : (
                        <Image
                            src={story.mediaUrl}
                            alt={story.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    )}
                </div>
            </div>
          )}
        </div>
        
        <div className="md:col-span-7 lg:col-span-8">
          <header className="mb-8">
            <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline text-primary">
              {story.title}
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              Published on {story.publicationDate}
            </p>
          </header>
          
          <div 
            className="prose prose-stone dark:prose-invert max-w-none prose-p:text-base prose-p:leading-relaxed prose-h2:font-headline prose-h2:font-normal prose-h2:text-2xl prose-h2:text-primary"
            dangerouslySetInnerHTML={{ __html: story.content.replace(/\n/g, '<br />') }} 
          />
        </div>
      </div>
    </article>
  );
}

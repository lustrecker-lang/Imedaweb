
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

  return (
    <article className="container mx-auto max-w-4xl px-4 py-12 md:px-6">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
            <Link href="/news">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to News
            </Link>
        </Button>
      </div>
      
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline text-primary">
          {story.title}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Published on {story.publicationDate}
        </p>
      </header>
      
      {story.mediaUrl && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-12">
          <Image
            src={story.mediaUrl}
            alt={story.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}
      
      <div 
        className="prose prose-stone mx-auto max-w-3xl dark:prose-invert prose-p:text-base prose-p:leading-relaxed prose-h2:font-headline prose-h2:font-normal prose-h2:text-2xl prose-h2:text-primary"
        dangerouslySetInnerHTML={{ __html: story.content.replace(/\n/g, '<br />') }} 
      />
    </article>
  );
}

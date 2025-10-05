
// src/app/(site)/publications/[slug]/page.tsx
import { adminDb } from '@/firebase/admin';
import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { Timestamp } from 'firebase-admin/firestore';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

interface Article {
  id: string; // Added id
  title: string;
  slug: string;
  author: string;
  publicationDate: Timestamp;
  summary?: string;
  content?: string;
  imageUrl?: string;
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const articlesRef = adminDb.collection('articles');
    const querySnapshot = await articlesRef.where('slug', '==', slug).limit(1).get();

    if (querySnapshot.empty) {
      return null;
    }
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Article;
  } catch (error) {
    console.error("Error fetching article by slug:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticle(params.slug);

  if (article) {
    return {
      title: `${article.title} | IMEDA`,
      description: article.summary,
      openGraph: {
        title: article.title,
        description: article.summary || '',
        images: article.imageUrl ? [{ url: article.imageUrl }] : [],
      },
    };
  } else {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.',
    };
  }
}


export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);

  if (!article) {
    notFound();
  }

  return (
    <article className="container mx-auto max-w-4xl px-4 py-12 md:px-6">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
            <Link href="/publications">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Publications
            </Link>
        </Button>
      </div>
      
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline text-primary">
          {article.title}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          By {article.author} • {format(article.publicationDate.toDate(), 'MMMM d, yyyy')}
        </p>
      </header>
      
      {article.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-8">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}
      
      <div className="prose prose-stone mx-auto max-w-3xl dark:prose-invert prose-p:text-base prose-p:leading-relaxed prose-headings:font-headline prose-headings:font-normal">
        {/* We use dangerouslySetInnerHTML here assuming the content is trusted HTML from a rich text editor.
            In a real-world app, this should be sanitized to prevent XSS attacks. */}
        <div dangerouslySetInnerHTML={{ __html: article.content || '' }} />
      </div>

    </article>
  );
}

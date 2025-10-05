
// src/app/(site)/publications/[articleId]/page.tsx
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

interface Article {
  title: string;
  author: string;
  publicationDate: Timestamp;
  summary?: string;
  content?: string;
  imageUrl?: string;
}

export async function generateStaticParams() {
  const articlesSnap = await adminDb.collection('articles').get();
  return articlesSnap.docs.map((doc) => ({
    articleId: doc.id,
  }));
}

export async function generateMetadata({ params }: { params: { articleId: string } }): Promise<Metadata> {
  const articleId = params.articleId;
  const articleRef = adminDb.collection('articles').doc(articleId);
  const docSnap = await articleRef.get();

  if (docSnap.exists) {
    const articleData = docSnap.data() as Article;
    return {
      title: `${articleData.title} | IMEDA`,
      description: articleData.summary,
      openGraph: {
        title: articleData.title,
        description: articleData.summary || '',
        images: articleData.imageUrl ? [{ url: articleData.imageUrl }] : [],
      },
    };
  } else {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.',
    };
  }
}

async function getArticle(id: string) {
  try {
    const articleRef = adminDb.collection('articles').doc(id);
    const docSnap = await articleRef.get();
    if (docSnap.exists) {
      return docSnap.data() as Article;
    }
    return null;
  } catch (error) {
    console.error("Error fetching article:", error);
    return null;
  }
}

export default async function ArticlePage({ params }: { params: { articleId: string } }) {
  const article = await getArticle(params.articleId);

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

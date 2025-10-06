// src/app/(site)/publications/[slug]/page.tsx
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

interface Section {
  id: string;
  title?: string;
  paragraph?: string;
  imageUrl?: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  author: string;
  publicationDate: string;
  summary?: string;
  sections?: Section[];
  imageUrl?: string;
  topicId?: string;
}

interface Topic {
  id: string;
  name: string;
}

async function getArticle(slugOrId: string): Promise<Article | null> {
  try {
    const articlesRef = adminDb.collection('articles');
    const slugQuerySnapshot = await articlesRef.where('slug', '==', slugOrId).limit(1).get();

    let docSnap;
    if (!slugQuerySnapshot.empty) {
      docSnap = slugQuerySnapshot.docs[0];
    } else {
      docSnap = await articlesRef.doc(slugOrId).get();
    }
    
    if (docSnap && docSnap.exists) {
        const data = docSnap.data() as DocumentData;
        const publicationDate = data.publicationDate?.toDate();
        const formattedDate = publicationDate ? format(publicationDate, 'MMMM d, yyyy') : '';

        let topic = null;
        if(data.topicId) {
            const topicSnap = await adminDb.collection('article_topics').doc(data.topicId).get();
            if(topicSnap.exists) {
                topic = { id: topicSnap.id, ...topicSnap.data() } as Topic;
            }
        }

        return {
            id: docSnap.id,
            title: data.title,
            slug: data.slug,
            author: data.author,
            publicationDate: formattedDate,
            summary: data.summary,
            sections: data.sections,
            imageUrl: data.imageUrl,
            topicId: data.topicId,
            topic: topic,
        } as Article;
    }
    
    return null;
  } catch (error) {
    console.error("[getArticle] Error fetching article:", error);
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
        <div className="mt-4 text-sm text-muted-foreground flex items-center justify-center gap-4">
          <span>By {article.author}</span>
          <span>&bull;</span>
          <span>{article.publicationDate}</span>
          {article.topic && (
            <>
                <span>&bull;</span>
                <Link href={`/publications?topic=${article.topic.id}`} className="hover:text-primary">{article.topic.name}</Link>
            </>
          )}
        </div>
      </header>
      
      {article.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-12">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}
      
      <div className="prose prose-stone mx-auto max-w-3xl dark:prose-invert prose-p:text-base prose-p:leading-relaxed prose-h2:font-headline prose-h2:font-normal prose-h2:text-2xl prose-h2:text-primary">
        {article.sections && article.sections.map(section => (
            <section key={section.id} className="mb-8">
                {section.title && <h2>{section.title}</h2>}
                {section.imageUrl && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg my-6">
                        <Image src={section.imageUrl} alt={section.title || article.title} fill className="object-cover" />
                    </div>
                )}
                {section.paragraph && <div dangerouslySetInnerHTML={{ __html: section.paragraph.replace(/\n/g, '<br />') }} />}
            </section>
        ))}
      </div>

    </article>
  );
}

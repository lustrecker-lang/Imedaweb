// src/app/(site)/publications/[slug]/page.tsx
import { adminDb } from '@/firebase/admin';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocumentData } from 'firebase-admin/firestore';
import { format } from 'date-fns';
import PublicationDetailView from './PublicationDetailView';

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

async function getArticle(slugOrId: string): Promise<(Article & { topic: Topic | null }) | null> {
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

        let topic: Topic | null = null;
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
        } as (Article & { topic: Topic | null });
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
    <PublicationDetailView article={article} />
  );
}

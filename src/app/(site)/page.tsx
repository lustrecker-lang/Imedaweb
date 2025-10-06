
// src/app/(site)/page.tsx
import { adminDb } from '@/firebase/admin';
import { HomeClient } from './home-client';
import { Metadata } from 'next';
import { DocumentData } from 'firebase-admin/firestore';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

// Interfaces
interface Section { id: string; title: string; content: string; imageUrl?: string; }
interface Page { id: string; title: string; sections: Section[]; ogTitle?: string; ogDescription?: string; ogImage?: string; }
interface Campus { id: string; name: string; slug: string; description?: string; imageUrl?: string; }
interface Category { id: string; name: string; description?: string; mediaUrl?: string; }
interface Theme { id: string; name: string; description?: string; categoryId: string; }
interface Formation { id: string; themeId: string; }
interface Reference { id: string; name: string; logoUrl: string; }
interface Article {
  id: string;
  title: string;
  author: string;
  publicationDate: string;
  summary?: string;
  imageUrl?: string;
  slug?: string;
  topicId?: string;
  topic?: { id: string; name: string };
}
interface Topic {
    id: string;
    name: string;
}

// Dynamic Metadata Generation for Home Page
export async function generateMetadata(): Promise<Metadata> {
  const pageSnap = await adminDb.collection('pages').doc('home').get();
  const pageContent = pageSnap.exists ? pageSnap.data() as DocumentData : null;

  const ogTitle = pageContent?.ogTitle || 'IMEDA';
  const ogDescription = pageContent?.ogDescription || 'A clean and professional web application.';
  const ogImage = pageContent?.ogImage || null;
  const canonicalUrl = 'https://imeda.com/'; // Replace with your actual domain

  return {
    title: pageContent?.title || 'IMEDA',
    description: pageContent?.description || 'A clean and professional web application.',
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      type: 'website',
      images: ogImage ? [{ url: ogImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImage || ''],
    },
  };
}

async function getHomePageData() {
  try {
    const [
        pageSnap, 
        categoriesSnap, 
        themesSnap, 
        formationsSnap, 
        articlesSnap,
        topicsSnap,
        campusesSnap,
        referencesSnap
    ] = await Promise.all([
      adminDb.collection('pages').doc('home').get(),
      adminDb.collection('course_categories').orderBy('name', 'asc').get(),
      adminDb.collection('course_themes').orderBy('name', 'asc').get(),
      adminDb.collection('course_formations').get(),
      adminDb.collection('articles').orderBy('publicationDate', 'desc').limit(6).get(),
      adminDb.collection('article_topics').get(),
      adminDb.collection('campuses').orderBy('name', 'asc').get(),
      adminDb.collection('references').orderBy('name', 'asc').get(),
    ]);

    const homePage = pageSnap.exists ? { id: pageSnap.id, ...pageSnap.data() } as Page : null;
    const categories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
    const themes = themesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Theme[];
    const formations = formationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Formation[];
    const campuses = campusesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Campus[];
    const references = referencesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reference[];
    
    const topics = topicsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Topic[];
    const topicsMap = new Map(topics.map(t => [t.id, t]));

    const articles = articlesSnap.docs.map(doc => {
      const data = doc.data();
      const topic = data.topicId ? topicsMap.get(data.topicId) : null;
      return {
        id: doc.id,
        ...data,
        publicationDate: data.publicationDate ? format(data.publicationDate.toDate(), 'PPP', { locale: enUS }) : '',
        topic: topic ? { id: topic.id, name: topic.name } : null,
      } as Article;
    });


    return { homePage, campuses, categories, themes, formations, articles, references };
  } catch (error) {
    console.error("Failed to fetch homepage data:", error);
    return { homePage: null, campuses: [], categories: [], themes: [], formations: [], articles: [], references: [] };
  }
}

// Loading Skeleton for the home page
const HomePageSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <Skeleton className="h-[400px] w-full mb-12" />
      <div className="space-y-12">
        <Skeleton className="h-6 w-1/2 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
};

export default async function Home() {
  const data = await getHomePageData();
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomeClient {...data} />
    </Suspense>
  );
}

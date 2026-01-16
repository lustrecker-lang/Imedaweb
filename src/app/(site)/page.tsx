
// src/app/(site)/page.tsx
import { adminDb } from '@/firebase/admin';
import { HomeClient } from './home-client';
import { Metadata } from 'next';
import { DocumentData } from 'firebase-admin/firestore';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

// Force dynamic rendering to ensure fresh data from Firestore on each request
export const dynamic = 'force-dynamic';

// --- (Centralized Interfaces - This should ideally be in a separate file like `src/types.ts`) ---
export interface Section { id: string; title: string; content: string; imageUrl?: string; }
export interface Page { id: string; title: string; sections: Section[]; ogTitle?: string; ogDescription?: string; ogImage?: string; }
interface Campus { id: string; name: string; slug: string; description?: string; imageUrl?: string; }
interface Category { id: string; name: string; description?: string; mediaUrl?: string; }
interface Theme { id: string; name: string; description?: string; categoryId: string; }
interface Formation { id: string; themeId: string; name: string; formationId: string; }
export interface Reference { id: string; name: string; logoUrl: string; }
interface Kpi { id: string; number: number; title: string; description: string; order: number; }
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
interface NewsStory {
  id: string;
  title: string;
  slug: string;
  publicationDate: string;
  mediaUrl?: string;
}
interface CompanyProfile {
  name?: string;
  logoUrl?: string;
  logoLightUrl?: string;
  iconUrl?: string;
  websiteDescription?: string;
  faviconUrl?: string;
}
// ------------------------------------------------------------------------------------------

// Dynamic Metadata Generation
export async function generateMetadata(): Promise<Metadata> {
  const [pageSnap, companyProfileSnap] = await Promise.all([
    adminDb.collection('pages').doc('home').get(),
    adminDb.collection('companyProfile').doc('main').get(),
  ]);

  const pageContent = pageSnap.exists ? pageSnap.data() as Page : null;
  const companyProfile = companyProfileSnap.exists ? companyProfileSnap.data() as CompanyProfile : null;

  const siteName = companyProfile?.name || 'IMEDA';
  const pageTitle = pageContent?.title || 'Institut de Management Économie et de Développement Appliqué.';
  const ogTitle = pageContent?.ogTitle || pageTitle;
  const ogDescription = pageContent?.ogDescription || companyProfile?.websiteDescription || 'IMEDA propose plus de 700 formations professionnelles dans 23 thématiques pour renforcer le leadership, les compétences et la performance des dirigeants africains et de leurs équipes à linternational.';
  const ogImage = pageContent?.ogImage || companyProfile?.logoUrl || null;
  const canonicalUrl = 'https://imeda.com/';
  const faviconUrl = companyProfile?.faviconUrl || '/favicon.ico';


  return {
    title: pageTitle,
    description: ogDescription,
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
    icons: {
      icon: faviconUrl,
    },
    alternates: {
      canonical: '/',
    },
  };
}

// Separate data fetching functions for each section
export async function getHeroData() {
  const pageSnap = await adminDb.collection('pages').doc('home').get();
  return pageSnap.exists ? { id: pageSnap.id, ...pageSnap.data() } as Page : null;
}

export async function getReferencesData() {
  const referencesSnap = await adminDb.collection('references').orderBy('name', 'asc').get();
  return referencesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reference[];
}

export async function getFeaturesData() {
  const pageSnap = await adminDb.collection('pages').doc('home').get();
  return pageSnap.exists ? { id: pageSnap.id, ...pageSnap.data() } as Page : null;
}

export async function getCatalogData() {
  const pageSnap = await adminDb.collection('pages').doc('home').get();
  return pageSnap.exists ? { id: pageSnap.id, ...pageSnap.data() } as Page : null;
}

async function getCourseData() {
  const [categoriesSnap, themesSnap, formationsSnap] = await Promise.all([
    adminDb.collection('course_categories').orderBy('name', 'asc').get(),
    adminDb.collection('course_themes').orderBy('name', 'asc').get(),
    adminDb.collection('course_formations').get(),
  ]);
  const categories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
  const themes = themesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Theme[];
  const formations = formationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Formation[];
  return { categories, themes, formations };
}

async function getCampusesData() {
  const campusesSnap = await adminDb.collection('campuses').orderBy('name', 'asc').get();
  return campusesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Campus[];
}

async function getArticlesData() {
  const [articlesSnap, topicsSnap] = await Promise.all([
    adminDb.collection('articles').orderBy('publicationDate', 'desc').limit(6).get(),
    adminDb.collection('article_topics').get(),
  ]);
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
  return articles;
}

async function getNewsData() {
  const newsSnap = await adminDb.collection('news').orderBy('publicationDate', 'desc').limit(6).get();
  const newsStories = newsSnap.docs.map(doc => {
    const data = doc.data() as DocumentData;
    return {
      id: doc.id,
      title: data.title,
      slug: data.slug,
      publicationDate: data.publicationDate ? format(data.publicationDate.toDate(), 'PPP', { locale: enUS }) : '',
      mediaUrl: data.mediaUrl,
    } as NewsStory;
  });
  return newsStories;
}

async function getCompanyProfile() {
  const snap = await adminDb.collection('companyProfile').doc('main').get();
  return snap.exists ? snap.data() as CompanyProfile : null;
}

async function getKpis() {
  const snap = await adminDb.collection('kpis').orderBy('order', 'asc').get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Kpi[];
}

// Main component that fetches data and passes it to the client component
export default async function Home() {
  const [
    heroData,
    referencesData,
    featuresData,
    catalogData,
    coursesData,
    campusesData,
    articlesData,
    newsData,
    companyProfile,
    kpis,
  ] = await Promise.all([
    getHeroData(),
    getReferencesData(),
    getFeaturesData(),
    getCatalogData(),
    getCourseData(),
    getCampusesData(),
    getArticlesData(),
    getNewsData(),
    getCompanyProfile(),
    getKpis(),
  ]);

  const data = {
    heroData,
    referencesData,
    featuresData,
    catalogData,
    coursesData,
    campusesData,
    articlesData,
    newsData,
    companyProfile,
    kpis,
  };

  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomeClient {...data} />
    </Suspense>
  );
}

// Loading Skeleton for the home page
const HomePageSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <Skeleton className="h-[50vh] min-h-[400px] w-full mb-12" />
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

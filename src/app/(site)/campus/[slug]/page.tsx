

import { Suspense } from 'react';
import { adminDb } from '@/firebase/admin';
import { notFound } from 'next/navigation';
import { DocumentData } from 'firebase-admin/firestore';
import { Skeleton } from "@/components/ui/skeleton";
import CampusDetailView from './CampusDetailView';
import { Metadata } from 'next';

interface Campus {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  hero?: {
    backgroundMediaUrl?: string;
    title?: string;
    subtitle?: string;
  };
  campusDescription?: {
    headline?: string;
    body?: string;
  };
  academicOffering?: {
    headline?: string;
    subtitle?: string;
    courses?: any[]; // Simplified for server
  };
  campusExperience?: {
    headline?: string;
    features?: any[]; // Simplified for server
  };
  visitAndContact?: {
    headline?: string;
    subtitle?: string;
    address?: string;
    name?: string;
    title?: string;
    description?: string;
    phone?: string;
    email?: string;
    imageUrl?: string;
  };
  faq?: {
    headline?: string;
    faqs?: any[]; // Simplified for server
  };
}

interface Category {
    id: string;
    name: string;
    mediaUrl?: string;
}

interface Theme {
    id: string;
    name: string;
    categoryId: string;
}

async function getCampusDetails(slug: string) {
  try {
    const campusQuery = adminDb.collection('campuses').where('slug', '==', slug).limit(1);
    const campusQuerySnapshot = await campusQuery.get();

    if (campusQuerySnapshot.empty) {
      return { campus: null, categories: [], themes: [] };
    }

    const campusDoc = campusQuerySnapshot.docs[0];
    const campusData = { id: campusDoc.id, ...campusDoc.data() } as Campus;

    const [categoriesSnap, themesSnap] = await Promise.all([
      adminDb.collection('course_categories').orderBy('name', 'asc').get(),
      adminDb.collection('course_themes').orderBy('name', 'asc').get()
    ]);

    const categories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
    const themes = themesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Theme[];

    return {
      campus: campusData,
      categories,
      themes,
    };

  } catch (error) {
    console.error("Error fetching campus details:", error);
    return { campus: null, categories: [], themes: [] };
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { campus } = await getCampusDetails(params.slug);
  
  if (!campus) {
    return {
      title: 'Campus Not Found',
    };
  }

  const title = campus.ogTitle || `${campus.name} Campus`;
  const description = campus.ogDescription || campus.description || `Explore the ${campus.name} campus, its programs, and campus life.`;
  const imageUrl = campus.ogImage || campus.hero?.backgroundMediaUrl;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
  };
}

const CampusPageSkeleton = () => {
    return (
        <div className="container py-8 space-y-12">
            <Skeleton className="h-[40vh] w-full" />
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
                <div className="space-y-8">
                     <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </div>
    )
  }

export default async function CampusPage({ params }: { params: { slug: string } }) {
  const { campus, categories, themes } = await getCampusDetails(params.slug);
  
  if (!campus) {
    notFound();
  }

  return (
    <Suspense fallback={<CampusPageSkeleton />}>
      <CampusDetailView campus={campus} categories={categories} themes={themes} />
    </Suspense>
  );
}

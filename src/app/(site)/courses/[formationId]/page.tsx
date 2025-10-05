import { Suspense } from 'react';
import { adminDb } from '@/firebase/admin';
import { notFound } from 'next/navigation';
import { DocumentData } from 'firebase-admin/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import CourseDetailView from './CourseDetailView';
import { Metadata } from 'next';

// Interfaces for server-side data fetching
interface Formation {
    id: string;
    name: string;
    formationId: string;
    themeId: string;
    objectifPedagogique?: string;
    preRequis?: string;
    publicConcerne?: string;
    methodesMobilisees?: string;
    moyensPedagogiques?: string;
    modalitesEvaluation?: string;
    prixAvecHebergement?: string;
    prixSansHebergement?: string;
    format?: string;
}

interface Theme {
    id: string;
    name: string;
    categoryId: string;
}

interface CourseCategory {
  id: string;
  name: string;
  description?: string;
  mediaUrl?: string;
}

interface Module {
    id: string;
    name: string;
    description?: string;
}

interface Campus {
    id: string;
    name: string;
    imageUrl?: string;
    slug: string;
}

interface Service {
    id: string;
    name: string;
    isOptional: boolean;
    mediaUrl?: string;
}

interface CourseDetailPageContent {
  valeurImeda: { title: string; content: string; imageUrl: string };
  faq: { id: string; question: string; answer: string }[];
  contact: { name: string; title: string; description: string; francePhone: string; uaePhone: string; email: string; imageUrl: string };
}


// Dynamic Metadata Generation for SEO using firebase-admin
// This is a server function that runs once for each request.
export async function generateMetadata({ params }: { params: { formationId: string } }): Promise<Metadata> {
  const formationId = params.formationId;

  try {
    const formationRef = adminDb.collection('course_formations').doc(formationId);
    const docSnap = await formationRef.get();

    if (docSnap.exists) {
      const formationData = docSnap.data() as Formation;
      const title = formationData.name;
      const description = formationData.objectifPedagogique || 'Détails d’une formation professionnelle.';

      const themeRef = adminDb.collection('course_themes').doc(formationData.themeId);
      const themeSnap = await themeRef.get();

      let categoryOgImage = null;
      if (themeSnap.exists) {
        const themeData = themeSnap.data() as Theme;
        const categoryRef = adminDb.collection('course_categories').doc(themeData.categoryId);
        const categorySnap = await categoryRef.get();

        if (categorySnap.exists) {
          categoryOgImage = (categorySnap.data() as CourseCategory).mediaUrl;
        }
      }

      const ogImage = categoryOgImage || null;
      const openGraphImages = ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: title }] : [];

      return {
        title: title,
        description: description,
        openGraph: {
          title: title,
          description: description,
          images: openGraphImages,
        },
      };
    } else {
      return {
        title: 'Formation introuvable',
        description: 'La formation demandée n’a pas pu être trouvée.',
      };
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des métadonnées pour la formation:", error);
    return {
      title: 'Détails de la formation',
      description: 'Découvrez les détails de nos formations professionnelles.',
    };
  }
}

// Data fetching function on the server
async function getCourseDetails(formationId: string) {
    try {
        const formationRef = adminDb.collection('course_formations').doc(formationId);
        const formationSnap = await formationRef.get();

        if (!formationSnap.exists) {
            return { formation: null, theme: null, modules: [], campuses: [], allServices: [], coursePageContent: null };
        }

        const formationData = { id: formationSnap.id, ...formationSnap.data() } as Formation;

        const [themeSnap, modulesSnap, campusesSnap, servicesSnap, coursePageContentSnap] = await Promise.all([
            formationData.themeId ? adminDb.collection('course_themes').doc(formationData.themeId).get() : Promise.resolve(null),
            adminDb.collection('course_modules').where('formationId', '==', formationId).get(),
            adminDb.collection('campuses').orderBy('name', 'asc').get(),
            adminDb.collection('services').get(),
            adminDb.collection('courseDetailPage').doc('main').get()
        ]);

        const theme = themeSnap?.exists ? { id: themeSnap.id, ...themeSnap.data() } as Theme : null;
        const modules = modulesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Module[];
        const campuses = campusesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Campus[];
        const coursePageContent = coursePageContentSnap.exists ? coursePageContentSnap.data() as CourseDetailPageContent : null;
        
        const allServices = servicesSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }) as Service)
            .sort((a, b) => a.name.localeCompare(b.name));
        
        return {
            formation: formationData,
            theme,
            modules,
            campuses,
            allServices,
            coursePageContent,
        };

    } catch (error) {
        console.error("Error fetching course details:", error);
        return { formation: null, theme: null, modules: [], campuses: [], allServices: [], coursePageContent: null };
    }
}

const CourseDetailPageSkeleton = () => {
    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <header className="mb-12">
                <Skeleton className="h-6 w-1/3 mb-4" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/2 mt-4" />
            </header>
            <div className="grid lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-10">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
                <aside className="space-y-6">
                    <Skeleton className="h-64 w-full" />
                </aside>
            </div>
        </div>
    );
}

export default async function FormationDetailPage({ params }: { params: { formationId: string } }) {
  const courseData = await getCourseDetails(params.formationId);
  
  if (!courseData.formation) {
    notFound();
  }

  return (
    <Suspense fallback={<CourseDetailPageSkeleton />}>
      <CourseDetailView {...courseData} />
    </Suspense>
  );
}
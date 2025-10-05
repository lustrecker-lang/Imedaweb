import { Suspense } from 'react';
import { adminDb } from '@/firebase/admin';
import { DocumentData } from 'firebase-admin/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import CourseDetailView from './CourseDetailView';

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
}

// Data fetching function on the server
async function getCourseDetails(formationId: string) {
    try {
        const formationRef = adminDb.collection('course_formations').doc(formationId);
        const formationSnap = await formationRef.get();

        if (!formationSnap.exists) {
            return { formation: null, theme: null, modules: [], campuses: [], includedServices: [] };
        }

        const formationData = { id: formationSnap.id, ...formationSnap.data() } as Formation;

        // Fetch related data in parallel
        const [themeSnap, modulesSnap, campusesSnap, servicesSnap] = await Promise.all([
            formationData.themeId ? adminDb.collection('course_themes').doc(formationData.themeId).get() : Promise.resolve(null),
            adminDb.collection('course_modules').where('formationId', '==', formationId).get(),
            adminDb.collection('campuses').orderBy('name', 'asc').get(),
            adminDb.collection('services').where('isOptional', '==', false).orderBy('name', 'asc').get()
        ]);

        const theme = themeSnap?.exists ? { id: themeSnap.id, ...themeSnap.data() } as Theme : null;
        const modules = modulesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Module[];
        const campuses = campusesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Campus[];
        const includedServices = servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[];
        
        return {
            formation: formationData,
            theme,
            modules,
            campuses,
            includedServices,
        };

    } catch (error) {
        console.error("Error fetching course details:", error);
        return { formation: null, theme: null, modules: [], campuses: [], includedServices: [] };
    }
}

// Loading Skeleton
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

// The Page component is now a Server Component
export default async function FormationDetailPage({ params }: { params: { formationId: string } }) {
  const courseData = await getCourseDetails(params.formationId);
  
  return (
    <Suspense fallback={<CourseDetailPageSkeleton />}>
      <CourseDetailView {...courseData} />
    </Suspense>
  );
}

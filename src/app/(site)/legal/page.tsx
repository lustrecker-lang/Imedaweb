import { Suspense } from 'react';
import { LegalContent } from '@/components/legal-content';
import { adminDb } from '@/firebase/admin';

interface Section {
  id: string;
  title: string;
  content: string;
}

interface Page {
  id: string;
  title: string;
  sections: Section[];
}

async function getLegalPageData() {
  try {
    const pageSnap = await adminDb.collection('pages').doc('legal').get();
    if (pageSnap.exists) {
      return pageSnap.data() as Page;
    }
  } catch (error) {
    console.error("Error fetching legal page data:", error);
  }
  return null;
}

export default async function LegalPage() {
  const legalPage = await getLegalPageData();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 md:px-6">
      <header className="mb-12 text-left">
        <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline">Mentions Légales</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Informations importantes concernant l'utilisation de nos services.
        </p>
      </header>

      <Suspense fallback={<div>Loading...</div>}>
        <LegalContent initialData={legalPage} />
      </Suspense>
    </div>
  );
}
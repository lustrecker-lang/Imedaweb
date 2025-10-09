// src/app/(site)/layout.tsx
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { adminDb } from "@/firebase/admin";
import { DocumentData } from 'firebase-admin/firestore';
import { cache } from 'react';

interface CompanyProfile {
  name?: string;
  logoUrl?: string;
  logoLightUrl?: string;
}

interface Campus {
  id: string;
  name: string;
  slug: string;
}

// Memoized data fetching for the site layout
const getLayoutData = cache(async () => {
    try {
        const [companyProfileSnap, campusesSnap] = await Promise.all([
            adminDb.collection('companyProfile').doc('main').get(),
            adminDb.collection('campuses').orderBy('name', 'asc').get()
        ]);

        const companyProfile = companyProfileSnap.exists ? companyProfileSnap.data() as CompanyProfile : null;
        const campuses = campusesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Campus[];
        
        return { companyProfile, campuses };
    } catch (error) {
        console.error("Error fetching site layout data:", error);
        return { companyProfile: null, campuses: [] };
    }
});

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { companyProfile, campuses } = await getLayoutData();

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header companyProfile={companyProfile} campuses={campuses} />
      <main className="flex-1">{children}</main>
      <Footer companyProfile={companyProfile} campuses={campuses} />
    </div>
  );
}
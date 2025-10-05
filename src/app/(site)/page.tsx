// src/app/(site)/page.tsx
import { adminDb } from '@/firebase/admin';
import { HomeClient } from './home-client';

// Interfaces
interface Section { id: string; title: string; content: string; imageUrl?: string; }
interface Page { id: string; title: string; sections: Section[]; }
interface Campus { id: string; name: string; slug: string; description?: string; imageUrl?: string; }
interface Category { id: string; name: string; description?: string; }
interface Theme { id: string; name: string; description?: string; categoryId: string; }
interface Formation { id: string; themeId: string; }

async function getHomePageData() {
  try {
    const [pageSnap, campusesSnap, categoriesSnap, themesSnap, formationsSnap] = await Promise.all([
      adminDb.collection('pages').doc('home').get(),
      adminDb.collection('campuses').orderBy('name', 'asc').get(),
      adminDb.collection('course_categories').orderBy('name', 'asc').get(),
      adminDb.collection('course_themes').orderBy('name', 'asc').get(),
      adminDb.collection('course_formations').get(),
    ]);

    const homePage = pageSnap.exists ? { id: pageSnap.id, ...pageSnap.data() } as Page : null;
    const campuses = campusesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Campus[];
    const categories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
    const themes = themesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Theme[];
    const formations = formationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Formation[];

    return { homePage, campuses, categories, themes, formations };
  } catch (error) {
    console.error("Failed to fetch homepage data:", error);
    return { homePage: null, campuses: [], categories: [], themes: [], formations: [] };
  }
}

export default async function Home() {
  const data = await getHomePageData();
  return <HomeClient {...data} />;
}

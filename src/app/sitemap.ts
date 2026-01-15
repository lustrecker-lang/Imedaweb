import { MetadataRoute } from 'next';
import { adminDb } from '@/firebase/admin';

const BASE_URL = 'https://imeda.fr';

interface DynamicItem {
    id: string;
    slug?: string;
}

async function getCollectionSlugs(collectionName: string): Promise<string[]> {
    try {
        const snapshot = await adminDb.collection(collectionName).get();
        if (snapshot.empty) return [];
        return snapshot.docs.map(doc => {
            const data = doc.data() as DynamicItem;
            return data.slug || doc.id;
        });
    } catch (error) {
        console.error(`Error fetching ${collectionName} for sitemap:`, error);
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static pages
    const staticPages = [
        '',
        '/presentation',
        '/notre-approche',
        '/services',
        '/partenariats',
        '/references',
        '/careers',
        '/courses',
        '/publications',
        '/news',
        '/contact',
        '/catalog',
        '/legal',
    ];

    const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
        url: `${BASE_URL}${path}`,
        lastModified: new Date(),
        changeFrequency: path === '' ? 'daily' : 'weekly',
        priority: path === '' ? 1 : 0.8,
    }));

    // Dynamic pages
    const [campusSlugs, formationIds, publicationSlugs, newsSlugs] = await Promise.all([
        getCollectionSlugs('campuses'),
        getCollectionSlugs('course_formations'),
        getCollectionSlugs('articles'),
        getCollectionSlugs('news'),
    ]);

    const campusEntries: MetadataRoute.Sitemap = campusSlugs.map((slug) => ({
        url: `${BASE_URL}/campus/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
    }));

    const formationEntries: MetadataRoute.Sitemap = formationIds.map((id) => ({
        url: `${BASE_URL}/courses/${id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
    }));

    const publicationEntries: MetadataRoute.Sitemap = publicationSlugs.map((slug) => ({
        url: `${BASE_URL}/publications/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
    }));

    const newsEntries: MetadataRoute.Sitemap = newsSlugs.map((slug) => ({
        url: `${BASE_URL}/news/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
    }));

    return [
        ...staticEntries,
        ...campusEntries,
        ...formationEntries,
        ...publicationEntries,
        ...newsEntries,
    ];
}

// src/app/(site)/sitemap/page.tsx
import { adminDb } from '@/firebase/admin';
import Link from 'next/link';
import { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// Force dynamic rendering to ensure fresh data from Firestore on each request
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Sitemap',
    description: 'A complete overview of all pages available on the site.',
    robots: {
        index: false, // Generally, sitemaps aren't meant to be indexed themselves
        follow: true,
    },
};

interface DynamicItem {
    id: string;
    title?: string;
    name?: string;
    slug?: string;
}

const mainPages = [
    { href: '/', title: 'Accueil' },
    { href: '/presentation', title: 'Présentation' },
    { href: '/notre-approche', title: 'Notre Approche' },
    { href: '/services', title: 'Services' },
    { href: '/partenariats', title: "Partenariats d'entreprise" },
    { href: '/references', title: 'Références' },
    { href: '/careers', title: 'Carrières' },
    { href: '/courses', title: 'Toutes les Formations' },
    { href: '/publications', title: 'Toutes les Publications' },
    { href: '/news', title: 'Toutes les Actualités' },
    { href: '/contact', title: 'Contact' },
    { href: '/legal', title: 'Mentions Légales' },
    { href: '/catalog', title: 'Catalogue' },
];

async function getCollectionItems(collectionName: string): Promise<DynamicItem[]> {
    try {
        const snapshot = await adminDb.collection(collectionName).get();
        if (snapshot.empty) return [];
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DynamicItem));
    } catch (error) {
        console.error(`Error fetching collection ${collectionName}:`, error);
        return [];
    }
}

function SitemapSection({ title, links }: { title: string; links: { href: string; title: string }[] }) {
    if (links.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline font-normal text-2xl text-primary">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 list-disc list-inside">
                    {links.map(link => (
                        <li key={link.href}>
                            <Link href={link.href} className="text-muted-foreground hover:text-primary hover:underline">
                                {link.title}
                            </Link>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

function SitemapGroupedSection({ title, groups }: { title: string; groups: { groupTitle: string; links: { href: string; title: string }[] }[] }) {
    if (groups.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline font-normal text-2xl text-primary">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {groups.map(group => (
                    group.links.length > 0 && (
                        <div key={group.groupTitle}>
                            <h3 className="font-semibold mb-3">{group.groupTitle}</h3>
                            <ul className="space-y-2 list-disc list-inside ml-4">
                                {group.links.map(link => (
                                    <li key={link.href}>
                                        <Link href={link.href} className="text-muted-foreground hover:text-primary hover:underline">
                                            {link.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                ))}
            </CardContent>
        </Card>
    );
}


export default async function SitemapPage() {
    const [campuses, themes, formations, publications, news] = await Promise.all([
        getCollectionItems('campuses'),
        getCollectionItems('course_themes'),
        getCollectionItems('course_formations'),
        getCollectionItems('articles'),
        getCollectionItems('news'),
    ]);

    const campusLinks = campuses.map(item => ({ href: `/campus/${item.slug || item.id}`, title: item.name || item.id }));

    const formationGroups = themes.map(theme => {
        const themeFormations = formations
            .filter((f: any) => f.themeId === theme.id)
            .map(f => ({ href: `/courses/${f.id}`, title: f.name || `Formation ${f.id}` }));
        return { groupTitle: theme.name || theme.id, links: themeFormations };
    }).filter(group => group.links.length > 0);

    const publicationLinks = publications.map(item => ({ href: `/publications/${item.slug || item.id}`, title: item.title || item.id }));
    const newsLinks = news.map(item => ({ href: `/news/${item.slug || item.id}`, title: item.title || item.id }));

    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <header className="mb-12 text-left">
                <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline">Sitemap</h1>
                <p className="text-muted-foreground mt-2">Un aperçu complet de la structure de notre site.</p>
            </header>

            <div className="grid gap-8">
                <SitemapSection title="Pages Principales" links={mainPages} />
                <SitemapSection title="Nos Campus" links={campusLinks} />
                <SitemapGroupedSection title="Nos Formations par Thème" groups={formationGroups} />
                <SitemapSection title="Nos Publications" links={publicationLinks} />
                <SitemapSection title="Nos Actualités" links={newsLinks} />
            </div>
        </div>
    );
}

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://imeda.fr';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/login', '/api/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}

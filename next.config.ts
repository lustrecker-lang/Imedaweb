import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      // Redirect /index.html to homepage
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
      },
      // Redirect old catalogue/formations paths to new courses page
      {
        source: '/catalogue/formations/:code/formation.html',
        destination: '/courses',
        permanent: true,
      },
      {
        source: '/catalogue/formations/:code',
        destination: '/courses',
        permanent: true,
      },
      {
        source: '/catalogue/:path*',
        destination: '/courses',
        permanent: true,
      },
      // Redirect old publications/articles paths to new publications page
      {
        source: '/publications/articles/:code.html',
        destination: '/publications',
        permanent: true,
      },
      {
        source: '/publications/articles/:code',
        destination: '/publications',
        permanent: true,
      },
      // Redirect old campus paths
      {
        source: '/campus/:slug.html',
        destination: '/campus/:slug',
        permanent: true,
      },
      // Redirect old about section paths
      {
        source: '/about/references.html',
        destination: '/references',
        permanent: true,
      },
      {
        source: '/about/notre_approche.html',
        destination: '/notre-approche',
        permanent: true,
      },
      {
        source: '/about/presentation.html',
        destination: '/presentation',
        permanent: true,
      },
      {
        source: '/about/:path*',
        destination: '/presentation',
        permanent: true,
      },
      // Redirect old contact paths
      {
        source: '/contact/contact.html',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/contact/:path*',
        destination: '/contact',
        permanent: true,
      },
      // Redirect old locations paths to campus
      {
        source: '/locations/:slug.html',
        destination: '/campus/:slug',
        permanent: true,
      },
      {
        source: '/locations/:path*',
        destination: '/',
        permanent: true,
      },
      // Redirect old insights to publications
      {
        source: '/insights/:path*',
        destination: '/publications',
        permanent: true,
      },
      // Redirect privacy policy
      {
        source: '/privacy-policy.html',
        destination: '/legal#privacy',
        permanent: true,
      },
      // Redirect malformed /$ URL
      {
        source: '/$',
        destination: '/',
        permanent: true,
      },
      // Redirect any .html pages to their non-.html equivalents
      {
        source: '/:path*.html',
        destination: '/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

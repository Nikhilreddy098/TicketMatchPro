import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/orders/', '/api/'],
    },
    sitemap: 'https://ticketmatchpro.com/sitemap.xml',
  };
}

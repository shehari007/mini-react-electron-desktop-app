import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/site';

// Metadata routes are route handlers, so `output: 'export'` requires them to
// declare that they render once at build time rather than per request.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Build output and the service worker have no business in an index.
        disallow: ['/_next/', '/sw.js'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

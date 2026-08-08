import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/site';
import { TOOLS } from '@/lib/tools';

/**
 * Generated from the tool registry, so a new tool is in the sitemap the moment
 * its registry entry exists — no separate list to forget to update.
 *
 * `lastModified` is fixed to the release date rather than `new Date()`: a build
 * timestamp would tell crawlers every page changed on every deploy, which
 * teaches them to ignore the field.
 */
// Metadata routes are route handlers, so `output: 'export'` requires them to
// declare that they render once at build time rather than per request.
export const dynamic = 'force-static';

const LAST_MODIFIED = new Date('2026-08-08');

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...TOOLS.map((tool) => ({
      url: `${SITE_URL}/${tool.slug}/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly' as const,
      // Featured tools are the ones with real search demand; the rest sit a
      // notch below so crawl budget lands on the pages that matter.
      priority: tool.featured ? 0.9 : 0.7,
    })),
    {
      url: `${SITE_URL}/about/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];
}

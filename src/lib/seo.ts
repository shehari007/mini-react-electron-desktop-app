import type { Metadata } from 'next';

import { OG_IMAGE, SITE, SITE_URL } from './site';
import type { Tool } from './tools';

/**
 * Metadata builders.
 *
 * Every tool route gets its own title, description, canonical URL, keywords and
 * OG/Twitter card from its registry entry — that per-route uniqueness is the
 * whole reason the app is a static export with real URLs rather than the single
 * client-rendered page it used to be.
 */

interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  keywords?: readonly string[];
}

/** Normalises to the `trailingSlash: true` form the export actually produces,
 *  so canonical tags match the URLs that are really served. */
function canonicalPath(path: string): string {
  if (path === '/' || path === '') return '/';
  const withLeading = path.startsWith('/') ? path : `/${path}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

export function pageMetadata({ title, description, path, keywords }: PageMetaInput): Metadata {
  const url = `${SITE_URL}${canonicalPath(path)}`;

  return {
    title,
    description,
    keywords: keywords ? [...keywords] : undefined,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      siteName: SITE.name,
      title,
      description,
      locale: SITE.locale,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: `${SITE.name} — ${SITE.tagline}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE],
      creator: SITE.twitterHandle,
    },
  };
}

export function toolMetadata(tool: Tool): Metadata {
  return pageMetadata({
    // "Name — Free Online Tool | AppBox" reads naturally in a SERP and keeps the
    // distinguishing part first, which is what survives title truncation.
    title: `${tool.name} — Free Online Tool`,
    description: tool.description,
    path: `/${tool.slug}`,
    keywords: [...tool.keywords, 'free', 'online', 'offline', 'no signup', SITE.name.toLowerCase()],
  });
}

// ─── Structured data ──────────────────────────────────────────────────────

/**
 * Each tool page is a SoftwareApplication. `offers` with price 0 is what makes
 * Google eligible to show the "Free" annotation, and `browserRequirements`
 * signals that it runs client-side.
 */
export function toolJsonLd(tool: Tool): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    url: `${SITE_URL}/${tool.slug}/`,
    applicationCategory: 'UtilitiesApplication',
    applicationSubCategory: tool.category,
    operatingSystem: 'Web, Windows, macOS, Linux',
    browserRequirements: 'Requires JavaScript',
    softwareVersion: SITE.version,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: {
      '@type': 'Person',
      name: SITE.author.name,
      url: SITE.author.github,
    },
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE_URL },
    ...(tool.offline ? { featureList: 'Works fully offline. No account or API key required.' } : {}),
  };
}

export function siteJsonLd(toolCount: number): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE.name,
    alternateName: 'AppBox Utility Toolbox',
    description: `${toolCount} offline-first utilities in one app — calculators, converters, developer tools, timers, finance and health tools.`,
    url: SITE_URL,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web, Windows, macOS, Linux',
    softwareVersion: SITE.version,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Person', name: SITE.author.name, url: SITE.author.github },
    license: 'https://opensource.org/licenses/MIT',
  };
}

/** Breadcrumbs give the SERP a readable path instead of a bare URL. */
export function breadcrumbJsonLd(trail: Array<{ name: string; path: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${canonicalPath(item.path)}`,
    })),
  };
}

import type { MetadataRoute } from 'next';

import { SITE } from '@/lib/site';
import { FEATURED_TOOLS, TOOL_COUNT } from '@/lib/tools';

// Metadata routes are route handlers, so `output: 'export'` requires them to
// declare that they render once at build time rather than per request.
export const dynamic = 'force-static';

/**
 * Web app manifest, emitted to /manifest.webmanifest by the static export.
 *
 * `shortcuts` are what make the installed PWA feel like the desktop build: a
 * right-click on the taskbar/dock icon jumps straight into a tool. They're
 * generated from the featured tools so the two stay in sync.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${TOOL_COUNT} Tools in One App`,
    short_name: SITE.name,
    description: `${TOOL_COUNT} fast, private utilities that work offline — calculators, converters, developer tools, timers, finance and health.`,
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    orientation: 'any',
    background_color: '#fafafb',
    theme_color: '#fafafb',
    categories: ['utilities', 'productivity', 'developer'],
    lang: 'en',
    dir: 'ltr',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: FEATURED_TOOLS.map((tool) => ({
      name: tool.name,
      short_name: tool.navLabel,
      url: `/${tool.slug}/`,
      description: tool.description,
    })),
  };
}

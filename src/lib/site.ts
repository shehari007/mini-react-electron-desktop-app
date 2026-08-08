/** Canonical site metadata. Single place to change the domain or branding. */

/**
 * Vercel sets NEXT_PUBLIC_SITE_URL for previews; production falls back to the
 * canonical domain. Canonical URLs always point at the web deployment even in
 * the Electron build — search engines only ever see the web one, and pointing
 * `app://` at itself would emit nonsense into the sitemap.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://appbox.msyb.dev').replace(/\/$/, '');

export const SITE = {
  name: 'AppBox',
  tagline: 'Your all-in-one utility toolbox',
  url: SITE_URL,
  locale: 'en_US',
  /** Bumped alongside package.json — shown in About and the sidebar footer. */
  version: '3.0.0',
  author: {
    name: 'Muhammad Sheharyar Butt',
    email: 'shehariyar@gmail.com',
    github: 'https://github.com/shehari007',
  },
  repo: 'https://github.com/shehari007/mini-react-electron-desktop-app',
  support: 'https://www.buymeacoffee.com/shehari007',
  twitterHandle: '@shehari007',
} as const;

export const OG_IMAGE = `${SITE_URL}/og.png`;

import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

import { AppShell } from '@/components/layout/AppShell';
import { ServiceWorker } from '@/components/layout/ServiceWorker';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { OG_IMAGE, SITE, SITE_URL } from '@/lib/site';
import { TOOL_COUNT } from '@/lib/tools';

import './globals.css';

/**
 * next/font downloads and self-hosts these at build time, so there is no
 * request to fonts.googleapis.com at runtime. That's what the old CRA build did
 * via an @import, and it meant the "offline" app rendered in a fallback face and
 * leaked a request to Google on every load.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono-stack',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} — ${TOOL_COUNT} Free Online Tools in One App`,
    // Tool pages supply their own title; this appends the brand.
    template: `%s | ${SITE.name}`,
  },
  description: `${TOOL_COUNT} fast, private utilities in one place — calculator, unit and currency converters, developer tools, timers, finance and health calculators. Free, no signup, and everything works offline.`,
  applicationName: SITE.name,
  authors: [{ name: SITE.author.name, url: SITE.author.github }],
  creator: SITE.author.name,
  publisher: SITE.author.name,
  keywords: [
    'online tools',
    'free tools',
    'utility app',
    'calculator',
    'unit converter',
    'developer tools',
    'offline tools',
    'pwa',
    'appbox',
  ],
  category: 'utilities',
  alternates: { canonical: '/' },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE.name,
    title: `${SITE.name} — ${TOOL_COUNT} Free Online Tools in One App`,
    description: `${TOOL_COUNT} fast, private utilities that work offline. No signup, no API keys.`,
    locale: SITE.locale,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: `${SITE.name} — ${SITE.tagline}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${TOOL_COUNT} Free Online Tools`,
    description: `${TOOL_COUNT} fast, private utilities that work offline.`,
    images: [OG_IMAGE],
    creator: SITE.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: SITE.name },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // The two values match --bg in each mode, so the browser chrome and the
  // Electron window frame blend with the page instead of flashing white.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafb' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0f16' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-dvh bg-bg text-fg antialiased">
        <ThemeProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </ThemeProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}

/**
 * AppBox ships one static build to two targets:
 *   - Vercel  → served from https://appbox.msyb.dev
 *   - Electron → served from app://appbox/ by a custom protocol handler
 *
 * `output: 'export'` gives us real HTML per route (SEO) and a folder Electron
 * can serve without a Node server. `trailingSlash` keeps the exported
 * `/calculator/index.html` layout aligned with what the client router requests,
 * which is what makes deep links work identically in both targets.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,

  // Static export cannot run the image optimizer.
  images: { unoptimized: true },

  // Fail the build on type errors rather than shipping them. Linting is a
  // separate `npm run lint` step — Next 16 no longer runs ESLint during build.
  typescript: { ignoreBuildErrors: false },

  experimental: {
    // Rewrites `import { X } from 'lucide-react'` to deep per-icon imports so
    // routes only pull the icons they render.
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;

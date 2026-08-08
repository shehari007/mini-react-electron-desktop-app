/* eslint-disable no-restricted-globals */
/**
 * AppBox service worker.
 *
 * Hand-written rather than generated, because the caching rules here are short
 * and the behaviour matters: this is what makes "works offline" true for the web
 * build rather than aspirational.
 *
 * Strategy per request type:
 *   /_next/static/*   cache-first     — filenames are content-hashed, so a hit
 *                                       is always correct and never stale
 *   navigations       network-first   — fresh HTML when online, cached shell
 *                                       when not, so a deploy is picked up
 *   other same-origin stale-while-revalidate
 *   cross-origin      passthrough     — weather/currency APIs are never cached
 *                                       here; those tools cache their own
 *                                       results in localStorage with a
 *                                       timestamp they can show the user
 */

const VERSION = 'v3.0.0';
const SHELL_CACHE = `appbox-shell-${VERSION}`;
const ASSET_CACHE = `appbox-assets-${VERSION}`;
const ROUTE_CACHE = `appbox-routes-${VERSION}`;

const CORE = ['/', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Individually, so one 404 doesn't fail the whole install.
      await Promise.allSettled(CORE.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      // Drop caches from previous versions; the version string is the only
      // invalidation mechanism, so bump VERSION when the strategy changes.
      await Promise.all(
        keys
          .filter((key) => key.startsWith('appbox-') && !key.endsWith(VERSION))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

/**
 * The page posts the full route list after load (it has the tool registry; this
 * file does not). That's what makes all 36 tools available offline after a
 * single visit, instead of only the ones the user happened to open.
 */
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'PRECACHE_ROUTES' || !Array.isArray(data.routes)) return;

  event.waitUntil(
    (async () => {
      const cache = await caches.open(ROUTE_CACHE);
      const missing = [];
      for (const route of data.routes) {
        if (typeof route !== 'string') continue;
        // Skip what's already there so a reload isn't 36 more requests.
        if (!(await cache.match(route))) missing.push(route);
      }
      await Promise.allSettled(missing.map((route) => cache.add(route)));
    })(),
  );
});

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/');
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(ROUTE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = (await cache.match(request)) ?? (await caches.match(request, { ignoreSearch: true }));
    if (cached) return cached;

    // Nothing cached for this route — fall back to the app shell so the user
    // gets the navigation UI rather than the browser's offline dinosaur.
    const shell = await caches.match('/');
    if (shell) return shell;
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);

  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  // Serve the cached copy immediately and let the refresh land for next time.
  if (cached) return cached;

  const response = await refresh;
  if (response) return response;
  throw new Error(`Unable to fetch ${request.url}`);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never interfere with anything but plain GETs.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

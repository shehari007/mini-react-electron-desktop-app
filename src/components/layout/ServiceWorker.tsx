'use client';

import { useEffect } from 'react';

import { TOOLS } from '@/lib/tools';

/**
 * Registers the service worker and hands it the full route list.
 *
 * Skipped entirely in Electron: the desktop build serves the same files from
 * disk over app://, so a cache layer in front of them would add complexity and
 * a staleness failure mode for zero benefit.
 *
 * Also skipped in development, where a SW intercepting Next's HMR requests
 * produces confusing "why isn't my change showing" behaviour.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (window.appbox) return;
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });

        // `ready` resolves once there's an active worker to talk to; registering
        // does not guarantee one yet on a first visit.
        const registration = await navigator.serviceWorker.ready;
        if (cancelled) return;

        registration.active?.postMessage({
          type: 'PRECACHE_ROUTES',
          routes: ['/', '/about/', ...TOOLS.map((tool) => `/${tool.slug}/`)],
        });
      } catch {
        // A failed registration costs offline support, nothing else — the app
        // works normally without it, so there's nothing worth alerting about.
      }
    };

    // Defer past first paint: registration and ~38 precache requests should not
    // compete with the page the user is waiting on.
    if (document.readyState === 'complete') {
      void register();
      return () => {
        cancelled = true;
      };
    }

    window.addEventListener('load', register, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener('load', register);
    };
  }, []);

  return null;
}

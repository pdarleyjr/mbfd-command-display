/*
 * Emergency service-worker cleanup for old MBFD Command Display PWA builds.
 *
 * The app no longer uses a service worker. This file remains only so browsers that
 * already registered the old Workbox /sw.js can update to this cleanup worker,
 * delete stale app-shell caches, unregister, and reload onto the network version.
 */

const CACHE_PATTERNS = [/^workbox-/i, /^mbfd-wall-v/i, /^mbfd-command/i, /^vite-pwa/i];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if ('caches' in self) {
        const names = await caches.keys();
        await Promise.all(
          names
            .filter((name) => CACHE_PATTERNS.some((pattern) => pattern.test(name)))
            .map((name) => caches.delete(name)),
        );
      }

      await self.clients.claim();
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      await self.registration.unregister();

      for (const client of clients) {
        const url = new URL(client.url);
        url.searchParams.set('sw-cleared', String(Date.now()));
        client.navigate(url.href);
      }
    })(),
  );
});

self.addEventListener('fetch', () => {
  // Intentionally no fetch handler. Network/default browser behavior should own all requests.
});

import { clearPersistedDisplayCache } from './persistentCache';

const CACHE_PATTERNS = [/^workbox-/i, /^mbfd-wall-v/i, /^mbfd-command/i, /^mbfd-cache/i, /^vite-pwa/i];

export async function cleanupLegacyServiceWorkers(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations
          .filter((registration) => {
            const script = registration.active?.scriptURL ?? registration.waiting?.scriptURL ?? registration.installing?.scriptURL ?? '';
            return script.includes('/sw.js') || script.includes('workbox') || registration.scope === `${window.location.origin}/`;
          })
          .map((registration) => registration.unregister()),
      );
    } catch {
      // Cleanup is best effort; data rendering must never depend on service-worker APIs.
    }
  }

  if ('caches' in window) {
    try {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => CACHE_PATTERNS.some((pattern) => pattern.test(name))).map((name) => caches.delete(name)));
    } catch {
      // Best effort only.
    }
  }
}

export async function runCacheBustIfRequested(): Promise<boolean> {
  const url = new URL(window.location.href);
  const requested = url.pathname === '/cache-bust' || url.searchParams.has('cache-bust') || url.searchParams.has('clearDisplayCache');
  if (!requested) return false;

  clearPersistedDisplayCache();
  try {
    localStorage.removeItem('mbfd-command-ui');
  } catch {
    // Ignore unavailable localStorage.
  }
  await cleanupLegacyServiceWorkers();
  window.location.replace('/?cache-cleared=1');
  return true;
}

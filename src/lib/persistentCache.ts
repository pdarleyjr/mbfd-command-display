/**
 * Last-good client cache. Persists each query's most recent successful payload to
 * localStorage so a hard refresh (or a cold start while the hub is briefly down) paints
 * real data instantly instead of a spinner. The edge gateway also keeps a KV snapshot;
 * this is the browser-side layer of the same degrade-never-blank strategy.
 */

const PREFIX = 'mbfd-cache:';
const MAX_AGE_MS = 1000 * 60 * 60 * 12; // 12h — older than this, ignore on hydrate

interface Envelope<T> {
  at: number;
  data: T;
}

export function loadPersisted<T>(key: string): { data: T; ageSeconds: number } | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const env = JSON.parse(raw) as Envelope<T>;
    const ageMs = Date.now() - env.at;
    if (ageMs > MAX_AGE_MS) return null;
    return { data: env.data, ageSeconds: Math.round(ageMs / 1000) };
  } catch {
    return null;
  }
}

export function savePersisted<T>(key: string, data: T): void {
  try {
    const env: Envelope<T> = { at: Date.now(), data };
    localStorage.setItem(PREFIX + key, JSON.stringify(env));
  } catch {
    // Quota / private mode — non-fatal; the edge KV snapshot still covers us.
  }
}

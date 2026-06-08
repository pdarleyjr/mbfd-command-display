/**
 * Degrade-never-blank passthrough: edge cache + last-good KV snapshot.
 *
 * Order of attack for a request:
 *   1. caches.default hit  → return it (edge already vouched it).
 *   2. live hub 2xx JSON   → cache it (KV last-good + edge), served-from=origin.
 *   3. hub down / non-2xx  → serve KV last-good, served-from=snapshot + age.
 *   4. no KV either        → serve caller's emptyFallback, served-from=empty.
 *
 * KV stores `{ at: <epoch ms>, data }` so snapshot age is computed at read time.
 */

import type { Env } from './env';
import { fetchHub } from './hubClient';
import {
  HEADER_SERVED_FROM,
  HEADER_SNAPSHOT_AGE,
  securityHeaders,
} from './response';

/**
 * Typed accessor for the Workers runtime's `caches.default` (the named edge
 * cache). `lib: ["ES2023","WebWorker"]` pulls in a DOM `CacheStorage` that lacks
 * the Cloudflare-only `default` member, so we read it through the augmented type
 * exposed by `@cloudflare/workers-types` rather than scattering casts.
 */
export function edgeCache(): Cache {
  return (caches as unknown as { default: Cache }).default;
}

/** Shape persisted to KV for each cached endpoint. */
interface SnapshotEnvelope {
  at: number; // epoch ms when captured from origin
  data: unknown;
}

export interface CachedPassthroughOptions {
  /** KV key for the last-good snapshot (e.g. 'snapshot', 'station-3'). */
  kvKey: string;
  /** Hub path to fetch (e.g. '/api/display/snapshot'). */
  hubPath: string;
  /** Cache + KV TTL in seconds. */
  ttlSeconds: number;
  /** Returned (200, served-from=empty) when neither origin nor KV is available. */
  emptyFallback: unknown;
  /** Per-call hub timeout override. */
  timeoutMs?: number;
}

/** Minimal slice of the Pages Functions context we depend on. */
export interface PassthroughContext {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<unknown>) => void;
}

function jsonBody(data: unknown): string {
  return JSON.stringify(data);
}

function baseHeaders(extra?: Record<string, string>): Headers {
  const headers = new Headers(extra);
  headers.set('content-type', 'application/json; charset=utf-8');
  for (const [k, v] of Object.entries(securityHeaders())) headers.set(k, v);
  return headers;
}

function originResponse(data: unknown, ttlSeconds: number): Response {
  const headers = baseHeaders({
    'cache-control': `public, max-age=${ttlSeconds}, s-maxage=${ttlSeconds}`,
  });
  headers.set(HEADER_SERVED_FROM, 'origin');
  return new Response(jsonBody(data), { status: 200, headers });
}

function snapshotResponse(envelope: SnapshotEnvelope): Response {
  const ageSeconds = Math.max(0, Math.floor((Date.now() - envelope.at) / 1000));
  const headers = baseHeaders({ 'cache-control': 'no-store' });
  headers.set(HEADER_SERVED_FROM, 'snapshot');
  headers.set(HEADER_SNAPSHOT_AGE, String(ageSeconds));
  return new Response(jsonBody(envelope.data), { status: 200, headers });
}

function emptyResponse(data: unknown): Response {
  const headers = baseHeaders({ 'cache-control': 'no-store' });
  headers.set(HEADER_SERVED_FROM, 'empty');
  return new Response(jsonBody(data), { status: 200, headers });
}

/** Read + parse the last-good envelope from KV. Returns null on miss/parse error. */
async function readSnapshot(env: Env, kvKey: string): Promise<SnapshotEnvelope | null> {
  const raw = await env.SNAPSHOTS.get(kvKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SnapshotEnvelope;
    if (parsed && typeof parsed.at === 'number') return parsed;
    return null;
  } catch {
    return null;
  }
}

/** Persist a fresh last-good envelope to KV with a TTL slightly past serve-TTL. */
async function writeSnapshot(env: Env, kvKey: string, data: unknown, ttlSeconds: number): Promise<void> {
  const envelope: SnapshotEnvelope = { at: Date.now(), data };
  // Keep the last-good well past the serve TTL so it survives a long hub outage.
  const kvTtl = Math.max(ttlSeconds * 12, 3600);
  await env.SNAPSHOTS.put(kvKey, JSON.stringify(envelope), { expirationTtl: kvTtl });
}

/**
 * The core degrade-never-blank handler. Always returns a JSON Response carrying
 * security + provenance headers.
 */
export async function cachedPassthrough(
  context: PassthroughContext,
  options: CachedPassthroughOptions,
): Promise<Response> {
  const { request, env, waitUntil } = context;
  const { kvKey, hubPath, ttlSeconds, emptyFallback, timeoutMs } = options;

  // 1) Edge cache hit.
  const cache = edgeCache();
  const edge = await cache.match(request);
  if (edge) return edge;

  // 2) Live origin.
  try {
    const hub = await fetchHub(env, hubPath, { timeoutMs });
    if (hub.ok && hub.body != null) {
      const res = originResponse(hub.body, ttlSeconds);
      const data = hub.body;
      waitUntil(
        Promise.all([
          writeSnapshot(env, kvKey, data, ttlSeconds),
          cache.put(request, res.clone()),
        ]),
      );
      return res;
    }
    // Non-2xx or non-JSON: fall through to snapshot.
  } catch {
    // Network/timeout: fall through to snapshot.
  }

  // 3) Last-good KV snapshot.
  const snapshot = await readSnapshot(env, kvKey);
  if (snapshot) return snapshotResponse(snapshot);

  // 4) Caller's empty fallback.
  return emptyResponse(emptyFallback);
}

/** Exposed for routes (e.g. ai-snapshot) that manage caching themselves. */
export const cacheInternals = {
  readSnapshot,
  writeSnapshot,
  originResponse,
  snapshotResponse,
  emptyResponse,
};

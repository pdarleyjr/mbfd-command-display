/**
 * GET /api/cameras/ozolio?oid=EMB_... → 302 redirect to the resolved live .m3u8.
 *
 * Ozolio's relay gates stream resolution on the embedding page's `document` param
 * (only allow-listed hosts like miamiandbeaches.com get a 200), so we run the
 * init→open handshake server-side with that document, then redirect the client to
 * the returned playlist. The relay serves playlist + segments with
 * Access-Control-Allow-Origin:* so hls.js plays them from any origin (no proxy).
 *
 * Field names mirror media-control/server/lib/ozolio-resolve.js exactly:
 *   init: GET ses.api?cmd=init&oid=<OID>&ver=5&channel=0&control=1&document=<enc>
 *         → session.id
 *   open: GET ses.api?cmd=open&oid=<session.id>&output=1&format=M3U8&profile=
 *         → output.source (the .m3u8)
 * The resolved URL is cached in KV (`oz-<OID>`) with a 75s soft TTL.
 */

import type { Env } from '../../_shared/env';
import { requireAccess } from '../../_shared/access';
import { json } from '../../_shared/response';
import { block } from '../../_shared/route';

const DOCUMENT = 'https://www.miamiandbeaches.com/';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
// EMB_ is the only OID form the relay resolves; strict whitelist also blocks the
// SSRF/injection vector since the oid is interpolated into the upstream URL.
const OID_RE = /^EMB_[A-Za-z0-9]{6,16}$/;
const SOFT_TTL_SECONDS = 75;

interface OzInit {
  session?: { id?: string };
}
interface OzOpen {
  output?: { source?: string };
}
interface OzCacheEntry {
  source: string;
  at: number;
}

async function fetchJson<T>(url: string, timeoutMs = 9000): Promise<T> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, Referer: 'https://relay.ozolio.com/' },
      signal: ac.signal,
    });
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    return (await r.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function resolveStream(oid: string): Promise<string> {
  const doc = encodeURIComponent(DOCUMENT);
  const init = await fetchJson<OzInit>(
    `https://relay.ozolio.com/ses.api?cmd=init&oid=${oid}&ver=5&channel=0&control=1&document=${doc}`,
  );
  const sid = init?.session?.id;
  if (!sid || !/^[A-Za-z0-9_-]{4,64}$/.test(sid)) throw new Error('init: no session');

  const open = await fetchJson<OzOpen>(
    `https://relay.ozolio.com/ses.api?cmd=open&oid=${sid}&output=1&format=M3U8&profile=`,
  );
  const source = open?.output?.source;
  if (!source || !source.includes('.m3u8')) throw new Error('open: no m3u8 source');
  return source;
}

function redirect(source: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      location: source,
      'cache-control': `public, max-age=${SOFT_TTL_SECONDS}`,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const denied = await requireAccess(request, env);
  if (denied) return denied;

  const oid = new URL(request.url).searchParams.get('oid') ?? '';
  if (!OID_RE.test(oid)) {
    return json({ error: 'bad_request', message: 'invalid oid' }, { status: 400 });
  }

  const kvKey = `oz-${oid}`;

  // Soft-TTL KV cache: reuse the resolved url for ~75s before re-resolving.
  try {
    const cached = await env.SNAPSHOTS.get(kvKey);
    if (cached) {
      const entry = JSON.parse(cached) as OzCacheEntry;
      if (entry && typeof entry.source === 'string' && Date.now() - entry.at < SOFT_TTL_SECONDS * 1000) {
        return redirect(entry.source);
      }
    }
  } catch {
    // ignore cache read errors and re-resolve
  }

  try {
    const source = await resolveStream(oid);
    const entry: OzCacheEntry = { source, at: Date.now() };
    context.waitUntil(
      env.SNAPSHOTS.put(kvKey, JSON.stringify(entry), { expirationTtl: 300 }),
    );
    return redirect(source);
  } catch {
    return json({ error: 'bad_gateway', message: 'failed to resolve ozolio stream' }, { status: 502 });
  }
};

export const onRequestPost = block;
export const onRequestPut = block;
export const onRequestPatch = block;
export const onRequestDelete = block;

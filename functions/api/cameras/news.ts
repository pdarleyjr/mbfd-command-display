/**
 * GET /api/cameras/news?key=... → 302 redirect to a public HLS master playlist.
 *
 * Only allow-listed keys resolve; any unknown key returns 404 JSON so the SPA can
 * fall back to its iframe wrapper. The masters are public, CORS-open HLS that
 * hls.js plays directly after following the redirect — no segment proxy needed.
 */

import type { Env } from '../../_shared/env';
import { requireAccess } from '../../_shared/access';
import { json } from '../../_shared/response';
import { block } from '../../_shared/route';

/** key → public HLS master. Extend deliberately; unknown keys 404 by design. */
const NEWS_MASTERS: Record<string, string> = {
  mbtv: 'https://edge-f.swagit.com/live/miamibeachfl/live-1-a/playlist.m3u8',
  cbs: 'https://cbsn-mia.cbsnstream.cbsnews.com/out/v1/ac174b7938264d24ae27e56f6584bca0/master.m3u8',
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const denied = await requireAccess(request, env);
  if (denied) return denied;

  const key = (new URL(request.url).searchParams.get('key') ?? '').toLowerCase();
  const master = Object.prototype.hasOwnProperty.call(NEWS_MASTERS, key) ? NEWS_MASTERS[key] : undefined;

  if (!master) {
    return json({ error: 'not_found', message: 'unknown news key' }, { status: 404 });
  }

  return new Response(null, {
    status: 302,
    headers: {
      location: master,
      'cache-control': 'public, max-age=30',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });
};

export const onRequestPost = block;
export const onRequestPut = block;
export const onRequestPatch = block;
export const onRequestDelete = block;

/**
 * GET /api/ai-snapshot → hub /api/display/ai-snapshot.
 *
 * Status-aware passthrough (NOT plain cachedPassthrough):
 *   • 200          → cache (KV + edge), served-from=origin.
 *   • 202 (gen.)   → return prior KV brief (served-from=snapshot, 200) if present,
 *                    else pass the 202 through so the SPA can show "generating".
 *   • 504 / down   → return KV last-good (served-from=snapshot), else a synthetic
 *                    "temporarily unavailable" descriptive brief.
 */

import type { Env } from '../_shared/env';
import { requireAccess } from '../_shared/access';
import { cacheInternals, edgeCache } from '../_shared/cache';
import { fetchHub } from '../_shared/hubClient';
import { json } from '../_shared/response';
import { block } from '../_shared/route';

const KV_KEY = 'ai-snapshot';
const HUB_PATH = '/api/display/ai-snapshot';

function ttl(env: Env): number {
  const n = Number(env.AI_SNAPSHOT_TTL_SECONDS);
  return Number.isFinite(n) && n > 0 ? n : 1800;
}

function unavailableBrief(): unknown {
  return {
    mode: 'descriptive',
    briefing: 'AI briefing is temporarily unavailable.',
    station_summaries: [],
    active_run_summary: '',
    camera_source_summary: '',
    data_gaps: ['AI service unreachable'],
    confidence: 0,
    generated_at: new Date().toISOString(),
    model: 'qwen3.6:35b',
    status: 'unavailable',
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const denied = await requireAccess(request, env);
  if (denied) return denied;

  // Edge cache hit (only 200s are ever cached at the edge).
  const cache = edgeCache();
  const edge = await cache.match(request);
  if (edge) return cacheInternals.clientEdgeHitResponse(edge);

  const ttlSeconds = ttl(env);

  try {
    const hub = await fetchHub(env, HUB_PATH, { timeoutMs: 8000 });

    // 200: fresh brief — cache it.
    if (hub.status === 200 && hub.ok && hub.body != null) {
      const data = hub.body;
      const res = cacheInternals.originResponse(data);
      context.waitUntil(
        Promise.all([
          cacheInternals.writeSnapshot(env, KV_KEY, data, ttlSeconds),
          cache.put(request, cacheInternals.edgeOriginResponse(data, ttlSeconds)),
        ]),
      );
      return res;
    }

    // 202: hub is generating — prefer a prior brief, else pass 202 through.
    if (hub.status === 202) {
      const prior = await cacheInternals.readSnapshot(env, KV_KEY);
      if (prior) return cacheInternals.snapshotResponse(prior);
      const passthroughBody = hub.body ?? { status: 'generating', message: 'AI briefing is generating.' };
      return json(passthroughBody, { status: 202, headers: { 'X-Display-Served-From': 'origin' } });
    }

    // 504 (or any other status): fall through to last-good / synthetic.
  } catch {
    // network/timeout → fall through to last-good / synthetic
  }

  // Hub failure / 504: serve last-good if present.
  const snapshot = await cacheInternals.readSnapshot(env, KV_KEY);
  if (snapshot) return cacheInternals.snapshotResponse(snapshot);

  // Nothing cached: synthetic unavailable brief.
  return cacheInternals.emptyResponse(unavailableBrief());
};

export const onRequestPost = block;
export const onRequestPut = block;
export const onRequestPatch = block;
export const onRequestDelete = block;

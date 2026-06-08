/**
 * GET /api/incidents → hub /api/display/incidents (falls back to /api/incidents on 404).
 *
 * PulsePoint changes fast → short 30s TTL. Still degrade-never-blank: a hub outage
 * serves the last-good KV snapshot; total cold-start serves an empty payload.
 */

import type { Env } from '../_shared/env';
import { requireAccess } from '../_shared/access';
import { cacheInternals, edgeCache } from '../_shared/cache';
import { fetchHub } from '../_shared/hubClient';
import { block } from '../_shared/route';

const KV_KEY = 'incidents';
const TTL_SECONDS = 30;
const PRIMARY_PATH = '/api/display/incidents';
const FALLBACK_PATH = '/api/incidents';

function emptyIncidents(): unknown {
  return { active: [], recent: [], fetchedAt: new Date().toISOString(), error: 'unavailable' };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const denied = await requireAccess(request, env);
  if (denied) return denied;

  // 1) Edge cache hit.
  const cache = edgeCache();
  const edge = await cache.match(request);
  if (edge) return edge;

  // 2) Live origin (primary path, then fallback on 404).
  try {
    let hub = await fetchHub(env, PRIMARY_PATH, { timeoutMs: 6000 });
    if (hub.status === 404) {
      hub = await fetchHub(env, FALLBACK_PATH, { timeoutMs: 6000 });
    }
    if (hub.ok && hub.body != null) {
      const res = cacheInternals.originResponse(hub.body, TTL_SECONDS);
      const data = hub.body;
      context.waitUntil(
        Promise.all([
          cacheInternals.writeSnapshot(env, KV_KEY, data, TTL_SECONDS),
          cache.put(request, res.clone()),
        ]),
      );
      return res;
    }
  } catch {
    // fall through to snapshot
  }

  // 3) Last-good KV snapshot.
  const snapshot = await cacheInternals.readSnapshot(env, KV_KEY);
  if (snapshot) return cacheInternals.snapshotResponse(snapshot);

  // 4) Empty fallback.
  return cacheInternals.emptyResponse(emptyIncidents());
};

export const onRequestPost = block;
export const onRequestPut = block;
export const onRequestPatch = block;
export const onRequestDelete = block;

/**
 * GET /api/stations → hub /api/display/stations.
 * The hub returns an array or { stations: [] }; we pass through whatever it sends.
 */

import type { Env } from '../_shared/env';
import { passthroughRoute, block } from '../_shared/route';

function ttl(env: Env): number {
  const n = Number(env.SNAPSHOT_TTL_SECONDS);
  return Number.isFinite(n) && n > 0 ? n : 300;
}

export const onRequestGet: PagesFunction<Env> = (context) =>
  passthroughRoute({
    kvKey: 'stations',
    hubPath: '/api/display/stations',
    ttlSeconds: ttl(context.env),
    emptyFallback: { stations: [] },
  })(context);

export const onRequestPost = block;
export const onRequestPut = block;
export const onRequestPatch = block;
export const onRequestDelete = block;

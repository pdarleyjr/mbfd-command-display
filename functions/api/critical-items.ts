/**
 * GET /api/critical-items → hub /api/display/critical-items.
 * Critical defects, low-stock items, and pending recommendations.
 */

import type { Env } from '../_shared/env';
import { passthroughRoute, block } from '../_shared/route';

function ttl(env: Env): number {
  const n = Number(env.SNAPSHOT_TTL_SECONDS);
  return Number.isFinite(n) && n > 0 ? n : 300;
}

export const onRequestGet: PagesFunction<Env> = (context) =>
  passthroughRoute({
    kvKey: 'critical',
    hubPath: '/api/display/critical-items',
    ttlSeconds: ttl(context.env),
    emptyFallback: { critical_defects: [], low_stock_items: [], pending_recommendations: [] },
  })(context);

export const onRequestPost = block;
export const onRequestPut = block;
export const onRequestPatch = block;
export const onRequestDelete = block;

/**
 * GET /api/stations/:id → hub /api/display/stations/:id (DisplayStationDetail).
 * Validates :id is a positive integer (400 otherwise) before touching the hub.
 */

import type { Env } from '../../_shared/env';
import { requireAccess } from '../../_shared/access';
import { cachedPassthrough } from '../../_shared/cache';
import { positiveIntParam } from '../../_shared/params';
import { json } from '../../_shared/response';
import { block } from '../../_shared/route';

function ttl(env: Env): number {
  const n = Number(env.SNAPSHOT_TTL_SECONDS);
  return Number.isFinite(n) && n > 0 ? n : 300;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const denied = await requireAccess(context.request, context.env);
  if (denied) return denied;

  const id = positiveIntParam(context.params.id);
  if (id === null) {
    return json({ error: 'bad_request', message: 'station id must be a positive integer' }, { status: 400 });
  }

  return cachedPassthrough(
    { request: context.request, env: context.env, waitUntil: (p) => context.waitUntil(p) },
    {
      kvKey: `station-${id}`,
      hubPath: `/api/display/stations/${id}`,
      ttlSeconds: ttl(context.env),
      emptyFallback: { error: 'unavailable', station: null },
    },
  );
};

export const onRequestPost = block;
export const onRequestPut = block;
export const onRequestPatch = block;
export const onRequestDelete = block;

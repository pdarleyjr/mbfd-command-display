/**
 * GET /api/stations/:id/personnel → hub /api/display/stations/:id/personnel.
 * Long-lived (3600s) — roster changes rarely. Validates :id (400 otherwise).
 */

import type { Env } from '../../../_shared/env';
import { requireAccess } from '../../../_shared/access';
import { cachedPassthrough } from '../../../_shared/cache';
import { positiveIntParam } from '../../../_shared/params';
import { json } from '../../../_shared/response';
import { block } from '../../../_shared/route';

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
      kvKey: `station-${id}-personnel`,
      hubPath: `/api/display/stations/${id}/personnel`,
      ttlSeconds: 3600,
      emptyFallback: { personnel: [] },
    },
  );
};

export const onRequestPost = block;
export const onRequestPut = block;
export const onRequestPatch = block;
export const onRequestDelete = block;

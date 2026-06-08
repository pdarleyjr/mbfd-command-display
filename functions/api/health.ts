/**
 * GET /api/health → liveness probe.
 *
 * Checks the hub's `/up` (Laravel health: text 'ok' / HTTP 200) and, if present,
 * `/api/display/health`. Always returns 200 (the edge is up by definition) with
 * `hub_up` reflecting upstream reachability. Never written to KV; never cached.
 */

import type { Env } from '../_shared/env';
import { requireAccess } from '../_shared/access';
import { fetchHub } from '../_shared/hubClient';
import { json } from '../_shared/response';
import { block } from '../_shared/route';

async function probe(env: Env, path: string): Promise<boolean> {
  try {
    const res = await fetchHub(env, path, { timeoutMs: 4000 });
    return res.status === 200;
  } catch {
    return false;
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const denied = await requireAccess(request, env);
  if (denied) return denied;

  // `/up` is the canonical Laravel liveness route; the display health route is
  // best-effort (only counts as "up" if it answers 200, but doesn't fail the probe).
  const [hubUp, displayHealthUp] = await Promise.all([
    probe(env, '/up'),
    probe(env, '/api/display/health'),
  ]);

  return json(
    {
      edge: 'up',
      hub_up: hubUp || displayHealthUp,
      checked_at: new Date().toISOString(),
    },
    { headers: { 'cache-control': 'no-store', 'X-Display-Served-From': 'origin' } },
  );
};

export const onRequestPost = block;
export const onRequestPut = block;
export const onRequestPatch = block;
export const onRequestDelete = block;

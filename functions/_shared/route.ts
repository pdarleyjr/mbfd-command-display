/**
 * Tiny route helpers shared by every /api route.
 *
 * - `passthroughRoute` wires the standard Access-guard → cachedPassthrough flow.
 * - `block` is the 405 handler exported for non-GET verbs as a safety net (the
 *   /api middleware already blocks them, but routes export it for defense-in-depth).
 */

import type { Env } from './env';
import { requireAccess } from './access';
import { cachedPassthrough, type CachedPassthroughOptions } from './cache';
import { methodNotAllowed } from './response';

/** 405 handler reused by routes' onRequestPost/Put/Delete/Patch exports. */
export const block: PagesFunction<Env> = async () => methodNotAllowed();

/**
 * Build an `onRequestGet` that verifies Access then serves a degrade-never-blank
 * passthrough for a fixed hub path.
 */
export function passthroughRoute(options: CachedPassthroughOptions): PagesFunction<Env> {
  return async (context) => {
    const denied = await requireAccess(context.request, context.env);
    if (denied) return denied;

    return cachedPassthrough(
      { request: context.request, env: context.env, waitUntil: (p) => context.waitUntil(p) },
      options,
    );
  };
}

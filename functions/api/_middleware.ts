/**
 * /api/* middleware: enforces the read-only contract and stamps security headers.
 *
 * - OPTIONS → 204 with `Allow: GET, HEAD, OPTIONS` (CORS/preflight friendliness).
 * - Anything other than GET/HEAD → 405 JSON (no write verb ever reaches a route).
 * - GET/HEAD → pass to the route, then apply securityHeaders() to its response.
 */

import type { Env } from '../_shared/env';
import { json, securityHeaders } from '../_shared/response';

export const onRequest: PagesFunction<Env> = async (context) => {
  const method = context.request.method.toUpperCase();

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { allow: 'GET, HEAD, OPTIONS', ...securityHeaders() },
    });
  }

  if (method !== 'GET' && method !== 'HEAD') {
    return json(
      { error: 'method_not_allowed', message: 'This endpoint is read-only (GET).' },
      { status: 405, headers: { allow: 'GET, HEAD, OPTIONS' } },
    );
  }

  const res = await context.next();
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(securityHeaders())) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
};

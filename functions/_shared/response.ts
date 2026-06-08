/**
 * Shared HTTP response helpers for the MBFD Command Display edge gateway.
 *
 * Every response the gateway emits carries `securityHeaders()` and an explicit
 * `cache-control`. JSON helpers default to `no-store`; cacheable routes override.
 */

/** Where a payload came from. Exposed to the SPA via `X-Display-Served-From`. */
export type ServedFrom = 'origin' | 'snapshot' | 'empty';

/** Header name the SPA reads to render a "serving cached data" badge. */
export const HEADER_SERVED_FROM = 'X-Display-Served-From';
/** Header name the SPA reads for the last-good snapshot age (seconds). */
export const HEADER_SNAPSHOT_AGE = 'X-Display-Snapshot-Age';

/**
 * Safe headers applied to every gateway response. `X-Frame-Options: DENY` is
 * correct here because these are JSON API responses, never embeddable documents.
 */
export function securityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
  };
}

/**
 * Build a JSON Response. Defaults to `cache-control: no-store`; callers that want
 * edge/browser caching pass their own `cache-control` in `init.headers`.
 */
export function json(data: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json; charset=utf-8');
  }
  if (!headers.has('cache-control')) {
    headers.set('cache-control', 'no-store');
  }
  for (const [k, v] of Object.entries(securityHeaders())) {
    headers.set(k, v);
  }
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    statusText: init?.statusText,
    headers,
  });
}

/**
 * Stamp display provenance headers onto an existing Response. Returns a new
 * Response (the original body stream is reused) so callers stay immutable.
 */
export function withDisplayHeaders(res: Response, servedFrom: ServedFrom, ageSeconds?: number): Response {
  const headers = new Headers(res.headers);
  headers.set(HEADER_SERVED_FROM, servedFrom);
  if (typeof ageSeconds === 'number' && Number.isFinite(ageSeconds)) {
    headers.set(HEADER_SNAPSHOT_AGE, String(Math.max(0, Math.floor(ageSeconds))));
  }
  for (const [k, v] of Object.entries(securityHeaders())) {
    headers.set(k, v);
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

/** Standard 405 for non-GET verbs on the read-only gateway. */
export function methodNotAllowed(): Response {
  return json(
    { error: 'method_not_allowed', message: 'This endpoint is read-only (GET).' },
    { status: 405, headers: { allow: 'GET, HEAD, OPTIONS' } },
  );
}

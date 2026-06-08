/**
 * Param validation helpers for dynamic routes.
 */

/**
 * Coerce a path param to a positive integer. Returns null when invalid so the
 * route can reply 400 instead of interpolating untrusted text into the hub URL.
 */
export function positiveIntParam(value: string | string[] | undefined): number | null {
  if (typeof value !== 'string') return null;
  if (!/^[0-9]{1,9}$/.test(value)) return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Tiny typed fetch client for the read-only display API.
 * In production the base is same-origin ("") and Cloudflare Functions serve /api/*.
 * The client surfaces edge metadata (served-from-snapshot, snapshot age) so the UI can
 * show a "serving cached data" badge instead of ever going blank.
 */

export const API_BASE: string = import.meta.env.VITE_API_BASE ?? '';

export class ApiError extends Error {
  status: number;
  body?: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export interface ApiResult<T> {
  data: T;
  servedFrom: 'origin' | 'snapshot' | 'empty' | 'unknown';
  snapshotAgeSeconds: number | null;
  status: number;
}

export async function getJson<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const url = `${API_BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      method: 'GET',
      headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
      // Cloudflare Access cookie rides along on same-origin requests.
      credentials: 'same-origin',
    });
  } catch (err) {
    throw new ApiError(0, `Network error fetching ${path}: ${(err as Error).message}`);
  }

  const servedFrom = (res.headers.get('X-Display-Served-From') as ApiResult<T>['servedFrom']) ?? 'unknown';
  const ageHeader = res.headers.get('X-Display-Snapshot-Age');
  const snapshotAgeSeconds = ageHeader != null ? Number(ageHeader) : null;

  // 202 (AI generating) and 504-with-last-good are still parseable JSON we want to surface.
  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new ApiError(res.status, `Invalid JSON from ${path}`, text.slice(0, 200));
    }
  }

  if (!res.ok && res.status !== 202 && res.status !== 504) {
    throw new ApiError(res.status, `Request to ${path} failed (${res.status})`, parsed);
  }

  return {
    data: parsed as T,
    servedFrom,
    snapshotAgeSeconds: Number.isFinite(snapshotAgeSeconds) ? snapshotAgeSeconds : null,
    status: res.status,
  };
}

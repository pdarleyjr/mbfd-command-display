/**
 * Read-only client for the hub's `/api/display/*` endpoints, reached over the
 * Cloudflare tunnel. GET-only; no method ever reaches the hub except GET, so the
 * gateway can never trigger a write upstream.
 */

import type { Env } from './env';

export interface HubResult {
  /** True only on a 2xx response. */
  ok: boolean;
  status: number;
  /** Parsed JSON body, or null if the body was empty / not JSON. */
  body: unknown | null;
  /** Raw response text (always present, possibly ''). */
  text: string;
}

export interface FetchHubOptions {
  timeoutMs?: number;
}

/**
 * Fetch `${HUB_BASE}${path}` as JSON. Never throws on a non-2xx status — the
 * caller inspects `ok`/`status`. Throws only on network failure or timeout so the
 * degrade-never-blank layer can fall back to KV.
 */
export async function fetchHub(env: Env, path: string, options: FetchHubOptions = {}): Promise<HubResult> {
  const timeoutMs = options.timeoutMs ?? 6000;
  const base = env.HUB_BASE.replace(/\/+$/, '');
  const url = `${base}${path}`;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (env.HUB_DISPLAY_TOKEN) {
    headers['X-Display-Token'] = env.HUB_DISPLAY_TOKEN;
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
      redirect: 'follow',
      signal: ac.signal,
    });

    const text = await res.text();
    let body: unknown | null = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = null; // non-JSON body (e.g. an HTML error page) — leave as null
      }
    }
    return { ok: res.ok, status: res.status, body, text };
  } finally {
    clearTimeout(timer);
  }
}

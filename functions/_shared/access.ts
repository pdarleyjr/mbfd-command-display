/**
 * Defense-in-depth Cloudflare Access verification.
 *
 * Cloudflare Access already protects the Pages app at the edge; when
 * CF_ACCESS_AUD + CF_ACCESS_TEAM are configured, the gateway *also* validates the
 * `Cf-Access-Jwt-Assertion` header (RS256 JWT signed by the team's JWKS). This is
 * a belt-and-suspenders check inside the Function, dependency-free (Web Crypto).
 *
 * If the env vars are absent, verification is skipped (Access still guards the app).
 */

import type { Env } from './env';
import { json } from './response';

export interface AccessResult {
  ok: boolean;
  /** True when no AUD/TEAM configured — Access at the edge is the only guard. */
  skipped?: boolean;
  /** Short reason for logs/debug; never surfaced to clients. */
  reason?: string;
}

/** Minimal JWT shapes we read (we never trust unverified fields). */
interface JwtHeader {
  alg?: string;
  kid?: string;
  typ?: string;
}
interface JwtPayload {
  aud?: string | string[];
  iss?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
}
/** RSA public-key JWK as served by Cloudflare's /cdn-cgi/access/certs. */
interface RsaJwk {
  kty: string;
  kid?: string;
  alg?: string;
  use?: string;
  n: string;
  e: string;
}
interface CertsResponse {
  keys?: RsaJwk[];
}

const JWKS_TTL_MS = 60 * 60 * 1000; // cache team JWKS ~1h in-isolate
const jwksCache = new Map<string, { keys: RsaJwk[]; exp: number }>();

/** base64url -> Uint8Array (no padding, URL-safe alphabet). */
function base64UrlToBytes(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** base64url -> UTF-8 JSON object. Returns null on malformed input. */
function decodeJsonSegment<T>(segment: string): T | null {
  try {
    const bytes = base64UrlToBytes(segment);
    const text = new TextDecoder().decode(bytes);
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** Normalize a team value into the canonical Access hostname. */
function teamHost(team: string): string {
  const t = team.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return t.includes('.') ? t : `${t}.cloudflareaccess.com`;
}

async function fetchJwks(team: string): Promise<RsaJwk[]> {
  const host = teamHost(team);
  const cached = jwksCache.get(host);
  if (cached && cached.exp > Date.now()) return cached.keys;

  const res = await fetch(`https://${host}/cdn-cgi/access/certs`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`jwks ${res.status}`);
  const body = (await res.json()) as CertsResponse;
  const keys = Array.isArray(body.keys) ? body.keys : [];
  jwksCache.set(host, { keys, exp: Date.now() + JWKS_TTL_MS });
  return keys;
}

async function importRsaKey(jwk: RsaJwk): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true } as JsonWebKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
}

function audMatches(aud: string | string[] | undefined, expected: string): boolean {
  if (aud == null) return false;
  return Array.isArray(aud) ? aud.includes(expected) : aud === expected;
}

/**
 * Verify the Access JWT. Returns `{ ok:true, skipped:true }` when no AUD/TEAM is
 * configured. Returns `{ ok:false }` on any validation failure.
 */
export async function verifyAccess(request: Request, env: Env): Promise<AccessResult> {
  if (!env.CF_ACCESS_AUD || !env.CF_ACCESS_TEAM) {
    return { ok: true, skipped: true };
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return { ok: false, reason: 'missing_assertion' };

  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed_jwt' };
  const [headerB64, payloadB64, sigB64] = parts;

  const header = decodeJsonSegment<JwtHeader>(headerB64);
  const payload = decodeJsonSegment<JwtPayload>(payloadB64);
  if (!header || !payload) return { ok: false, reason: 'undecodable' };
  if (header.alg !== 'RS256') return { ok: false, reason: 'bad_alg' };

  // Claim checks (cheap; done before crypto).
  const nowSec = Math.floor(Date.now() / 1000);
  const skew = 60; // allow modest clock skew
  if (typeof payload.exp !== 'number' || payload.exp + skew < nowSec) {
    return { ok: false, reason: 'expired' };
  }
  if (typeof payload.nbf === 'number' && payload.nbf - skew > nowSec) {
    return { ok: false, reason: 'not_yet_valid' };
  }
  if (!audMatches(payload.aud, env.CF_ACCESS_AUD)) {
    return { ok: false, reason: 'aud_mismatch' };
  }
  const expectedIss = `https://${teamHost(env.CF_ACCESS_TEAM)}`;
  if (payload.iss !== expectedIss) {
    return { ok: false, reason: 'iss_mismatch' };
  }

  // Signature verification against the team JWKS.
  let keys: RsaJwk[];
  try {
    keys = await fetchJwks(env.CF_ACCESS_TEAM);
  } catch {
    return { ok: false, reason: 'jwks_fetch_failed' };
  }
  const candidates = header.kid ? keys.filter((k) => k.kid === header.kid) : keys;
  if (candidates.length === 0) return { ok: false, reason: 'no_matching_kid' };

  const signed = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  let signature: Uint8Array;
  try {
    signature = base64UrlToBytes(sigB64);
  } catch {
    return { ok: false, reason: 'bad_signature_encoding' };
  }

  for (const jwk of candidates) {
    try {
      const key = await importRsaKey(jwk);
      const valid = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        key,
        signature as unknown as BufferSource,
        signed as unknown as BufferSource,
      );
      if (valid) return { ok: true };
    } catch {
      // try next key
    }
  }
  return { ok: false, reason: 'signature_invalid' };
}

/**
 * Convenience guard for routes: returns a 401 Response when verification fails,
 * or `null` when the caller may proceed.
 */
export async function requireAccess(request: Request, env: Env): Promise<Response | null> {
  const result = await verifyAccess(request, env);
  if (result.ok === false) {
    return json({ error: 'unauthorized', message: 'Access verification failed.' }, { status: 401 });
  }
  return null;
}

/**
 * Environment bindings for the MBFD Command Display edge gateway.
 *
 * Bound in wrangler.toml (`SNAPSHOTS`, the [vars] block) and via
 * `wrangler pages secret put` for secrets (HUB_DISPLAY_TOKEN, CF_ACCESS_*).
 */
export interface Env {
  /** Last-good snapshot store (degrade-never-blank). */
  SNAPSHOTS: KVNamespace;
  /** Hub origin the gateway fetches from, e.g. https://www.mbfdhub.com */
  HUB_BASE: string;
  /** Optional shared secret sent to the hub as `X-Display-Token`. */
  HUB_DISPLAY_TOKEN?: string;
  /** Snapshot TTL seconds (string from [vars]); defaults to 300. */
  SNAPSHOT_TTL_SECONDS?: string;
  /** AI snapshot TTL seconds (string from [vars]); defaults to 1800. */
  AI_SNAPSHOT_TTL_SECONDS?: string;
  /** Optional Cloudflare Access application AUD tag for JWT verification. */
  CF_ACCESS_AUD?: string;
  /** Optional Access team domain, e.g. darl.cloudflareaccess.com */
  CF_ACCESS_TEAM?: string;
}

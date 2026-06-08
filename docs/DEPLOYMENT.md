# Deployment

The display ships in two independent halves:

1. **The Cloudflare Pages app** (this repo) — SPA + the Functions edge gateway.
2. **The MBFDHub side** — the additive, read-only `/api/display/*` API in the Laravel app,
   deployed manually on the GMKtec homelab.

They are decoupled: deploying this repo never touches the hub, and the hub deploy is additive
(no schema change is required for this feature).

## Cloudflare Pages app

### Project

- Pages project name: `mbfd-command-display` (production branch `main`).
- Build command: `npm run build` (`tsc -b && vite build`).
- Build output directory: `dist` (set by `pages_build_output_dir` in
  [`wrangler.toml`](../wrangler.toml)).
- Functions in [`functions/`](../functions) are picked up and deployed automatically by Pages.

### Deploy

Two paths, both produce the same result:

```bash
# 1. CLI deploy (uploads the prebuilt dist + functions)
npm run build
npm run deploy        # wrangler pages deploy dist --project-name=mbfd-command-display

# 2. Git integration
git push origin main  # Pages git build runs `npm run build` and deploys dist
```

The committed `public/assets/stations/optimized/*` and `src/data/stationAssets.manifest.json`
mean the Pages git build runs **only** `npm run build` — it does not run the sharp image
pipeline. Regenerate assets locally with `npm run images` and commit the results when station
originals change (see [ASSET_PIPELINE.md](ASSET_PIPELINE.md)).

### KV namespace

The last-good snapshot store is bound as `SNAPSHOTS` in [`wrangler.toml`](../wrangler.toml):

```toml
[[kv_namespaces]]
binding = "SNAPSHOTS"
id = "10e91ca3b649480a97a239c98209816d"
```

If you ever need to recreate it:

```bash
wrangler kv namespace create mbfd_command_snapshots
# paste the returned id into wrangler.toml and bind for both production and preview
```

The same KV namespace also holds the short-lived resolved Ozolio stream URLs (`oz-<OID>` keys,
~75s soft TTL).

### Non-secret vars

Set in the `[vars]` block of [`wrangler.toml`](../wrangler.toml) (safe to commit):

| Var | Default | Meaning |
|-----|---------|---------|
| `HUB_BASE` | `https://www.mbfdhub.com` | Hub origin the gateway fetches from |
| `SNAPSHOT_TTL_SECONDS` | `300` | Edge + KV TTL for snapshot-class endpoints |
| `AI_SNAPSHOT_TTL_SECONDS` | `1800` | Edge + KV TTL for the AI brief |

### Secrets

Edge secrets are server-side only and never reach the browser. Set them with
`wrangler pages secret put` (or the Pages dashboard). **Never commit real values; refer to them
by name only.**

```bash
wrangler pages secret put HUB_BASE            # if overriding the [vars] default
wrangler pages secret put HUB_DISPLAY_TOKEN   # optional shared secret → X-Display-Token to the hub
wrangler pages secret put CF_ACCESS_AUD       # optional: Access application AUD tag (JWT verify)
wrangler pages secret put CF_ACCESS_TEAM      # optional: Access team domain (darl.cloudflareaccess.com)
```

Behavior of the optional secrets:

- `HUB_DISPLAY_TOKEN` — if set, [`fetchHub`](../functions/_shared/hubClient.ts) sends it as the
  `X-Display-Token` header so the hub can require a shared secret.
- `CF_ACCESS_AUD` + `CF_ACCESS_TEAM` — if **both** are set,
  [`requireAccess`](../functions/_shared/access.ts) verifies the `Cf-Access-Jwt-Assertion`
  header (RS256 against the team JWKS) inside the Function as belt-and-suspenders on top of the
  Access app. If they are absent, this in-Function check is skipped and Cloudflare Access at the
  edge remains the guard.

### Frontend (Vite) variables

Frontend variables are read from `.env` (see [`.env.example`](../.env.example)) and **baked
into the client bundle** — anything prefixed `VITE_` is public, so never put a secret there.

| Var | Purpose |
|-----|---------|
| `VITE_API_BASE` | API base path. Empty string in production (same-origin Functions). |
| `VITE_ORG_NAME` | Org label in the header. |
| `VITE_SENTRY_DSN` | Optional browser Sentry DSN (blank disables). |
| `VITE_DEV_HUB_PROXY` | Local dev only: origin the `vite dev` proxy forwards `/api` to. |

### Custom domain and Access

- Add `command.mbfdhub.com` as a custom domain on the Pages project (dashboard or API). The
  record is a proxied CNAME.
- A Cloudflare Access application gates `command.mbfdhub.com` to `@miamibeachfl.gov` via OTP,
  team `darl.cloudflareaccess.com`. This is the primary authentication boundary; the in-Function
  JWT check is optional defense-in-depth. See [SECURITY.md](SECURITY.md).

## MBFDHub side (manual, on the GMKtec box)

CI is billing-blocked, so the hub deploy is manual on the server. The display API lives in
MBFDHub at `routes/api.php` under `Route::prefix('display')`, guarded by the `display.readonly`
middleware and `throttle:120,1`. It is **additive** — it reuses existing services
(`CommandCenterAiService::gatherMetrics()` / `cachedSummary()`, the `StationOperationsHubWidget`
rollup logic read-only, and `Apparatus::getPmHealthStatus()`) and adds only cache hooks. **No
schema change is needed for this feature.**

Deploy procedure on the box (verify the current host and path first; the box has moved between
hosts):

```bash
# on the GMKtec homelab, in the MBFDHub working copy
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force        # none required for the display feature itself
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan filament:assets
# restart the app container
```

Deploys are **additive**: never reset or wipe the production database — it holds live admin
data. The display feature touches no write path on the hub.

## Verifying a deploy

```bash
# Edge liveness + hub reachability (always 200 from the edge)
curl -s https://command.mbfdhub.com/api/health        # behind Access; needs an Access token

# Provenance headers tell you where data came from
curl -sI https://command.mbfdhub.com/api/snapshot | grep -i x-display
# X-Display-Served-From: origin | snapshot | empty
# X-Display-Snapshot-Age: <seconds>   (present only when served from a snapshot)
```

A healthy production state serves `X-Display-Served-From: origin`. `snapshot` means the hub was
unreachable and the edge is serving last-good KV; `empty` means neither origin nor KV had data
(cold start during an outage).

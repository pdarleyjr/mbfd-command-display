# API Contract

The SPA calls **same-origin `/api/*`**, served by Cloudflare Functions
([`functions/`](../functions)). Each function fetches the hub's additive read-only
`/api/display/*` over the tunnel, adds edge caching + a KV last-good snapshot, and returns JSON.
Everything is **GET-only**.

## Edge → hub mapping

| SPA path (edge) | Hub path | Cache | Notes |
|---|---|---|---|
| `GET /api/snapshot` | `/api/display/snapshot` | 300s + KV | Full overview rollup |
| `GET /api/stations` | `/api/display/stations` | 300s + KV | Readiness grid |
| `GET /api/stations/:id` | `/api/display/stations/:id` | 300s + KV | Station detail |
| `GET /api/stations/:id/personnel` | `…/personnel` | 3600s + KV | Names (staff-only) |
| `GET /api/stations/:id/submissions` | `…/submissions` | 300s + KV | Recent submissions |
| `GET /api/critical-items` | `/api/display/critical-items` | 300s + KV | Defects + low stock |
| `GET /api/incidents` | `/api/display/incidents` | 30s + KV | PulsePoint proxy |
| `GET /api/ai-snapshot` | `/api/display/ai-snapshot` | passthrough 200/202/504 + KV | Descriptive brief |
| `GET /api/health` | hub `/up` + `/api/display/health` | no-store | `{ edge, hub_up }` |
| `GET /api/cameras/ozolio?oid=` | (resolver) | 75s | 302 → resolved `.m3u8` |
| `GET /api/cameras/news?key=` | (resolver) | — | 302 → public HLS master |

Response headers: `X-Display-Served-From: origin | snapshot | empty` and
`X-Display-Snapshot-Age` (seconds) so the UI shows a "cached"/age badge instead of going blank.

## Degrade-never-blank

`functions/_shared/cache.ts`: try edge cache → fetch hub (6s timeout) → on success cache to
`caches.default` + KV `SNAPSHOTS`; on hub failure serve KV last-good; if no KV, serve a safe
empty JSON. The browser also keeps sensitivity-aware local last-good data
([`usePersistentQuery`](../src/hooks/usePersistentQuery.ts)); personnel is never persisted in
browser storage.

## Auth (defense in depth)

1. **Cloudflare Access** gates `command.mbfdhub.com` and `mbfd-command-display.pages.dev` to
   `@miamibeachfl.gov` (email OTP). Browsers cannot reach the SPA or `/api/*` without it.
2. The gateway sends **`X-Display-Token`** (`HUB_DISPLAY_TOKEN`) to the hub. The hub's
   `display.token` middleware returns **403** to anyone hitting `/api/display/*` without it — so
   the personnel roster is never publicly reachable on the hub origin.
3. Optional gateway JWT verification of `Cf-Access-Jwt-Assertion` if `CF_ACCESS_AUD` +
   `CF_ACCESS_TEAM` are set (off by default; Access already protects the edge).

## Hub side (read-only, additive)

`Route::prefix('display')->middleware(['display.token','display.readonly','throttle:120,1'])`.
`display.readonly` returns 405 on any non-GET; a catch-all routes mutating verbs to
`DisplayController@methodNotAllowed` (a controller method, so `route:cache` works). Payloads are
redacted of VIN / Snipe-IT / notes / location / signatures / personnel identity, **except** the
dedicated personnel endpoint (token + Access gated). No schema change; reuses
`CommandCenterAiService`, the `StationOperationsHubWidget` rollup logic, `Apparatus::getPmHealthStatus()`,
and the PulsePoint proxy.

## Field-shape note (normalization)

The hub returns station readiness as **flat** fields on the snapshot grid
(`readiness_percent` / `readiness_status` / `readiness_reasons`) but as a **nested** object on
station-detail, and apparatus uses `open_defects_count`. The client reconciles both into one
nested shape in [`src/lib/normalize.ts`](../src/lib/normalize.ts) so components see a single
contract. See [`src/types/display.ts`](../src/types/display.ts) for the app-facing types.

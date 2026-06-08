# Architecture

The MBFD Command Display is a single-page React app served from Cloudflare Pages, with a
Cloudflare Functions edge gateway in front of the MBFDHub read-only API. It is engineered to
**never go blank** on a command wall, and to **never write** to the hub.

## High-level data flow

```
┌───────────────────────────┐
│  Browser SPA (React 19)   │  command.mbfdhub.com
│  - TanStack Query polling  │
│  - usePersistentQuery      │  localStorage last-good (12h)
└────────────┬──────────────┘
             │ GET /api/*  (same-origin; Access cookie attached)
             ▼
┌───────────────────────────┐
│  Cloudflare Functions      │  functions/
│  - /api/_middleware.ts     │  405 on non-GET; security headers
│  - per-endpoint routes     │  Access JWT verify (optional)
│  - cachedPassthrough       │  edge cache → KV last-good → empty
└────────────┬──────────────┘
             │ GET /api/display/*  (X-Display-Token optional)
             ▼  over the mbfdhub-gmktec Cloudflare Tunnel
┌───────────────────────────┐
│  MBFDHub (Laravel 11)      │  www.mbfdhub.com
│  - Route::prefix('display')│  display.readonly + throttle:120,1
│  - redacted, GET-only       │  reuses CommandCenterAiService, widgets
└───────────────────────────┘
```

## The SPA

- Entry: [`src/main.tsx`](../src/main.tsx) → [`src/app/App.tsx`](../src/app/App.tsx).
- Routing (React Router 6): `/` → [`CommandOverview`](../src/app/routes/CommandOverview.tsx),
  `/station/:number` → [`StationView`](../src/app/routes/StationView.tsx), `*` redirects to `/`.
- Server state lives in TanStack Query; UI preferences live in Zustand
  ([`uiStore`](../src/store/uiStore.ts) persisted to `localStorage` under `mbfd-command-ui`).
  Camera playback health lives in a separate tiny store
  ([`cameraHealthStore`](../src/store/cameraHealthStore.ts)) kept out of the React render path
  so frequent HLS state changes do not thrash component trees.

### Data hooks and poll cadence

[`src/hooks/useDisplayData.ts`](../src/hooks/useDisplayData.ts) defines one hook per endpoint,
each with a poll interval matched to the data's volatility:

| Hook | Path | `refetchInterval` |
|------|------|-------------------|
| `useDisplaySnapshot` | `/api/snapshot` | 30s |
| `useStations` | `/api/stations` | 60s |
| `useStationDetail` | `/api/stations/:id` | 30s |
| `useStationPersonnel` | `/api/stations/:id/personnel` | 300s |
| `useStationSubmissions` | `/api/stations/:id/submissions` | 60s |
| `useIncidents` | `/api/incidents` | 30s |
| `useAiSnapshot` | `/api/ai-snapshot` | 60s (treats 202 + 504 as success) |

All hooks ride on [`usePersistentQuery`](../src/hooks/usePersistentQuery.ts), which hydrates
each query's `initialData` from a localStorage last-good envelope so a panel paints real data
immediately on a cold start, then re-persists every fresh origin/edge payload.

## The edge gateway (`functions/`)

The gateway is the only thing that talks to the hub, and it does so GET-only. Routes are thin;
the shared modules carry the behavior.

### Shared modules

| Module | Responsibility |
|--------|----------------|
| [`_shared/env.ts`](../functions/_shared/env.ts) | Typed `Env` binding (KV `SNAPSHOTS`, `HUB_BASE`, optional secrets) |
| [`_shared/response.ts`](../functions/_shared/response.ts) | `json()`, `securityHeaders()`, `methodNotAllowed()`, provenance header names |
| [`_shared/hubClient.ts`](../functions/_shared/hubClient.ts) | `fetchHub()` — GET-only, 6s default timeout, adds `X-Display-Token` if set |
| [`_shared/cache.ts`](../functions/_shared/cache.ts) | `cachedPassthrough()` — the degrade-never-blank engine |
| [`_shared/access.ts`](../functions/_shared/access.ts) | `requireAccess()` — optional Access JWT verification (Web Crypto, RS256) |
| [`_shared/route.ts`](../functions/_shared/route.ts) | `passthroughRoute()` (Access → cache) and the `block` 405 handler |
| [`_shared/params.ts`](../functions/_shared/params.ts) | `positiveIntParam()` — validates `:id` before interpolation |

### Read-only contract

Two layers enforce GET-only at the edge:

1. [`functions/api/_middleware.ts`](../functions/api/_middleware.ts) — runs on every `/api/*`
   request. `OPTIONS` → 204 with `Allow: GET, HEAD, OPTIONS`; anything other than `GET`/`HEAD`
   → 405 JSON; otherwise passes through and stamps `securityHeaders()` onto the route response.
2. Each route also exports `onRequestPost/Put/Patch/Delete = block` (the shared 405 handler) as
   defense-in-depth, so a write verb can never reach `fetchHub`.

`fetchHub` itself only ever issues `method: 'GET'`. The chain makes a write upstream
structurally impossible.

## Degrade-never-blank

The core idea: a chief looking at the wall should **never** see an empty screen, even if the
hub is briefly down. There are three layers of last-good, applied in order by
[`cachedPassthrough`](../functions/_shared/cache.ts):

1. **Edge cache** (`caches.default`) — a cache hit returns immediately.
2. **Live origin** — fetch the hub; on a 2xx JSON response, return it and (via `waitUntil`)
   write it both to the edge cache and to KV as a last-good envelope `{ at, data }`. Header:
   `X-Display-Served-From: origin`.
3. **KV last-good snapshot** — if the hub is down/non-2xx, read the last-good envelope from KV
   (binding `SNAPSHOTS`, namespace `10e91ca3...`), compute its age, and serve it with
   `X-Display-Served-From: snapshot` + `X-Display-Snapshot-Age: <seconds>`.
4. **Safe empty JSON** — if KV has nothing either, return the route's `emptyFallback` (a valid
   but zeroed shape) with `X-Display-Served-From: empty`.

KV last-good is written with a TTL of `max(ttl * 12, 3600)` seconds so it survives a long
outage well past the serve TTL.

On top of the edge, the browser's [`usePersistentQuery`](../src/hooks/usePersistentQuery.ts) +
[`persistentCache`](../src/lib/persistentCache.ts) keep a localStorage last-good (12h max age)
so even a hard refresh while the edge is unreachable still paints the previous good data, then
the SPA labels it `persisted`. The [`apiClient`](../src/lib/apiClient.ts) reads the
`X-Display-Served-From` / `X-Display-Snapshot-Age` headers and surfaces provenance to the UI,
which renders a freshness badge instead of ever showing a spinner-only screen.

### Status-aware routes

Most routes use the plain passthrough. Two are status-aware:

- [`api/incidents.ts`](../functions/api/incidents.ts) — tries `/api/display/incidents`, falls
  back to `/api/incidents` on a 404, short 30s TTL (PulsePoint changes fast).
- [`api/ai-snapshot.ts`](../functions/api/ai-snapshot.ts) — 200 caches; 202 (generating) prefers
  a prior KV brief else passes the 202 through; 504/down serves KV last-good else a synthetic
  "temporarily unavailable" descriptive brief. See [AI_BRIEFING.md](AI_BRIEFING.md).
- [`api/health.ts`](../functions/api/health.ts) — never cached; probes the hub's `/up` and
  `/api/display/health`; always returns 200 with `hub_up` reflecting upstream reachability.

## Responsive regimes

The same DOM reflows from a laptop to a 12372x2160 video wall.
[`src/lib/layoutRegime.ts`](../src/lib/layoutRegime.ts) classifies the viewport into
`compact | desktop | wide | ultrawide | wall | portrait` and applies a `--type-scale`
custom property (0.92 → 1.9) plus `data-regime` / `data-display` attributes on `<html>`. Wide,
ultrawide, and wall regimes are **no-scroll** display modes (`isNoScrollRegime`), so the wall is
glance-first and never requires scrolling. Operators can also force display mode via
[`uiStore`](../src/store/uiStore.ts).

## Spatial Operations Map (WebGL) with graceful fallback

The overview hosts a 3D relational map of Miami Beach built with React Three Fiber. The scene
([`SpatialCommandScene`](../src/components/three/SpatialCommandScene.tsx)) composes terrain,
territory bands, station nodes, incident pings, a marine layer, a sparse relational network, a
restrained bloom, and a very slow auto-orbit. It is purely spatial — all operational text lives
in HTML overlays, never baked into the canvas.

Capability detection lives in [`src/lib/webgl.ts`](../src/lib/webgl.ts) and is surfaced through
[`useEnvironment`](../src/hooks/useEnvironment.ts):

- `detectWebGL()` probes a real WebGL2 (then WebGL1) context once.
- `recommendedQuality()` heuristically returns `high` or `low` from `hardwareConcurrency` and
  `deviceMemory` (a kiosk/tablet degrades to `low`).
- `prefersReducedMotion()` honors the OS setting; the [`uiStore`](../src/store/uiStore.ts) adds
  a manual motion/quality override (`auto | on | off` / `high | low | off`).

Postprocessing and auto-orbit run only on `high` quality with motion enabled. Under reduced
motion the orbit and shimmer stop. The ambient backdrop
([`CommandShell`](../src/components/command/CommandShell.tsx)) is lazy-loaded and wrapped in an
`ErrorBoundary` with a `null` fallback, so it never blocks first paint or the data, and a WebGL
failure degrades to a 2D / static presentation rather than a black canvas.

## Design system

"Command Glass" — a dark smart-city / restrained-JARVIS aesthetic. The single source of truth
at runtime is [`src/styles/tokens.css`](../src/styles/tokens.css) (CSS custom properties for
color, depth, type scale, spacing, motion, and a z-index ladder);
[`tailwind.config.js`](../tailwind.config.js) mirrors the color literals so Tailwind utilities
resolve at build time. Status color is **never used alone** — it is always paired with an icon
and a label (see [`readinessVisual`](../src/lib/readiness.ts) glyphs).

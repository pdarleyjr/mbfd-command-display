# MBFD Command Display

A read-only command display for Miami Beach Fire Department chiefs and admins, served at
**command.mbfdhub.com** behind Cloudflare Access. It presents a glance-first operational
picture of all stations: readiness, apparatus, personnel, open defects, equipment requests,
recent submissions, live PulsePoint runs, verified live cameras, marine telemetry, and a
descriptive AI brief.

This app **consumes** MBFDHub data. It never writes. It does not touch the hub's `/admin`
Filament panel, employee submission/approval flows, or any production write path. Every call
it makes upstream is a GET against the hub's additive, redacted `/api/display/*` API.

> Read-only by construction. The edge gateway only ever issues GET to the hub, the `/api`
> middleware returns 405 on any non-GET verb, and the hub side is guarded by a
> `display.readonly` middleware that 405s non-GET requests. See [docs/SECURITY.md](docs/SECURITY.md).

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite 6 · React 19 · TypeScript · Tailwind 3 · TanStack Query · Zustand · React Router 6 |
| Motion | CSS transitions/animations with reduced-motion support |
| Video | lazy-loaded hls.js (Ozolio + news HLS), YouTube-nocookie embeds |
| Edge | Cloudflare Pages · Functions (`functions/`) · KV (last-good snapshots) |
| Access | Cloudflare Access (staff-only, `@miamibeachfl.gov`, team `darl.cloudflareaccess.com`) |

## How it fits together

```
Browser (SPA)                Cloudflare edge                    MBFDHub (GMKtec)
command.mbfdhub.com          (Pages Functions)                  www.mbfdhub.com
  │                              │                                 │
  │  GET /api/snapshot           │                                 │
  ├─────────────────────────────▶  edge cache → KV last-good      │
  │   (Access cookie rides along)  │  ──── GET /api/display/* ─────▶  display.readonly
  │                              │  ◀──── redacted JSON ───────────  throttle:120,1
  │  ◀─ JSON + X-Display-* ──────┤   (over mbfdhub-gmktec tunnel)   │
  │     headers                  │                                 │
```

The SPA calls **same-origin** `/api/*`. Cloudflare Functions in `functions/` are the edge
gateway: they verify Access (defense-in-depth), fetch the hub's `/api/display/*`, and apply a
degrade-never-blank strategy (edge cache, then a last-good KV snapshot, then a safe empty
JSON). The browser keeps its own localStorage last-good on top of that. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Quickstart

Requires Node 20+ and npm.

```bash
npm install            # install dependencies

# Local development
npm run dev            # Vite dev server on http://localhost:5180
                       # /api/* is proxied to VITE_DEV_HUB_PROXY (default https://www.mbfdhub.com)

# Optional: run with the real edge gateway locally
npx wrangler pages dev -- npm run dev   # Functions handle /api/* instead of the Vite proxy

# Asset pipeline (only when station originals change)
npm run images         # optimize public/assets/stations/original/*.png → variants + manifest

# Quality
npm run typecheck      # tsc -b
npm run lint           # eslint

# Build + deploy
npm run build          # tsc -b && vite build → ./dist
npm run deploy         # wrangler pages deploy dist --project-name=mbfd-command-display
```

Copy `.env.example` to `.env` for local frontend variables. **Never put secrets in `.env`** —
anything prefixed `VITE_` is baked into the client bundle. Edge secrets (`HUB_BASE`,
`HUB_DISPLAY_TOKEN`, `CF_ACCESS_AUD`, `CF_ACCESS_TEAM`) are set with `wrangler pages secret put`.
See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Project structure

```
mbfd-command-display/
├── index.html                 # SPA shell (noindex, dark, theme #0B1220)
├── vite.config.ts             # Vite 6 + dev /api proxy + manual chunks
├── wrangler.toml              # Pages + Functions config; SNAPSHOTS KV binding; [vars]
├── tailwind.config.js         # "Command Glass" design system (mirrors tokens.css)
├── .env.example               # frontend vars + names of edge secrets (no values)
├── scripts/
│   └── optimize-images.mjs    # sharp pipeline → optimized variants + manifest
├── public/assets/stations/
│   ├── original/              # source PNGs (admin, fire_station_1..6)
│   └── optimized/             # generated AVIF/WebP/PNG crops (committed)
├── functions/                 # Cloudflare Pages Functions — the edge gateway
│   ├── api/_middleware.ts     # read-only contract (405 non-GET) + security headers
│   ├── api/*.ts               # one route per display endpoint
│   ├── api/cameras/*.ts       # Ozolio + news camera resolvers (302 redirects)
│   └── _shared/               # env, access (JWT), cache (KV), hubClient, response, route
└── src/
    ├── app/                   # App.tsx + routes (CommandOverview, StationView)
    ├── components/            # command/, station/, common/, three/
    ├── data/                  # stationTerritories, stationCameraCatalog, stationAssets
    ├── hooks/                 # useDisplayData, usePersistentQuery, useEnvironment
    ├── lib/                   # apiClient, cameraResolver, readiness, sourceFreshness, etc.
    ├── store/                 # uiStore, cameraHealthStore (Zustand)
    ├── styles/                # tokens.css, command-glass.css, layout.css
    └── types/display.ts       # the read-only API type contract
```

## Documentation

| Doc | What it covers |
|-----|----------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Data flow, edge gateway, degrade-never-blank, responsive regimes, 2D map |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Cloudflare Pages build/deploy, KV, secrets, custom domain, hub-side deploy |
| [docs/SECURITY.md](docs/SECURITY.md) | Access, GET-only boundary, redaction, the hard `/admin` boundary, threat model |
| [docs/CAMERA_SOURCES.md](docs/CAMERA_SOURCES.md) | Per-station camera mapping, resolvers, fallback ladder, honest gaps |
| [docs/STATION_TERRITORIES.md](docs/STATION_TERRITORIES.md) | Station boundaries, approximate map geometry, marine territory |
| [docs/API_CONTRACT.md](docs/API_CONTRACT.md) | Edge endpoints, edge→hub path mapping, response shapes, provenance headers |
| [docs/AI_BRIEFING.md](docs/AI_BRIEFING.md) | Descriptive-only AI brief: schema, status codes, what is forbidden |
| [docs/ASSET_PIPELINE.md](docs/ASSET_PIPELINE.md) | The `npm run images` sharp pipeline, variants, LQIP, manifest |
| [docs/OPERATIONS.md](docs/OPERATIONS.md) | Running the wall, display mode, source-health bar, troubleshooting |

## License / scope

Internal Miami Beach Fire Department operations tool. Not for public distribution.

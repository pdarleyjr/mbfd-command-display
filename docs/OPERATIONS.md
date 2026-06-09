# Operations

Runbook for the MBFD Command Display.

## URLs

- **Production:** https://command.mbfdhub.com (Cloudflare Access, `@miamibeachfl.gov` OTP)
- **Pages default:** https://mbfd-command-display.pages.dev (also Access-gated)
- **Hub origin (data):** `https://www.mbfdhub.com/api/display/*` (token-guarded; 403 without `X-Display-Token`)

## Local development

```bash
npm install
npm run dev        # Vite dev server (proxies /api to VITE_DEV_HUB_PROXY)
npm run build      # tsc -b + vite build -> dist/
npm run typecheck  # tsc -b
npm run lint       # eslint
```

Full edge behavior locally (functions + KV + last-good), pointing at the live hub:

```bash
# .dev.vars (gitignored): HUB_BASE + HUB_DISPLAY_TOKEN
npm run build
npx wrangler pages dev dist --kv SNAPSHOTS --compatibility-date=2026-06-01
# then hit http://127.0.0.1:8788/api/snapshot  (expect X-Display-Served-From: origin)
```

## Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md). In short: `npm run build` then
`wrangler pages deploy dist --project-name mbfd-command-display --branch main`. Pages secrets:
`HUB_DISPLAY_TOKEN` (required), optional `CF_ACCESS_AUD` / `CF_ACCESS_TEAM`. `HUB_BASE` and TTLs
are vars in `wrangler.toml`. The hub side (`/api/display/*`) deploys with the hub repo
(see DEPLOYMENT.md hub section).

## Display controls (header)

- **Wall** — toggle no-scroll kiosk mode (auto-on for ultrawide/wall regimes).
- **Motion** — force reduced motion (also honors `prefers-reduced-motion`).
- The map is always the accessible 2D schematic; no WebGL/GPU mode is shipped.

Layout regimes (`compact / desktop / wide / ultrawide / wall / portrait`) are auto-detected and
set the type scale; the same DOM serves a laptop and a 12372×2160 wall.

## Monitoring / health

- **Source health bar** (bottom): Hub / AI / Incidents up state, camera live·degraded·offline
  counts, hub deploy SHA, and the served-from/age badge.
- **Edge health:** `GET https://command.mbfdhub.com/api/health` → `{ edge:"up", hub_up:bool }`.

## Troubleshooting

| Symptom | Likely cause | Action |
|---|---|---|
| Whole site → Access login | Working as designed | Sign in with an `@miamibeachfl.gov` email (OTP) |
| Panels show "Cached · …" badge | Hub briefly unreachable | Edge is serving KV last-good; recovers automatically |
| All stations show readiness ~30% "0 checked out today" | No apparatus checkouts logged today | Real data; readiness weights checkout 40% — expected until checkouts post |
| AI brief stuck "Generating…" | Queue worker not running / model cold-loading | Ensure the hub queue worker is up; first qwen3.6 call can take ~45s |
| Camera tile "Reconnecting/Unavailable" | Ozolio relay rotated / source down | Tile self-heals through its fallback ladder; manual reload in dev mode |
| Old app shell persists after deploy | Legacy service worker/browser cache | Visit `/cache-bust` or `?cache-bust=1`; the app unregisters old SWs and clears display caches |
| Hub `/api/display/*` returns 403 publicly | `display.token` enforcement (expected) | Only the edge gateway (with `HUB_DISPLAY_TOKEN`) may call it |
| `route:cache` fails on hub deploy | A closure in routes | Display routes are closure-free; check other route files |

## Secrets

- `HUB_DISPLAY_TOKEN` — Cloudflare Pages secret (display project). Must equal the hub's
  `DISPLAY_API_TOKEN` (`/opt/mbfd/mbfd-hub/.env`). Rotate both together, then `config:cache` +
  restart the hub container and redeploy the display.
- Never commit secrets. `.dev.vars`, `.env*` (except `.env.example`) are gitignored.

# Asset Pipeline

Station imagery is optimized at author time (not at runtime) by
[`scripts/optimize-images.mjs`](../scripts/optimize-images.mjs) using `sharp`.

## Inputs and outputs

- **Originals** (committed): `public/assets/stations/original/{admin,fire_station_1..4,fire_station_6}.png`
- **Optimized** (committed): `public/assets/stations/optimized/<key>/<variant>.<fmt>`
- **Manifest** (committed, imported by the app): `src/data/stationAssets.manifest.json`

Run:

```bash
npm run images   # idempotent; safe to re-run after replacing an original
```

## Variants per image

| Variant | Size | Formats |
|---|---|---|
| `full` | ≤2000w | AVIF, WebP, PNG |
| `hero` | 1920×1080 cover | AVIF, WebP |
| `wide` | 2560×1080 cover | AVIF, WebP |
| `square` | 600×600 cover | WebP |
| `portrait` | 1080×1920 cover | AVIF, WebP |

Each manifest entry also carries a blurred inline **LQIP** (`data:` URI) and the **dominant
color** hex, so cards/heroes paint instantly and never flash empty.

## Usage in the app

[`src/data/stationAssets.ts`](../src/data/stationAssets.ts) types the manifest and exposes
`assetForStation(n)`, `adminAsset`, and `bestSrc(asset, variant)` (prefers AVIF → WebP → PNG).
[`StationImage`](../src/components/common/StationImage.tsx) renders a `<picture>` with the AVIF/
WebP/PNG sources over the LQIP + dominant color, with a readable dark scrim (and an optional
`backdrop` blur/desaturate when used behind text).

Image usage:
- Station cards/thumbnails (square), station detail hero (hero), and dimmed station backdrops
  textures (optional), and camera fallback posters.
- `admin.png` backs the overview hero / loading skeleton background.

## Why committed (not built on Pages)

The Cloudflare Pages git build runs only `npm run build`. Committing the optimized variants keeps
the deploy deterministic (no `sharp` step required in CI). Re-run `npm run images` locally and
commit when a source image changes.

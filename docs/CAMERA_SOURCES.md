# Camera Sources

Live camera catalog for the display. Source of truth:
[`src/data/stationCameraCatalog.ts`](../src/data/stationCameraCatalog.ts). Every feed marked
`verified: true` was confirmed live + embeddable from internal sources (media-control catalog +
mbfd-ops-wall) on 2026-06-06 and 2026-06-08. **No cameras are invented**; real gaps are surfaced.

## Source types and how they play

Resolution happens in [`src/lib/cameraResolver.ts`](../src/lib/cameraResolver.ts); the tile is
[`CameraTile`](../src/components/command/CameraTile.tsx).

| `sourceType` | Resolution | Notes |
|---|---|---|
| `youtube` | `youtube-nocookie.com/embed/<id>` | Embeddable on any origin; no relay dependency |
| `iframe` (Ozolio) | edge `GET /api/cameras/ozolio?oid=EMB_…` 302-redirects to the resolved `.m3u8`; played with hls.js | Bare Ozolio embed is host-gated, so the gateway resolves it server-side (`init`→`open`, `document=miamiandbeaches.com`) |
| `hls` (news) | public `directHls` master, or edge `GET /api/cameras/news?key=…` | media-control `hls.html` wrapper is the iframe fallback |
| `telemetry` | keyless JSON (Open-Meteo marine, NOAA tides) | Rendered as a data card, not video ([`MarineTelemetryCard`](../src/components/command/MarineTelemetryCard.tsx)) |

## Fallback ladder (never a black frame)

Each tile escalates: **live media → media-control iframe wrapper → last-good poster → "Source
unavailable" tile** (with the last-healthy timestamp). Health (`live`/`reconnecting`/`stale`/
`offline`) is reported to [`cameraHealthStore`](../src/store/cameraHealthStore.ts) and summarized
in the source-health bar.

## Per-station mapping (verified)

- **Station 1** — Ocean Drive (South Beach, Avalon), 1st St Beach / Ocean Rescue, ZeroEight, Ocean Drive (YouTube).
- **Station 2** — W South Beach · 21st St, Lincoln Road, Grand Hyatt · Convention Center.
- **Station 3** — **GAP: no verified in-territory feed.** Surfaced honestly in the station view.
- **Station 4** — North-adjacent context only (Newport Pier, Acqualina, Sunny Isles); flagged `contextOnly`.
- **Station 6 (Marine)** — Biscayne Bay & PortMiami (primary), MacArthur Causeway & Skyline,
  PortMiami Cruise/Terminals, Biscayne Bay North; **telemetry**: Open-Meteo marine (waves/SST) +
  NOAA tide station 8723170.
- **Department-wide news (HLS)** — MBTV, CBS News Miami, Local 10 (not station-mapped).

The overview shows ~4 curated feeds (`overviewCameras()` — South Beach, Marine, Mid-Beach, North).

## Considered and rejected

- **FDOT / FL511 / DIVAS** — live HLS is token-gated (401, no CORS); only ~60s JPEGs are public; dropped in favor of YouTube skyline streams.
- **EarthCam, PTZtv (embed-disabled), Ozolio `/explore/` host pages** — not bare-embeddable.

## Verification

Re-verify with the workflow notes in the media-control repo. A camera flips to a fallback
automatically if its source goes offline; check the source-health bar (`live / degraded / offline`).

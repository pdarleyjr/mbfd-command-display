# Station Territories

MBFD response areas as used by the display's spatial map and per-station camera mapping.
Source of truth: [`src/data/stationTerritories.ts`](../src/data/stationTerritories.ts).

| Station | Name | Territory | Marine |
|--------|------|-----------|:------:|
| 1 | South Beach | Government Cut → 14th St, ocean to Intracoastal (South Pointe, Ocean Drive) | — |
| 2 | Mid-Beach South | 15th St → 41st St, incl. Julia Tuttle Causeway (Lincoln Rd, Collins, Convention Center) | — |
| 3 | Mid-Beach | 41st St → 64th St (Eden Roc / Fontainebleau corridor) | — |
| 4 | North Beach | 65th St → 87th Ct (North Beach, Indian Creek) | — |
| 6 | Marine | MacArthur Causeway, PortMiami, Government Cut, Biscayne Bay, offshore | ⚓ |

## Coordinates are approximate

`centroid` (approximate station-house lat/lng) and `band` (south/north latitude pair) exist
**only** to lay out the relational map. They are **not** survey-grade and are never presented
as exact dispatch geometry. `MIAMI_BEACH_BOUNDS` frames the island; `projectToMap(lat, lng)`
returns a normalized `{x, y}` in 0..1 (x = east-west, y = south-north flipped for screen) so
the 2D SVG schematic can place nodes/bands without a real geographic projection.

When the hub returns real `latitude`/`longitude` for a station they are used; otherwise the
map falls back to the territory `centroid`. (In the current production schema lat/long are
null, so centroids drive the map.)

## How territories are used

- **Spatial map** — one colored band per non-marine station across its latitude range; a node
  per station at its mapped position, height/color scaled by readiness; the marine layer sits on
  the bay (west) side for Station 6.
- **Station runs filter** — PulsePoint incidents with coordinates inside a station's `band` are
  attributed to that station; incidents without coordinates are kept (cannot be localized) so
  nothing is silently dropped. See [`StationRunsPanel`](../src/components/station/StationRunsPanel.tsx).
- **Cameras** — `stationCameraCatalog` maps feeds to `stationIds` by territory geography. See
  [CAMERA_SOURCES.md](./CAMERA_SOURCES.md).

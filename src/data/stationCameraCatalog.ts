/**
 * MBFD station ↔ live-camera catalog.
 *
 * Extracted from verified internal sources (media-control camera-feeds-catalog @ main
 * + mbfd-ops-wall src/data/cams.ts), liveness/embeddability-verified 2026-06-06 & 2026-06-08.
 * Only feeds confirmed live + embeddable are marked `verified: true`. NO cameras invented.
 *
 * Playback strategy (see cameraResolver.ts):
 *  • ozolio   → media-control wrapper iframe (no direct browser HLS/CORS noise)
 *  • hls      → media-control wrapper iframe for MBTV (no direct browser HLS/CORS noise)
 *  • telemetry→ keyless JSON (marine / tides), rendered as a data card, not video.
 *
 * Honest gaps: Station 3 (41st–64th) and Station 4 (North Beach) currently have no verified
 * Miami Beach-origin live feed. Out-of-city context feeds are intentionally excluded.
 */

export type CamSourceType = 'hls' | 'iframe' | 'image' | 'external' | 'telemetry';
export type CamHealth = 'unknown' | 'live' | 'reconnecting' | 'stale' | 'offline';

export interface StationCamera {
  id: string;
  displayName: string;
  stationIds: number[];
  territoryLabel: string;
  sourceProvider: string;
  sourceType: CamSourceType;
  priority: number;
  /** Ozolio embed object id (EMB_…), when sourceType === 'ozolio'/'iframe'. */
  oid?: string;
  /** News channel key understood by the media-control HLS proxy. */
  newsKey?: string;
  /** Telemetry JSON endpoint (marine/tides). */
  telemetryUrl?: string;
  /** media-control wrapper page (secondary playback path / iframe fallback). */
  wrapperUrl?: string;
  posterUrl: string | null;
  refreshSeconds: number | null;
  verified: boolean;
  /** Adjacency-only / out-of-territory context (not a true in-territory feed). */
  contextOnly?: boolean;
  notes: string;
}

const MC = 'https://media.mbfdhub.com';
const ozPoster = (oid: string) => `https://relay.ozolio.com/pub.api?cmd=poster&oid=${oid}`;
const ozWrap = (oid: string, label: string) =>
  `${MC}/player/oz.html?oid=${oid}&label=${encodeURIComponent(label)}`;
const newsWrap = (key: string, label: string) =>
  `${MC}/player/hls.html?station=${key}&label=${encodeURIComponent(label)}`;

export const stationCameraCatalog: StationCamera[] = [
  // ── Station 1 — Government Cut → 14th St ──────────────────────────────────
  {
    id: 'oz-ocean-drive-sb',
    displayName: 'Ocean Drive · South Beach',
    stationIds: [1],
    territoryLabel: 'Ocean Drive / South Beach',
    sourceProvider: 'Ozolio',
    sourceType: 'iframe',
    priority: 1,
    oid: 'EMB_RANL0000044E',
    posterUrl: ozPoster('EMB_RANL0000044E'),
    wrapperUrl: ozWrap('EMB_RANL0000044E', 'Ocean Drive · South Beach'),
    refreshSeconds: 90,
    verified: true,
    notes: 'In media-control AND ops-wall (ops-wall default cam).',
  },
  {
    id: 'oz-ocean-drive-avalon',
    displayName: 'Ocean Drive · Avalon',
    stationIds: [1],
    territoryLabel: 'Ocean Drive (Avalon Hotel)',
    sourceProvider: 'Ozolio',
    sourceType: 'iframe',
    priority: 2,
    oid: 'EMB_DRHL00000E71',
    posterUrl: ozPoster('EMB_DRHL00000E71'),
    wrapperUrl: ozWrap('EMB_DRHL00000E71', 'Ocean Drive · Avalon'),
    refreshSeconds: 90,
    verified: true,
    notes: '',
  },
  {
    id: 'oz-1st-street-rescue',
    displayName: '1st Street Beach · Ocean Rescue',
    stationIds: [1],
    territoryLabel: 'South Pointe / 1st St Beach',
    sourceProvider: 'Ozolio',
    sourceType: 'iframe',
    priority: 3,
    oid: 'EMB_ZUKF00000B65',
    posterUrl: ozPoster('EMB_ZUKF00000B65'),
    wrapperUrl: ozWrap('EMB_ZUKF00000B65', '1st Street Beach · Ocean Rescue'),
    refreshSeconds: 90,
    verified: true,
    notes: '',
  },
  // ── Station 2 — 15th St → 41st St ─────────────────────────────────────────
  {
    id: 'oz-w-southbeach-21st',
    displayName: 'W South Beach · 21st St',
    stationIds: [2],
    territoryLabel: '21st St / Collins',
    sourceProvider: 'Ozolio',
    sourceType: 'iframe',
    priority: 1,
    oid: 'EMB_QHQT0000039A',
    posterUrl: ozPoster('EMB_QHQT0000039A'),
    wrapperUrl: ozWrap('EMB_QHQT0000039A', 'W South Beach · 21st St'),
    refreshSeconds: 90,
    verified: true,
    notes: 'In both catalogs.',
  },
  {
    id: 'oz-lincoln-road',
    displayName: 'Lincoln Road',
    stationIds: [2],
    territoryLabel: 'Lincoln Road Mall',
    sourceProvider: 'Ozolio',
    sourceType: 'iframe',
    priority: 2,
    oid: 'EMB_TRVY0000040D',
    posterUrl: ozPoster('EMB_TRVY0000040D'),
    wrapperUrl: ozWrap('EMB_TRVY0000040D', 'Lincoln Road'),
    refreshSeconds: 90,
    verified: true,
    notes: 'ops-wall default cam; not in media-control 2026-06-08 sweep but resolver-proven.',
  },
  {
    id: 'oz-grand-hyatt-cc',
    displayName: 'Grand Hyatt · Convention Center',
    stationIds: [2],
    territoryLabel: 'Convention Center District (17th St)',
    sourceProvider: 'Ozolio',
    sourceType: 'iframe',
    priority: 3,
    oid: 'EMB_VKAD00001371',
    posterUrl: ozPoster('EMB_VKAD00001371'),
    wrapperUrl: ozWrap('EMB_VKAD00001371', 'Grand Hyatt · Convention Center'),
    refreshSeconds: 90,
    verified: true,
    notes: '',
  },

  // ── Station 3 — 41st St → 64th St ─────────────────────────────────────────
  // GAP: no verified internal feed inside this territory. Surfaced in the UI, not faked.

  // ── Station 4 — 65th St → 87th Ct (North Beach) ───────────────────────────
  // GAP: no verified Miami Beach-origin feed. Newport / Sunny Isles feeds removed by policy.

  // ── Station 6 — MARINE (MacArthur, PortMiami, Gov Cut, Biscayne Bay) ───────
  {
    id: 'oz-biscayne-portmiami',
    displayName: 'Biscayne Bay & PortMiami',
    stationIds: [6],
    territoryLabel: 'Biscayne Bay / PortMiami / Gov Cut',
    sourceProvider: 'Ozolio',
    sourceType: 'iframe',
    priority: 1,
    oid: 'EMB_FDVN00000417',
    posterUrl: ozPoster('EMB_FDVN00000417'),
    wrapperUrl: ozWrap('EMB_FDVN00000417', 'Biscayne Bay & PortMiami'),
    refreshSeconds: 90,
    verified: true,
    notes: 'PRIMARY marine cam for FB6 / Biscayne Bay context.',
  },
  {
    id: 'tel-marine-open-meteo',
    displayName: 'Marine Conditions (wave / SST)',
    stationIds: [6],
    territoryLabel: 'Miami Beach offshore',
    sourceProvider: 'Open-Meteo',
    sourceType: 'telemetry',
    priority: 10,
    telemetryUrl:
      'https://marine-api.open-meteo.com/v1/marine?latitude=25.7907&longitude=-80.13&current=wave_height,sea_surface_temperature,wave_direction,wave_period&temperature_unit=fahrenheit&length_unit=imperial&timezone=America%2FNew_York&forecast_days=1',
    posterUrl: null,
    refreshSeconds: 600,
    verified: true,
    notes: 'Keyless JSON. Wave height/period/direction + sea-surface temp. Not a camera.',
  },
  {
    id: 'tel-tides-noaa-8723170',
    displayName: 'Tides · NOAA Virginia Key',
    stationIds: [6],
    territoryLabel: 'Biscayne Bay (NOAA 8723170)',
    sourceProvider: 'NOAA',
    sourceType: 'telemetry',
    priority: 11,
    telemetryUrl:
      'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=today&station=8723170&product=predictions&datum=MLLW&interval=hilo&units=english&time_zone=lst_ldt&format=json&application=MBFD_Command_Display',
    posterUrl: null,
    refreshSeconds: 3600,
    verified: true,
    notes: 'Keyless JSON. Hi/lo tide predictions. Not a camera.',
  },

  // ── Miami Beach city channel (HLS) — not station-mapped ───────────────────
  {
    id: 'news-mbtv',
    displayName: 'MBTV · Miami Beach',
    stationIds: [1, 2, 3, 4, 6],
    territoryLabel: 'Miami Beach gov channel',
    sourceProvider: 'MBTV',
    sourceType: 'hls',
    priority: 1,
    newsKey: 'mbtv',
    wrapperUrl: newsWrap('mbtv', 'MBTV · Miami Beach'),
    posterUrl: null,
    refreshSeconds: 90,
    verified: true,
    notes: 'City gov channel — leads the news folder.',
  },
];

/** Cameras whose territory includes the given station number (excludes context-only by default). */
export function camerasForStation(stationNumber: number, includeContext = true): StationCamera[] {
  return stationCameraCatalog
    .filter((c) => c.stationIds.includes(stationNumber))
    .filter((c) => includeContext || !c.contextOnly)
    .sort((a, b) => a.priority - b.priority);
}

/** A curated ~4-up set for the overview: one strong feed per territory, video first. */
export function overviewCameras(count = 4): StationCamera[] {
  const picks: StationCamera[] = [];
  const wantOrder = [1, 2, 6]; // South Beach, Mid-Beach, Marine. No out-of-city fillers.
  for (const n of wantOrder) {
    const cam = stationCameraCatalog
      .filter((c) => c.stationIds.includes(n) && c.sourceType !== 'telemetry' && c.verified)
      .sort((a, b) => a.priority - b.priority)[0];
    if (cam && !picks.find((p) => p.id === cam.id)) picks.push(cam);
  }
  const mbtv = stationCameraCatalog.find((c) => c.id === 'news-mbtv');
  if (mbtv && !picks.find((p) => p.id === mbtv.id)) picks.push(mbtv);
  return picks.slice(0, count);
}

export const ALL_CAMERA_STATION_IDS = [1, 2, 3, 4, 6];

/** Station numbers that have no verified in-territory feed (UI surfaces this honestly). */
export function stationsWithoutCameras(): number[] {
  return ALL_CAMERA_STATION_IDS.filter(
    (n) => camerasForStation(n, false).length === 0,
  );
}

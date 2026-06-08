/**
 * Normalize the hub's raw `/api/display/*` payloads into the app's nested shapes.
 *
 * The hub returns station readiness as FLAT fields on the snapshot grid
 * (readiness_percent / readiness_status / readiness_reasons) but as a NESTED object
 * on the station-detail endpoint. Apparatus uses `open_defects_count`. We reconcile
 * both into the single nested shape the components expect, in one place.
 */

import type {
  DisplayApparatus,
  DisplayOverview,
  DisplayStationDetail,
  DisplayStationSummary,
  ReadinessStatus,
} from '@/types/display';

interface RawStationSummary {
  id: number;
  number: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  apparatus_count: number;
  in_service: number;
  out_of_service: number;
  maintenance: number;
  open_defects: number;
  readiness_percent?: number;
  readiness_status?: ReadinessStatus;
  readiness_reasons?: string[];
  // tolerate an already-nested shape too
  readiness?: { percent: number; status: ReadinessStatus; reasons: string[] };
}

function toReadiness(s: RawStationSummary) {
  if (s.readiness && typeof s.readiness.percent === 'number') return s.readiness;
  return {
    percent: typeof s.readiness_percent === 'number' ? s.readiness_percent : 0,
    status: (s.readiness_status ?? 'UNKNOWN') as ReadinessStatus,
    reasons: s.readiness_reasons ?? [],
  };
}

function normalizeStation(s: RawStationSummary): DisplayStationSummary {
  return {
    id: s.id,
    number: s.number,
    name: s.name,
    latitude: s.latitude ?? null,
    longitude: s.longitude ?? null,
    apparatus_count: s.apparatus_count ?? 0,
    in_service: s.in_service ?? 0,
    out_of_service: s.out_of_service ?? 0,
    maintenance: s.maintenance ?? 0,
    open_defects: s.open_defects ?? 0,
    readiness: toReadiness(s),
  };
}

export function normalizeOverview(raw: DisplayOverview): DisplayOverview {
  const stations = Array.isArray(raw?.stations)
    ? (raw.stations as unknown as RawStationSummary[]).map(normalizeStation)
    : [];
  return { ...raw, stations };
}

interface RawApparatus {
  id: number;
  unit_id: string | null;
  designation: string | null;
  name?: string | null;
  type: string | null;
  status: string;
  pm_health: DisplayApparatus['pm_health'];
  open_defects_count?: number;
  defect_count?: number;
  last_inspection_at?: string | null;
}

function normalizeApparatus(a: RawApparatus): DisplayApparatus {
  return {
    id: a.id,
    unit_id: a.unit_id ?? null,
    designation: a.designation ?? a.name ?? null,
    type: a.type ?? null,
    status: a.status ?? 'Unknown',
    pm_health: a.pm_health ?? null,
    defect_count: a.open_defects_count ?? a.defect_count ?? 0,
    last_inspection_at: a.last_inspection_at ?? null,
  };
}

export function normalizeStationDetail(raw: DisplayStationDetail): DisplayStationDetail {
  const apparatus = Array.isArray(raw?.apparatus)
    ? (raw.apparatus as unknown as RawApparatus[]).map(normalizeApparatus)
    : [];
  return { ...raw, apparatus };
}

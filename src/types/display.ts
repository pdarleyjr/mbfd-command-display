/**
 * Types for the read-only MBFD display API (`/api/display/*`).
 * These mirror the hub's DisplaySnapshotService output. Everything is read-only and
 * already redacted server-side (no VIN / Snipe-IT / notes / location / financials).
 */

export type ReadinessStatus = 'READY' | 'ATTENTION' | 'INCOMPLETE' | 'CRITICAL' | 'UNKNOWN';
export type SourceState = 'up' | 'degraded' | 'down' | 'unknown';

export interface SnapshotMetadata {
  generated_at: string; // ISO8601
  cache_ttl_seconds: number;
  environment: string;
  /** Edge-added: where this payload came from (live origin vs last-good KV). */
  served_from?: 'origin' | 'snapshot' | 'empty';
  snapshot_age_seconds?: number;
}

export interface PmHealth {
  status: 'green' | 'yellow' | 'red';
  hours_since_pm: number;
  overdue: boolean;
  interval_hours?: number;
}

export interface DisplayApparatus {
  id: number;
  unit_id: string | null;
  designation: string | null;
  type: string | null;
  status: string; // 'In Service' | 'Out of Service' | 'Maintenance' | ...
  pm_health: PmHealth | null;
  defect_count: number;
  last_inspection_at: string | null;
}

export interface StationReadiness {
  percent: number;
  status: ReadinessStatus;
  reasons: string[];
  metric?: 'readiness' | 'frontline_vehicle_inspections';
  completed?: number;
  required?: number;
  required_units?: string[];
  missing_units?: string[];
}

export interface DisplayStationSummary {
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
  readiness: StationReadiness;
}

export interface DefectItem {
  unit: string | null;
  item: string | null;
  status: string; // Present | Missing | Damaged
  reported_date: string | null;
  days_open: number;
}

export interface InventoryExceptionItem {
  name: string;
  category: string | null;
  stock: number;
  reorder_min: number;
  status: 'critical' | 'low';
}

export interface DisplayOverview {
  metadata: SnapshotMetadata;
  organization: { name: string };
  overview: {
    stations_total: number;
    stations_active: number;
    apparatus_total: number;
    apparatus_status: { in_service: number; out_of_service: number; maintenance: number };
    pm_health: { green: number; yellow: number; red: number; critical_overdue: number };
    readiness_percent: number;
  };
  stations: DisplayStationSummary[];
  defects: { total_open: number; critical_missing: number; items: DefectItem[] };
  submissions: {
    inspections: { today: number; this_week: number; this_month: number; pending_review: number };
    station_inspections: { pending_review: number; pass_rate_30d: number };
    inventory: { submitted_today: number; stations_missing_today: number };
  };
  requests: {
    fire_equipment: { pending: number; critical_pending: number };
    big_ticket: { outstanding: number };
    employee_equipment: { pending: number };
  };
  inventory_exceptions: {
    total_active_items: number;
    out_of_stock: number;
    low_stock: number;
    items: InventoryExceptionItem[];
  };
  source_health: {
    hub_up: boolean;
    ai_available: boolean;
    incidents_worker_up: boolean;
    last_deploy_sha: string | null;
    snapshot_age_seconds: number;
  };
}

export interface DisplayStationDetail {
  metadata: SnapshotMetadata;
  station: {
    id: number;
    number: string;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  readiness: StationReadiness;
  apparatus: DisplayApparatus[];
  counts: {
    inspections_today: number;
    station_inspections_30d: number;
    equipment_requests: number;
    big_ticket: number;
    open_defects: number;
    supply_requests: number;
  };
  defects: DefectItem[];
}

export interface PersonnelMember {
  id: number | string;
  name: string;
  rank: string | null;
}

export interface DisplaySubmissionRow {
  id: number;
  kind: 'apparatus_inspection' | 'station_inspection' | 'supply_request' | 'big_ticket';
  label: string;
  status: string | null;
  at: string | null;
}

// ── PulsePoint incidents (proxied; shape is the worker's, defensively typed) ──
export interface IncidentRecord {
  id?: string;
  type?: string;
  status?: string;
  age_seconds?: number;
  received?: string;
  latitude?: number | string;
  longitude?: number | string;
  address?: string;
  units?: string[] | string;
  [k: string]: unknown;
}

export interface IncidentsResponse {
  active: IncidentRecord[];
  recent: IncidentRecord[];
  fetchedAt?: string;
  error?: string;
}

// ── Descriptive AI snapshot ──
export interface AiStationSummary {
  station: string;
  summary: string;
}

export interface AiSnapshot {
  mode: 'descriptive';
  briefing: string;
  station_summaries: AiStationSummary[];
  active_run_summary: string;
  camera_source_summary: string;
  data_gaps: string[];
  confidence: number;
  generated_at: string;
  model: string;
  /** Edge/hub status marker: fresh | stale | generating | unavailable */
  status?: 'fresh' | 'stale' | 'generating' | 'unavailable';
}

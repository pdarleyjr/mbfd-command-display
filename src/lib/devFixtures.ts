/**
 * DEV-ONLY mock fixtures.
 *
 * Activated only when `import.meta.env.DEV && import.meta.env.VITE_MOCK === '1'`.
 * In a production Cloudflare Pages build `import.meta.env.DEV` is `false`, so this whole
 * module is dead-code-eliminated and never ships. It exists so the UI can be developed and
 * visually verified without the hub's `X-Display-Token` (the live `/api/display/*` is
 * token-gated and returns 403 to a plain dev proxy).
 *
 * The shapes mirror the hub wire format (flat readiness_* on the snapshot grid), which the
 * normalizer reconciles — so this exercises the real client code path, not a shortcut.
 */

import type { ApiResult } from './apiClient';

export const MOCK_ENABLED: boolean = import.meta.env.DEV && import.meta.env.VITE_MOCK === '1';

const nowIso = () => new Date().toISOString();

function ok<T>(data: T): ApiResult<T> {
  return { data, servedFrom: 'origin', snapshotAgeSeconds: 4, status: 200 };
}

const STATIONS = [
  {
    id: 1, number: '1', name: 'Station 1 — South Beach', latitude: null, longitude: null,
    apparatus_count: 5, in_service: 5, out_of_service: 0, maintenance: 0, open_defects: 2,
    readiness_percent: 34, readiness_status: 'CRITICAL',
    readiness_reasons: ['0 of 5 apparatus checked out today', '1 station inspection overdue', '2 open apparatus defects'],
  },
  {
    id: 2, number: '2', name: 'Station 2 — Mid Beach', latitude: null, longitude: null,
    apparatus_count: 15, in_service: 14, out_of_service: 1, maintenance: 0, open_defects: 1,
    readiness_percent: 34, readiness_status: 'CRITICAL',
    readiness_reasons: ['0 of 15 apparatus checked out today', 'Engine 2 out of service', '1 PM overdue'],
  },
  {
    id: 3, number: '3', name: 'Station 3 — North Mid Beach', latitude: null, longitude: null,
    apparatus_count: 3, in_service: 3, out_of_service: 0, maintenance: 0, open_defects: 0,
    readiness_percent: 35, readiness_status: 'CRITICAL',
    readiness_reasons: ['0 of 3 apparatus checked out today', 'No station inspection logged today'],
  },
  {
    id: 4, number: '4', name: 'Station 4 — North Beach', latitude: null, longitude: null,
    apparatus_count: 3, in_service: 3, out_of_service: 0, maintenance: 0, open_defects: 8,
    readiness_percent: 30, readiness_status: 'CRITICAL',
    readiness_reasons: ['0 of 3 apparatus checked out today', '8 open apparatus defects', 'Equipment request pending'],
  },
  {
    id: 6, number: '6', name: 'Station 6 — Marine / PortMiami', latitude: null, longitude: null,
    apparatus_count: 0, in_service: 0, out_of_service: 0, maintenance: 0, open_defects: 0,
    readiness_percent: 0, readiness_status: 'UNKNOWN',
    readiness_reasons: ['No apparatus or recent inspections recorded'],
  },
];

const DEFECTS = [
  { unit: 'Rescue 4', item: 'Pedi Backboard', status: 'Missing', reported_date: nowIso(), days_open: 0 },
  { unit: 'Engine 2', item: 'Auto Wash', status: 'Damaged', reported_date: nowIso(), days_open: 3 },
  { unit: 'Rescue 1', item: 'Fog Fluid', status: 'Missing', reported_date: nowIso(), days_open: 1 },
  { unit: 'Truck 4', item: 'TIC Charger', status: 'Missing', reported_date: nowIso(), days_open: 6 },
  { unit: 'Engine 4', item: 'Vector Fog Machine', status: 'Damaged', reported_date: nowIso(), days_open: 2 },
  { unit: 'Rescue 4', item: 'O2 Regulator', status: 'Missing', reported_date: nowIso(), days_open: 5 },
  { unit: 'Engine 1', item: 'SCBA Mask', status: 'Damaged', reported_date: nowIso(), days_open: 9 },
  { unit: 'Truck 2', item: 'Hydraulic Cutter', status: 'Missing', reported_date: nowIso(), days_open: 4 },
];

const OVERVIEW = {
  metadata: { generated_at: nowIso(), cache_ttl_seconds: 300, environment: 'mock', served_from: 'origin', snapshot_age_seconds: 4 },
  organization: { name: 'Miami Beach Fire Department' },
  overview: {
    stations_total: 5, stations_active: 5, apparatus_total: 26,
    apparatus_status: { in_service: 25, out_of_service: 1, maintenance: 0 },
    pm_health: { green: 18, yellow: 6, red: 2, critical_overdue: 2 },
    readiness_percent: 33,
  },
  stations: STATIONS,
  defects: { total_open: 10, critical_missing: 8, items: DEFECTS },
  submissions: {
    inspections: { today: 0, this_week: 31, this_month: 142, pending_review: 4 },
    station_inspections: { pending_review: 2, pass_rate_30d: 0.92 },
    inventory: { submitted_today: 1, stations_missing_today: 3 },
  },
  requests: {
    fire_equipment: { pending: 0, critical_pending: 0 },
    big_ticket: { outstanding: 0 },
    employee_equipment: { pending: 0 },
  },
  inventory_exceptions: {
    total_active_items: 220, out_of_stock: 2, low_stock: 5,
    items: [
      { name: 'Nitrile Gloves (L)', category: 'PPE', stock: 2, reorder_min: 20, status: 'critical' },
      { name: 'Saline 1000mL', category: 'EMS', stock: 8, reorder_min: 24, status: 'low' },
    ],
  },
  source_health: { hub_up: true, ai_available: true, incidents_worker_up: true, last_deploy_sha: '92917b5e', snapshot_age_seconds: 4 },
};

const INCIDENTS = {
  active: [
    { id: 'i1', type: 'Medical Emergency', status: 'active', address: '4101 Pine Tree Dr, Miami Beach, FL', latitude: 25.815, longitude: -80.128, units: ['R4', 'E4'], age_seconds: 60 },
    { id: 'i2', type: 'Structure Fire', status: 'active', address: '1250 Alton Rd, Miami Beach, FL', latitude: 25.785, longitude: -80.142, units: ['E1', 'T1', 'BC1'], age_seconds: 420 },
    { id: 'i3', type: 'Traffic Collision', status: 'active', address: '7100 Collins Ave, Miami Beach, FL', latitude: 25.852, longitude: -80.121, units: ['R3'], age_seconds: 95 },
  ],
  recent: [],
  fetchedAt: nowIso(),
};

const AI = {
  mode: 'descriptive' as const,
  briefing:
    'All five stations are reporting below their readiness baseline, driven primarily by the absence of any logged apparatus checkouts so far today. Station 4 carries the highest open-defect load (8) and the lowest readiness (30%). Station 2 has one engine out of service. Station 6 (Marine) has no apparatus or recent inspections recorded, so its readiness is unknown. Three incidents are active across the mid- and north-beach territories.',
  station_summaries: STATIONS.map((s) => ({
    station: s.name,
    summary: `${s.in_service}/${s.apparatus_count} in service, ${s.open_defects} open defect(s); readiness ${s.readiness_percent}% (${s.readiness_status}).`,
  })),
  active_run_summary: 'Three active incidents: a medical at 4101 Pine Tree Dr, a structure fire at 1250 Alton Rd, and a traffic collision at 7100 Collins Ave.',
  camera_source_summary: 'Four territory cameras are streaming; the marine telemetry tile is reporting current buoy data.',
  data_gaps: ['No apparatus checkouts logged today', 'Station 6 has no apparatus records'],
  confidence: 0.78,
  generated_at: nowIso(),
  model: 'qwen3.6:35b',
  status: 'fresh' as const,
};

function detailFor(id: number) {
  const s = STATIONS.find((x) => x.id === id) ?? STATIONS[0];
  const apparatus = Array.from({ length: s.apparatus_count }).map((_, i) => ({
    id: id * 100 + i,
    unit_id: `${s.number}-${i + 1}`,
    designation: `${['Engine', 'Rescue', 'Truck', 'Brush', 'Marine'][i % 5]} ${s.number}`,
    type: ['Engine', 'Rescue', 'Truck'][i % 3],
    status: i === 0 && s.out_of_service > 0 ? 'Out of Service' : 'In Service',
    pm_health: { status: (['green', 'yellow', 'red'] as const)[i % 3], hours_since_pm: 120 + i * 30, overdue: i % 3 === 2, interval_hours: 720 },
    open_defects_count: i < s.open_defects ? 1 : 0,
    last_inspection_at: nowIso(),
  }));
  return {
    metadata: { generated_at: nowIso(), cache_ttl_seconds: 300, environment: 'mock' },
    station: { id: s.id, number: s.number, name: s.name, address: `${100 + id} Example Ave, Miami Beach, FL`, latitude: null, longitude: null },
    readiness: { percent: s.readiness_percent, status: s.readiness_status, reasons: s.readiness_reasons },
    apparatus,
    counts: { inspections_today: 0, station_inspections_30d: 12, equipment_requests: id === 4 ? 1 : 0, big_ticket: 0, open_defects: s.open_defects, supply_requests: 0 },
    defects: DEFECTS.filter((d) => d.unit?.includes(s.number)).slice(0, s.open_defects),
  };
}

const RANKS = ['Captain', 'Lieutenant', 'Driver Engineer', 'Firefighter', 'Firefighter/Paramedic'];
function personnelFor(id: number) {
  return {
    personnel: Array.from({ length: 6 }).map((_, i) => ({
      id: id * 10 + i,
      name: ['A. Rivera', 'J. Chen', 'M. Okafor', 'L. Santos', 'P. Nguyen', 'D. Whitfield'][i],
      rank: RANKS[i % RANKS.length],
    })),
  };
}

function submissionsFor(id: number) {
  return {
    submissions: [
      { id: id * 7 + 1, kind: 'apparatus_inspection' as const, label: `Engine ${id} morning check`, status: 'complete', at: nowIso() },
      { id: id * 7 + 2, kind: 'station_inspection' as const, label: 'Daily station inspection', status: 'pending_review', at: nowIso() },
      { id: id * 7 + 3, kind: 'supply_request' as const, label: 'Medical supply restock', status: 'submitted', at: nowIso() },
    ],
  };
}

/** Return a mock ApiResult for a path, or null if the path is unmocked. */
export function mockFor(path: string): ApiResult<unknown> | null {
  if (path === '/api/snapshot') return ok(OVERVIEW);
  if (path === '/api/incidents') return ok(INCIDENTS);
  if (path === '/api/ai-snapshot') {
    const testMode = typeof localStorage !== 'undefined' ? localStorage.getItem('mbfd-test-ai') : null;
    if (testMode === 'empty') return ok({ ...AI, briefing: '', station_summaries: [], data_gaps: ['AI narrative withheld for test'], confidence: 0, status: 'unavailable' });
    return ok(AI);
  }
  if (path === '/api/stations') return ok({ stations: STATIONS });

  const detail = path.match(/^\/api\/stations\/(\d+)$/);
  if (detail) return ok(detailFor(Number(detail[1])));

  const ppl = path.match(/^\/api\/stations\/(\d+)\/personnel$/);
  if (ppl) return ok(personnelFor(Number(ppl[1])));

  const subs = path.match(/^\/api\/stations\/(\d+)\/submissions$/);
  if (subs) return ok(submissionsFor(Number(subs[1])));

  return null;
}

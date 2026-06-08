/**
 * GET /api/snapshot → hub /api/display/snapshot.
 * Full DisplayOverview with edge caching + last-good KV snapshot.
 */

import type { Env } from '../_shared/env';
import { passthroughRoute, block } from '../_shared/route';

function ttl(env: Env): number {
  const n = Number(env.SNAPSHOT_TTL_SECONDS);
  return Number.isFinite(n) && n > 0 ? n : 300;
}

/** Minimal-but-valid DisplayOverview shape for the never-blank case. */
function emptyOverview(): unknown {
  return {
    metadata: {
      generated_at: new Date().toISOString(),
      cache_ttl_seconds: 300,
      environment: 'edge',
      served_from: 'empty',
    },
    organization: { name: 'Miami Beach Fire Department' },
    overview: {
      stations_total: 0,
      stations_active: 0,
      apparatus_total: 0,
      apparatus_status: { in_service: 0, out_of_service: 0, maintenance: 0 },
      pm_health: { green: 0, yellow: 0, red: 0, critical_overdue: 0 },
      readiness_percent: 0,
    },
    stations: [],
    defects: { total_open: 0, critical_missing: 0, items: [] },
    submissions: {
      inspections: { today: 0, this_week: 0, this_month: 0, pending_review: 0 },
      station_inspections: { pending_review: 0, pass_rate_30d: 0 },
      inventory: { submitted_today: 0, stations_missing_today: 0 },
    },
    requests: {
      fire_equipment: { pending: 0, critical_pending: 0 },
      big_ticket: { outstanding: 0 },
      employee_equipment: { pending: 0 },
    },
    inventory_exceptions: { total_active_items: 0, out_of_stock: 0, low_stock: 0, items: [] },
    source_health: {
      hub_up: false,
      ai_available: false,
      incidents_worker_up: false,
      last_deploy_sha: null,
      snapshot_age_seconds: 0,
    },
  };
}

export const onRequestGet: PagesFunction<Env> = (context) =>
  passthroughRoute({
    kvKey: 'snapshot',
    hubPath: '/api/display/snapshot',
    ttlSeconds: ttl(context.env),
    emptyFallback: emptyOverview(),
  })(context);

export const onRequestPost = block;
export const onRequestPut = block;
export const onRequestPatch = block;
export const onRequestDelete = block;

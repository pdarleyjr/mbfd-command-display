/**
 * Source freshness — turns a timestamp/age into a trust state for badges.
 * Used by the source-health bar, camera tiles, and per-module "last updated" chips.
 */

export type Freshness = 'live' | 'fresh' | 'stale' | 'offline' | 'unknown';

export interface FreshnessThresholds {
  /** Below this age (s) it's "live"/"fresh". */
  freshUnder: number;
  /** At/above this age (s) it's "stale". */
  staleAt: number;
  /** At/above this age (s) it's "offline". */
  offlineAt: number;
}

export const DEFAULT_THRESHOLDS: FreshnessThresholds = {
  freshUnder: 60,
  staleAt: 180,
  offlineAt: 900,
};

export function ageSeconds(iso: string | number | null | undefined, nowMs = Date.now()): number | null {
  if (iso == null) return null;
  const t = typeof iso === 'number' ? iso : Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((nowMs - t) / 1000));
}

export function freshnessFromAge(
  age: number | null,
  thresholds: FreshnessThresholds = DEFAULT_THRESHOLDS,
): Freshness {
  if (age == null) return 'unknown';
  if (age >= thresholds.offlineAt) return 'offline';
  if (age >= thresholds.staleAt) return 'stale';
  if (age < thresholds.freshUnder) return 'fresh';
  return 'live';
}

export function formatAge(seconds: number | null): string {
  if (seconds == null) return '—';
  if (seconds < 5) return 'now';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export function freshnessTone(f: Freshness): 'ready' | 'attention' | 'critical' | 'unknown' {
  switch (f) {
    case 'live':
    case 'fresh':
      return 'ready';
    case 'stale':
      return 'attention';
    case 'offline':
      return 'critical';
    default:
      return 'unknown';
  }
}

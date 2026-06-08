/**
 * Station readiness model.
 *
 * The authoritative score is computed server-side (DisplaySnapshotService) so the wall
 * and any station view agree. This module owns the shared weights (for documentation /
 * a resilient client fallback) and the status → visual mapping.
 *
 * Weights (per owner decision):
 *   40% apparatus checkout completeness  (today's apparatus inspections / apparatus)
 *   25% station inspection               (recent pass within 30d)
 *   15% equipment requests               (inverse unresolved-request load)
 *   10% apparatus status / defects       (in-service ratio, open-defect penalty)
 *   10% source freshness                 (snapshot age)
 */

import type { ReadinessStatus, StationReadiness } from '@/types/display';

export const READINESS_WEIGHTS = {
  apparatusCheckout: 0.4,
  stationInspection: 0.25,
  equipmentRequests: 0.15,
  apparatusStatus: 0.1,
  sourceFreshness: 0.1,
} as const;

export function statusFromPercent(percent: number, hasData: boolean): ReadinessStatus {
  if (!hasData) return 'UNKNOWN';
  if (percent >= 85) return 'READY';
  if (percent >= 70) return 'ATTENTION';
  if (percent >= 50) return 'INCOMPLETE';
  return 'CRITICAL';
}

export interface ReadinessVisual {
  label: string;
  /** cg-status modifier class. */
  className: string;
  tone: 'ready' | 'attention' | 'critical' | 'unknown';
  /** Status glyph (paired with label — never color-alone). */
  glyph: string;
}

export function readinessVisual(status: ReadinessStatus): ReadinessVisual {
  switch (status) {
    case 'READY':
      return { label: 'Ready', className: 'cg-status--ready', tone: 'ready', glyph: '●' };
    case 'ATTENTION':
      return { label: 'Attention', className: 'cg-status--attention', tone: 'attention', glyph: '▲' };
    case 'INCOMPLETE':
      return { label: 'Incomplete', className: 'cg-status--incomplete', tone: 'attention', glyph: '◐' };
    case 'CRITICAL':
      return { label: 'Critical', className: 'cg-status--critical', tone: 'critical', glyph: '✕' };
    default:
      return { label: 'Unknown', className: 'cg-status--unknown', tone: 'unknown', glyph: '?' };
  }
}

/**
 * Resilient client-side recompute used only if the server omits readiness for a station
 * (degraded payload). Mirrors the server weights so visuals stay consistent.
 */
export function computeClientReadiness(input: {
  apparatusCount: number;
  inspectionsToday: number;
  stationInspected30d: boolean;
  openEquipmentRequests: number;
  inService: number;
  openDefects: number;
  snapshotAgeSeconds: number;
}): StationReadiness {
  const reasons: string[] = [];
  const hasData = input.apparatusCount > 0 || input.stationInspected30d;

  // 40% — apparatus checkout
  const checkoutRatio =
    input.apparatusCount > 0 ? Math.min(1, input.inspectionsToday / input.apparatusCount) : 0;
  reasons.push(
    input.apparatusCount > 0
      ? `${input.inspectionsToday} of ${input.apparatusCount} apparatus checked out today`
      : 'No apparatus assigned',
  );

  // 25% — station inspection
  const inspectionScore = input.stationInspected30d ? 1 : 0;
  reasons.push(input.stationInspected30d ? 'Station inspection on file (30d)' : 'No station inspection in 30 days');

  // 15% — equipment requests (load inverse; 0 open = full, 5+ open = 0)
  const reqScore = 1 - Math.min(1, input.openEquipmentRequests / 5);
  if (input.openEquipmentRequests > 0) reasons.push(`${input.openEquipmentRequests} open equipment request(s)`);

  // 10% — apparatus status / defects
  const inServiceRatio = input.apparatusCount > 0 ? input.inService / input.apparatusCount : 0;
  const defectPenalty = Math.min(1, input.openDefects / 4);
  const statusScore = Math.max(0, inServiceRatio - defectPenalty * 0.5);
  if (input.openDefects > 0) reasons.push(`${input.openDefects} open defect(s)`);

  // 10% — source freshness
  const freshnessScore = input.snapshotAgeSeconds < 300 ? 1 : input.snapshotAgeSeconds < 900 ? 0.5 : 0;

  const percent = Math.round(
    100 *
      (checkoutRatio * READINESS_WEIGHTS.apparatusCheckout +
        inspectionScore * READINESS_WEIGHTS.stationInspection +
        reqScore * READINESS_WEIGHTS.equipmentRequests +
        statusScore * READINESS_WEIGHTS.apparatusStatus +
        freshnessScore * READINESS_WEIGHTS.sourceFreshness),
  );

  return { percent, status: statusFromPercent(percent, hasData), reasons };
}

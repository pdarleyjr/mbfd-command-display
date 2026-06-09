import type { DisplayApparatus, StationReadiness } from '@/types/display';

export const FRONTLINE_APPARATUS_BY_STATION: Record<string, string[]> = {
  '1': ['L1', 'E1', 'R1', 'R11'],
  '2': ['E2', 'R2', 'R22'],
  '3': ['L3', 'E3', 'R3'],
  '4': ['E4', 'R4', 'R44'],
  '6': ['FB6'],
};

const TYPE_ALIASES: Array<[RegExp, string]> = [
  [/\b(engine|eng)\b/i, 'E'],
  [/\b(rescue|resc|medic)\b/i, 'R'],
  [/\b(ladder|truck|tower)\b/i, 'L'],
  [/\b(fire\s*boat|fireboat|boat|marine)\b/i, 'FB'],
];

export interface FrontlineInspectionSummary {
  stationNumber: string;
  requiredUnits: string[];
  completedUnits: string[];
  missingUnits: string[];
  completed: number;
  required: number;
  percent: number;
  status: StationReadiness['status'];
}

export function frontlineUnitsForStation(stationNumber: string | number): string[] {
  return FRONTLINE_APPARATUS_BY_STATION[String(stationNumber)] ?? [];
}

export function normalizeApparatusKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;

  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const direct = compact.match(/^(FB|L|E|R)(\d{1,2})$/);
  if (direct) return `${direct[1]}${direct[2]}`;

  const number = raw.match(/\b(\d{1,2})\b/)?.[1];
  if (!number) return null;

  for (const [pattern, prefix] of TYPE_ALIASES) {
    if (pattern.test(raw)) return `${prefix}${number}`;
  }

  return null;
}

export function isTodayInspection(timestamp: string | null | undefined, now = new Date()): boolean {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function computeFrontlineInspectionSummary(
  stationNumber: string | number,
  apparatus: DisplayApparatus[] | undefined,
  now = new Date(),
): FrontlineInspectionSummary {
  const station = String(stationNumber);
  const requiredUnits = frontlineUnitsForStation(station);
  const completed = new Set<string>();

  for (const unit of apparatus ?? []) {
    const keys = [unit.designation, unit.unit_id, unit.type].map(normalizeApparatusKey).filter(Boolean) as string[];
    const match = keys.find((key) => requiredUnits.includes(key));
    if (match && isTodayInspection(unit.last_inspection_at, now)) completed.add(match);
  }

  const completedUnits = requiredUnits.filter((unit) => completed.has(unit));
  const missingUnits = requiredUnits.filter((unit) => !completed.has(unit));
  const required = requiredUnits.length;
  const completedCount = completedUnits.length;
  const percent = required > 0 ? Math.round((completedCount / required) * 100) : 0;

  return {
    stationNumber: station,
    requiredUnits,
    completedUnits,
    missingUnits,
    completed: completedCount,
    required,
    percent,
    status: statusForFrontlineInspections(completedCount, required),
  };
}

export function computeFrontlineInspectionReadiness(
  stationNumber: string | number,
  apparatus: DisplayApparatus[] | undefined,
  now = new Date(),
): StationReadiness {
  const summary = computeFrontlineInspectionSummary(stationNumber, apparatus, now);
  const reasons = [
    `${summary.completed} of ${summary.required} frontline vehicle inspections completed today`,
  ];

  if (summary.missingUnits.length > 0) {
    reasons.push(`Pending: ${summary.missingUnits.join(', ')}`);
  }
  if (summary.required === 0) {
    reasons.push('No frontline apparatus mapping is configured for this station');
  }

  return {
    percent: summary.percent,
    status: summary.status,
    reasons,
    metric: 'frontline_vehicle_inspections',
    completed: summary.completed,
    required: summary.required,
    required_units: summary.requiredUnits,
    missing_units: summary.missingUnits,
  };
}

function statusForFrontlineInspections(completed: number, required: number): StationReadiness['status'] {
  if (required === 0) return 'UNKNOWN';
  if (completed === required) return 'READY';
  if (completed === 0) return 'CRITICAL';
  return 'INCOMPLETE';
}

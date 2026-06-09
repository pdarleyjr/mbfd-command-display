import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import type { DisplayStationSummary, IncidentRecord } from '@/types/display';
import { MIAMI_BEACH_BOUNDS, STATION_TERRITORIES, projectToMap, territoryByNumber } from '@/data/stationTerritories';
import { readinessVisual } from '@/lib/readiness';

interface Props {
  stations: DisplayStationSummary[];
  incidents: IncidentRecord[];
  selectedStationNumber: string | null;
  onSelectStation: (stationNumber: string) => void;
  reducedMotion?: boolean;
  className?: string;
}

const W = 1000;
const H = 480;
const ISLE_L = 470;
const ISLE_R = 632;
const ISLE_CX = (ISLE_L + ISLE_R) / 2;

const latToY = (lat: number): number => projectToMap(lat, MIAMI_BEACH_BOUNDS.east).y * H;

const CAUSEWAYS = [
  { lat: 25.7855, label: 'MacArthur Cswy' },
  { lat: 25.8123, label: 'Julia Tuttle Cswy' },
  { lat: 25.846, label: '79th St Cswy' },
];

const BOUNDARIES = [
  { lat: 25.762, label: 'Gov Cut' },
  { lat: 25.787, label: '14th St' },
  { lat: 25.812, label: '41st St' },
  { lat: 25.836, label: '64th St' },
  { lat: 25.864, label: '87th Ct' },
];

export function OperationsMap2D({ stations, incidents, selectedStationNumber, onSelectStation, reducedMotion, className }: Props) {
  const pins = stations.map((station) => pinForStation(station, selectedStationNumber));

  return (
    <div className={clsx('relative h-full w-full', className)}>
      <span className="sr-only">Miami Beach operations map with station territories, causeways, and active incident pins.</span>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <linearGradient id="mb-ocean" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--map-ocean-1, #123347)" />
            <stop offset="1" stopColor="var(--map-ocean-2, #0b2433)" />
          </linearGradient>
          <linearGradient id="mb-bay" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--map-bay-1, #0d1828)" />
            <stop offset="1" stopColor="var(--map-bay-2, #13283d)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={W} height={H} fill="url(#mb-bay)" />
        <rect x={ISLE_R - 6} y="0" width={W - ISLE_R + 6} height={H} fill="url(#mb-ocean)" />
        <text x={W - 16} y="28" textAnchor="end" fontSize="13" fontWeight="700" letterSpacing="3" fill="var(--c-marine)" opacity="0.75">
          ATLANTIC
        </text>
        <text x="16" y="28" fontSize="13" fontWeight="700" letterSpacing="3" fill="var(--c-info)" opacity="0.7">
          BISCAYNE BAY
        </text>

        {CAUSEWAYS.map((causeway) => {
          const y = latToY(causeway.lat);
          return (
            <g key={causeway.label}>
              <line x1="40" y1={y} x2={ISLE_L + 24} y2={y} stroke="var(--c-hairline-strong)" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
              <line x1="40" y1={y} x2={ISLE_L + 24} y2={y} stroke="var(--c-bg)" strokeWidth="1" strokeDasharray="2 6" />
              <text x="46" y={y - 6} fontSize="11" fill="var(--c-mute)" letterSpacing="0.5">
                {causeway.label}
              </text>
            </g>
          );
        })}

        <path d={islandPath()} fill="var(--c-surface-2)" stroke="var(--c-hairline-strong)" strokeWidth="1.5" />

        {STATION_TERRITORIES.filter((territory) => !territory.isMarine).map((territory) => {
          const yN = latToY(territory.band.north);
          const yS = latToY(territory.band.south);
          const selected = selectedStationNumber === territory.number;
          return (
            <rect
              key={territory.number}
              x={ISLE_L + 3}
              y={Math.min(yN, yS)}
              width={ISLE_R - ISLE_L - 6}
              height={Math.abs(yS - yN)}
              fill={territory.accent}
              opacity={selected ? 0.32 : 0.12}
            />
          );
        })}

        {BOUNDARIES.map((boundary) => {
          const y = latToY(boundary.lat);
          return (
            <g key={boundary.label}>
              <line x1={ISLE_L} y1={y} x2={ISLE_R} y2={y} stroke="var(--c-hairline-strong)" strokeWidth="1" strokeDasharray="3 4" />
              <text x={ISLE_R + 10} y={y + 4} fontSize="11" fill="var(--c-mute)">
                {boundary.label}
              </text>
            </g>
          );
        })}

        {incidents.slice(0, 12).map((incident, index) => {
          const lat = typeof incident.latitude === 'string' ? parseFloat(incident.latitude) : incident.latitude;
          const y = typeof lat === 'number' && !Number.isNaN(lat) ? latToY(lat) : 90 + index * 26;
          const x = ISLE_R - 10;
          return (
            <g key={`inc-${incident.id ?? index}`} transform={`translate(${x} ${y})`}>
              {!reducedMotion && (
                <circle r="7" fill="none" stroke="var(--c-ember)" strokeWidth="2">
                  <animate attributeName="r" from="7" to="20" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.9" to="0" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
              <circle r="4.5" fill="var(--c-ember)" stroke="var(--c-bg)" strokeWidth="1.5" />
            </g>
          );
        })}
      </svg>

      {pins.map((pin) => (
        <button
          key={pin.station.number}
          type="button"
          onClick={() => onSelectStation(pin.station.number)}
          className={clsx(
            'absolute grid min-h-9 min-w-9 -translate-x-1/2 -translate-y-1/2 place-content-center rounded-full border-2 bg-[color:var(--c-bg)] px-2 font-display text-sm font-extrabold text-ink shadow-glass transition-colors hover:bg-[color:var(--c-surface-3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--c-interactive)]',
            pin.selected && 'ring-2 ring-[color:var(--c-interactive)] ring-offset-2 ring-offset-[color:var(--c-bg)]',
          )}
          style={{ left: `${(pin.x / W) * 100}%`, top: `${(pin.y / H) * 100}%`, borderColor: pin.color } as CSSProperties}
          aria-label={`Open ${pin.station.name} command view. Frontline vehicle inspections ${pin.station.readiness?.percent ?? 'unknown'} percent complete.`}
          aria-current={pin.selected ? 'location' : undefined}
        >
          {pin.marine ? 'M' : pin.station.number}
        </button>
      ))}
    </div>
  );
}

function pinForStation(station: DisplayStationSummary, selectedStationNumber: string | null) {
  const territory = territoryByNumber(station.number);
  const visual = readinessVisual(station.readiness?.status ?? 'UNKNOWN');
  const y = latToY((territory?.centroid.lat ?? station.latitude) ?? 25.8);
  const marine = territory?.isMarine ?? false;
  return {
    station,
    visual,
    color: toneColor(visual.tone),
    x: marine ? 200 : ISLE_CX,
    y,
    marine,
    selected: selectedStationNumber === station.number,
  };
}

function islandPath(): string {
  const l = ISLE_L;
  const r = ISLE_R;
  return [
    `M ${l + 28} 14`,
    `C ${r - 30} 30, ${r - 6} 70, ${r - 12} 130`,
    `C ${r - 18} 190, ${r} 250, ${r - 8} 312`,
    `C ${r - 16} 372, ${r - 2} 420, ${r - 40} 466`,
    `L ${l + 34} 466`,
    `C ${l - 6} 418, ${l + 10} 360, ${l + 6} 300`,
    `C ${l + 2} 240, ${l - 8} 180, ${l + 4} 122`,
    `C ${l + 12} 74, ${l - 2} 44, ${l + 28} 14`,
    'Z',
  ].join(' ');
}

function toneColor(tone: 'ready' | 'attention' | 'critical' | 'unknown'): string {
  return tone === 'ready' ? 'var(--c-ready)' : tone === 'attention' ? 'var(--c-attention)' : tone === 'critical' ? 'var(--c-critical)' : 'var(--c-unknown)';
}

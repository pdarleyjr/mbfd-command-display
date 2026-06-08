import { clsx } from 'clsx';
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

/* Schematic of the Miami Beach barrier island (runs N→S): Biscayne Bay on the west,
 * the Atlantic on the east, three labeled causeways, four labeled response territories
 * with station pins, the marine station in the bay, and live incident drops. Hand-authored
 * geometry — not a lat/long stretch — so it reads as a place, not colored slabs. No tiles,
 * no API key, GPU-free, offline-safe. */

const W = 1000;
const H = 480;

// Island column (the barrier island), bay to its west, ocean to its east.
const ISLE_L = 470;
const ISLE_R = 632;
const ISLE_CX = (ISLE_L + ISLE_R) / 2;

const latToY = (lat: number): number => projectToMap(lat, MIAMI_BEACH_BOUNDS.east).y * H;

const CAUSEWAYS = [
  { lat: 25.7855, label: 'MacArthur Cswy' },
  { lat: 25.8123, label: 'Julia Tuttle Cswy' },
  { lat: 25.846, label: '79th St Cswy' },
];

// Territory boundary streets, south→north, drawn as labeled cross-island dividers.
const BOUNDARIES = [
  { lat: 25.762, label: 'Gov Cut' },
  { lat: 25.787, label: '14th St' },
  { lat: 25.812, label: '41st St' },
  { lat: 25.836, label: '64th St' },
  { lat: 25.864, label: '87th Ct' },
];

export function OperationsMap2D({ stations, incidents, selectedStationNumber, onSelectStation, reducedMotion, className }: Props) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={clsx('h-full w-full', className)}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Miami Beach operations map"
    >
      <defs>
        <linearGradient id="mb-ocean" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0f2c3a" />
          <stop offset="1" stopColor="#0a1f2c" />
        </linearGradient>
        <linearGradient id="mb-bay" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0c1726" />
          <stop offset="1" stopColor="#102236" />
        </linearGradient>
      </defs>

      {/* Water */}
      <rect x="0" y="0" width={W} height={H} fill="url(#mb-bay)" />
      <rect x={ISLE_R - 6} y="0" width={W - ISLE_R + 6} height={H} fill="url(#mb-ocean)" />
      <text x={W - 16} y="28" textAnchor="end" fontSize="13" fontWeight="700" letterSpacing="3" fill="#2f6f86" opacity="0.8">
        ATLANTIC
      </text>
      <text x="16" y="28" fontSize="13" fontWeight="700" letterSpacing="3" fill="#3a557a" opacity="0.8">
        BISCAYNE BAY
      </text>

      {/* Causeways (bay → island) */}
      {CAUSEWAYS.map((c) => {
        const y = latToY(c.lat);
        return (
          <g key={c.label}>
            <line x1="40" y1={y} x2={ISLE_L + 24} y2={y} stroke="#46637f" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            <line x1="40" y1={y} x2={ISLE_L + 24} y2={y} stroke="#1a2433" strokeWidth="1" strokeDasharray="2 6" />
            <text x="46" y={y - 6} fontSize="11" fill="#7c93ad" letterSpacing="0.5">
              {c.label}
            </text>
          </g>
        );
      })}

      {/* Island body */}
      <path
        d={islandPath()}
        fill="#1a2230"
        stroke="#33415a"
        strokeWidth="1.5"
      />

      {/* Territory zones (subtle accent tint within the island) + boundary labels */}
      {STATION_TERRITORIES.filter((t) => !t.isMarine).map((t) => {
        const yN = latToY(t.band.north);
        const yS = latToY(t.band.south);
        const selected = selectedStationNumber === t.number;
        return (
          <rect
            key={t.number}
            x={ISLE_L + 3}
            y={Math.min(yN, yS)}
            width={ISLE_R - ISLE_L - 6}
            height={Math.abs(yS - yN)}
            fill={t.accent}
            opacity={selected ? 0.26 : 0.12}
          />
        );
      })}
      {BOUNDARIES.map((b) => {
        const y = latToY(b.lat);
        return (
          <g key={b.label}>
            <line x1={ISLE_L} y1={y} x2={ISLE_R} y2={y} stroke="#46566f" strokeWidth="1" strokeDasharray="3 4" />
            <text x={ISLE_R + 10} y={y + 4} fontSize="11" fill="#6b7c98">
              {b.label}
            </text>
          </g>
        );
      })}

      {/* Incidents (live), positioned by latitude along the island's ocean edge. */}
      {incidents.slice(0, 12).map((inc, i) => {
        const lat = typeof inc.latitude === 'string' ? parseFloat(inc.latitude) : inc.latitude;
        const y = typeof lat === 'number' && !Number.isNaN(lat) ? latToY(lat) : 90 + i * 26;
        const x = ISLE_R - 10;
        return (
          <g key={`inc-${i}`} transform={`translate(${x} ${y})`}>
            {!reducedMotion && (
              <circle r="7" fill="none" stroke="#ef6a32" strokeWidth="2">
                <animate attributeName="r" from="7" to="20" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.9" to="0" dur="1.8s" repeatCount="indefinite" />
              </circle>
            )}
            <circle r="4.5" fill="#ef6a32" stroke="#0e1219" strokeWidth="1.5" />
          </g>
        );
      })}

      {/* Station pins */}
      {stations.map((s) => {
        const t = territoryByNumber(s.number);
        const vis = readinessVisual(s.readiness?.status ?? 'UNKNOWN');
        const color = toneColor(vis.tone);
        const y = latToY((t?.centroid.lat ?? s.latitude) ?? 25.8);
        const marine = t?.isMarine;
        const x = marine ? 200 : ISLE_CX;
        const selected = selectedStationNumber === s.number;
        return (
          <g
            key={s.number}
            transform={`translate(${x} ${y})`}
            role="button"
            tabIndex={0}
            aria-label={`${s.name} — readiness ${s.readiness?.percent ?? 'unknown'}`}
            onClick={() => onSelectStation(s.number)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectStation(s.number)}
            style={{ cursor: 'pointer' }}
          >
            {selected && <circle r="20" fill="none" stroke="#4f8bd6" strokeWidth="2" strokeOpacity="0.8" />}
            <circle r="15" fill="#0e1219" stroke={color} strokeWidth="3" />
            {marine ? (
              <text textAnchor="middle" dy="6" fontSize="17" fill={color}>
                ⚓
              </text>
            ) : (
              <text textAnchor="middle" dy="6" fontSize="16" fontWeight="800" fontFamily="Saira, sans-serif" fill="#e9edf4">
                {s.number}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** A gently irregular vertical barrier-island silhouette. */
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
  return tone === 'ready' ? '#34c98a' : tone === 'attention' ? '#e8b13a' : tone === 'critical' ? '#e2503f' : '#6b7c98';
}

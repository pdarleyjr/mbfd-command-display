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

const W = 1000;
const H = 620;

/**
 * SVG operations map — the low-GPU / no-WebGL / reduced-motion fallback. Same spatial
 * story as the 3D scene (territory bands, station nodes scaled by readiness, incident
 * pings, relational web) and fully keyboard-accessible. Looks intentional, not degraded.
 */
export function OperationsMap2D({ stations, incidents, selectedStationNumber, onSelectStation, reducedMotion, className }: Props) {
  const nodeFor = (s: DisplayStationSummary) => {
    const t = territoryByNumber(s.number);
    const lat = s.latitude ?? t?.centroid.lat ?? 25.79;
    const lng = s.longitude ?? t?.centroid.lng ?? -80.13;
    const p = projectToMap(lat, lng);
    return { x: p.x * W, y: p.y * H, t };
  };
  const nodes = stations.map((s) => ({ s, ...nodeFor(s) }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={clsx('h-full w-full', className)} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Miami Beach operations map">
      <defs>
        <linearGradient id="water" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0a2233" />
          <stop offset="1" stopColor="#081522" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="url(#water)" />

      {/* Territory bands (south→north latitude slabs). */}
      {STATION_TERRITORIES.filter((t) => !t.isMarine).map((t) => {
        const top = projectToMap(t.band.north, MIAMI_BEACH_BOUNDS.east).y * H;
        const bottom = projectToMap(t.band.south, MIAMI_BEACH_BOUNDS.east).y * H;
        return (
          <g key={t.number}>
            <rect x={W * 0.34} y={Math.min(top, bottom)} width={W * 0.32} height={Math.abs(bottom - top)} fill={t.accent} opacity={selectedStationNumber === t.number ? 0.22 : 0.1} />
            <line x1={W * 0.34} y1={Math.min(top, bottom)} x2={W * 0.66} y2={Math.min(top, bottom)} stroke={t.accent} strokeOpacity="0.4" strokeWidth="1" />
          </g>
        );
      })}

      {/* Relational web. */}
      {nodes.map((a, i) =>
        nodes.slice(i + 1, i + 3).map((b) => (
          <line key={`${a.s.number}-${b.s.number}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#37e6e0" strokeOpacity="0.1" strokeWidth="1" />
        )),
      )}

      {/* Incident pings. */}
      {incidents.slice(0, 12).map((inc, i) => {
        const lat = typeof inc.latitude === 'string' ? parseFloat(inc.latitude) : inc.latitude;
        const lng = typeof inc.longitude === 'string' ? parseFloat(inc.longitude) : inc.longitude;
        const p = typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) ? projectToMap(lat, lng) : { x: 0.5, y: 0.18 };
        return (
          <g key={`inc-${i}`} transform={`translate(${p.x * W} ${p.y * H})`}>
            {!reducedMotion && <circle r="6" fill="none" stroke="#ff6a3d" strokeWidth="2"><animate attributeName="r" from="6" to="20" dur="1.8s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.9" to="0" dur="1.8s" repeatCount="indefinite" /></circle>}
            <circle r="4" fill="#ff6a3d" />
          </g>
        );
      })}

      {/* Station nodes. */}
      {nodes.map(({ s, x, y, t }) => {
        const vis = readinessVisual(s.readiness?.status ?? 'UNKNOWN');
        const color = toneColor(vis.tone);
        const r = 10 + Math.round((s.readiness?.percent ?? 0) / 12);
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
            {selected && <circle r={r + 8} fill="none" stroke="#37e6e0" strokeWidth="2" strokeOpacity="0.7" />}
            <circle r={r} fill={t?.isMarine ? 'none' : color} fillOpacity={t?.isMarine ? 0 : 0.85} stroke={t?.isMarine ? '#2fb6c9' : color} strokeWidth={t?.isMarine ? 3 : 1.5} />
            <text textAnchor="middle" dy="5" fontSize="14" fontWeight="800" fill={t?.isMarine ? '#2fb6c9' : '#070c16'}>
              {t?.isMarine ? '⚓' : s.number}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function toneColor(tone: 'ready' | 'attention' | 'critical' | 'unknown'): string {
  return tone === 'ready' ? '#21d07a' : tone === 'attention' ? '#ffc53d' : tone === 'critical' ? '#ff5c6c' : '#6b7c98';
}

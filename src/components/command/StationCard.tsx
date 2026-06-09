import { clsx } from 'clsx';
import type { DisplayStationSummary } from '@/types/display';
import { territoryByNumber } from '@/data/stationTerritories';
import { readinessVisual } from '@/lib/readiness';
import { Anchor, Truck, Wrench } from '@/components/common/icons';

interface Props {
  station: DisplayStationSummary;
  onSelect: (stationNumber: string) => void;
  className?: string;
}

/**
 * Station readiness ROW: status left-rule · identity · glance stats · readiness % · bar.
 * A row (not an image card) so the station name never truncates and there is no blank
 * photo bar. The whole row is the drill-down control.
 */
export function StationCard({ station, onSelect, className }: Props) {
  const territory = territoryByNumber(station.number);
  const vis = readinessVisual(station.readiness?.status ?? 'UNKNOWN');
  const color = statusColor(station.readiness?.status);
  const percent = Number.isFinite(station.readiness?.percent) ? station.readiness.percent : null;
  const name = station.name.replace(/^Station \d+\s*[—–-]\s*/, '');

  return (
    <button
      type="button"
      onClick={() => onSelect(station.number)}
      aria-label={`Open ${station.name} command view — readiness ${percent ?? 'unknown'}`}
      className={clsx(
        'cg-reset group flex flex-col gap-2 rounded-lg border border-[color:var(--c-hairline)] bg-[color:var(--c-surface-2)] px-3 py-2.5 transition-colors hover:border-[color:var(--c-interactive)] hover:bg-[color:var(--c-surface-3)]',
        className,
      )}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center gap-3">
        {territory?.isMarine ? (
          <span className="grid h-8 w-8 shrink-0 place-content-center rounded-md bg-[color:var(--c-surface-3)] text-marine">
            <Anchor size={17} />
          </span>
        ) : (
          <span
            className="grid h-8 w-8 shrink-0 place-content-center rounded-md font-display text-sm font-extrabold text-abyss"
            style={{ background: territory?.accent ?? 'var(--c-interactive)' }}
          >
            {station.number}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="cg-clamp-2 font-display text-[15px] font-bold leading-tight text-ink">{name}</div>
          <div className="truncate text-[11px] text-faint">{territory?.territoryLabel}</div>
        </div>

        <div className="hidden shrink-0 flex-col items-end gap-0.5 text-[11px] text-mute sm:flex">
          <span className="inline-flex items-center gap-1">
            <Truck size={12} className="text-faint" />
            {station.apparatus_count > 0 ? (
              <>
                <span className="tnum text-ink">{station.in_service}</span>/<span className="tnum">{station.apparatus_count}</span>
              </>
            ) : (
              <span className="text-faint">No units</span>
            )}
          </span>
          <span className="inline-flex items-center gap-2">
            {station.out_of_service > 0 && <span className="tnum text-critical">{station.out_of_service} OOS</span>}
            {station.open_defects > 0 && (
              <span className="tnum inline-flex items-center gap-0.5 text-attention">
                <Wrench size={11} />
                {station.open_defects}
              </span>
            )}
            {station.out_of_service === 0 && station.open_defects === 0 && <span className="text-ready">clear</span>}
          </span>
        </div>

        <div className="shrink-0 text-right" style={{ minWidth: '4.5rem' }}>
          <div className="tnum font-display font-extrabold leading-none" style={{ fontSize: 'var(--fs-metric-sm)', color }}>
            {percent != null ? percent : '—'}
            {percent != null && <span className="text-[0.5em] align-top text-mute">%</span>}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>
            {vis.label}
          </div>
        </div>
      </div>

      <div className="cg-bar">
        <div className="cg-bar__fill" style={{ width: `${percent ?? 0}%`, background: color }} />
      </div>
    </button>
  );
}

function statusColor(status: DisplayStationSummary['readiness']['status'] | undefined): string {
  switch (status) {
    case 'READY':
      return 'var(--c-ready)';
    case 'ATTENTION':
    case 'INCOMPLETE':
      return 'var(--c-attention)';
    case 'CRITICAL':
      return 'var(--c-critical)';
    default:
      return 'var(--c-unknown)';
  }
}

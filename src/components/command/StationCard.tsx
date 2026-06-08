import { clsx } from 'clsx';
import type { DisplayStationSummary } from '@/types/display';
import { assetForStation } from '@/data/stationAssets';
import { territoryByNumber } from '@/data/stationTerritories';
import { StationImage } from '@/components/common/StationImage';
import { ReadinessChip } from '@/components/common/StatusChip';
import { Anchor, Truck, Wrench } from '@/components/common/icons';

interface Props {
  station: DisplayStationSummary;
  onSelect: (stationNumber: string) => void;
  className?: string;
}

/** Station readiness card: image backdrop + readiness chip + glance counts + top reason. */
export function StationCard({ station, onSelect, className }: Props) {
  const territory = territoryByNumber(station.number);
  const asset = assetForStation(station.number);
  const reason = station.readiness?.reasons?.[0];

  return (
    <button
      type="button"
      onClick={() => onSelect(station.number)}
      className={clsx(
        'cg-panel cg-panel--interactive cg-reset group relative flex min-h-0 flex-col justify-end overflow-hidden',
        className,
      )}
      aria-label={`Open ${station.name} command view`}
    >
      <StationImage
        asset={asset}
        variant="square"
        alt=""
        className="absolute inset-0 h-full w-full"
        imgClassName="transition-transform duration-700 group-hover:scale-105"
      />
      <div className="relative z-10 flex flex-col gap-1.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {territory?.isMarine ? (
              <Anchor size={16} className="text-marine" />
            ) : (
              <span
                className="grid h-6 w-6 place-content-center rounded-md text-xs font-extrabold text-abyss"
                style={{ background: territory?.accent ?? '#4DA3FF' }}
              >
                {station.number}
              </span>
            )}
            <span className="text-sm font-bold text-ink drop-shadow">{station.name.replace(/^Station \d+\s*—\s*/, '')}</span>
          </div>
          <ReadinessChip status={station.readiness?.status ?? 'UNKNOWN'} />
        </div>

        <div className="flex items-center gap-3 text-[12px] text-mute">
          <span className="inline-flex items-center gap-1">
            <Truck size={13} className="text-ready" />
            <span className="tnum text-ink">{station.in_service}</span>/<span className="tnum">{station.apparatus_count}</span> in svc
          </span>
          {station.out_of_service > 0 && (
            <span className="inline-flex items-center gap-1 text-critical">
              <span className="tnum">{station.out_of_service}</span> OOS
            </span>
          )}
          {station.open_defects > 0 && (
            <span className="inline-flex items-center gap-1 text-attention">
              <Wrench size={13} />
              <span className="tnum">{station.open_defects}</span>
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="cg-clamp-2 text-[11px] leading-tight text-faint">{reason ?? territory?.territoryLabel}</span>
          <span className="tnum shrink-0 text-lg font-extrabold" style={{ color: readinessColor(station) }}>
            {Number.isFinite(station.readiness?.percent) ? `${station.readiness.percent}%` : '—'}
          </span>
        </div>
      </div>
    </button>
  );
}

function readinessColor(s: DisplayStationSummary): string {
  switch (s.readiness?.status) {
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

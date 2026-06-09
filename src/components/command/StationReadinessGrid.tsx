import { clsx } from 'clsx';
import type { DisplayStationSummary } from '@/types/display';
import { GlassPanel } from '@/components/common/GlassPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { Grid } from '@/components/common/icons';
import { StationCard } from './StationCard';

interface Props {
  stations: DisplayStationSummary[] | undefined;
  onSelect: (stationNumber: string) => void;
  className?: string;
  columnsClassName?: string;
}

const ORDER = ['1', '2', '3', '4', '6'];

/** All-station frontline vehicle inspection grid. Always shows every station, ordered 1·2·3·4·6. */
export function StationReadinessGrid({ stations, onSelect, className, columnsClassName }: Props) {
  const sorted = [...(stations ?? [])].sort(
    (a, b) => orderIndex(a.number) - orderIndex(b.number),
  );

  return (
    <GlassPanel
      label="Vehicle Inspection Completion"
      icon={<Grid size={15} />}
      className={className}
      bodyClassName="min-h-0"
      right={
        sorted.length > 0 ? (
          <span className="text-[11px] uppercase tracking-wider text-faint">
            <span className="tnum text-ready">{sorted.filter((s) => s.readiness?.status === 'READY').length}</span> complete ·{' '}
            <span className="tnum">{sorted.length}</span> stations
          </span>
        ) : undefined
      }
    >
      {sorted.length === 0 ? (
        <EmptyState icon={<Grid size={22} />} title="No station data" hint="Awaiting hub snapshot" />
      ) : (
        <div
          className={clsx(
            'cg-scroll-y grid h-full min-h-0 content-start gap-2',
            // One column of rows on every normal display; two columns only on a wall.
            columnsClassName ?? 'grid-cols-1',
          )}
        >
          {sorted.map((s) => (
            <StationCard key={s.id} station={s} onSelect={onSelect} />
          ))}
        </div>
      )}
    </GlassPanel>
  );
}

function orderIndex(num: string): number {
  const i = ORDER.indexOf(num);
  return i === -1 ? 99 : i;
}

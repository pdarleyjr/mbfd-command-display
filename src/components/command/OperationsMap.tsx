import { clsx } from 'clsx';
import type { DisplayStationSummary, IncidentRecord } from '@/types/display';
import { STATION_TERRITORIES } from '@/data/stationTerritories';
import { MapPin } from '@/components/common/icons';
import { OperationsMap2D } from './OperationsMap2D';

interface OperationsMapProps {
  stations: DisplayStationSummary[];
  incidents: IncidentRecord[];
  selectedStationNumber: string | null;
  onSelectStation: (stationNumber: string) => void;
  reducedMotion?: boolean;
  className?: string;
}

/**
 * Operations map — a hand-authored, labeled barrier-island schematic (OperationsMap2D).
 * Legible at any size, no WebGL/tiles/keys. (The former Three.js scene read as an abstract
 * tilted grid and has been retired as the default.)
 */
export function OperationsMap({
  stations,
  incidents,
  selectedStationNumber,
  onSelectStation,
  reducedMotion = false,
  className,
}: OperationsMapProps) {
  return (
    <section className={clsx('cg-panel cg-panel--lg relative overflow-hidden', className)}>
      <div className="absolute left-4 top-3 z-10 flex items-center gap-2 text-mute">
        <MapPin size={15} className="text-info" />
        <span className="cg-label">Operations Map — Miami Beach</span>
      </div>

      <div className="absolute inset-0 pt-10">
        <OperationsMap2D
          stations={stations}
          incidents={incidents}
          selectedStationNumber={selectedStationNumber}
          onSelectStation={onSelectStation}
          reducedMotion={reducedMotion}
        />
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-4 z-10 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-wider text-faint">
        {STATION_TERRITORIES.map((t) => (
          <span key={t.number} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: t.accent }} />
            {t.isMarine ? 'Marine' : `Sta ${t.number}`}
          </span>
        ))}
        <span className="inline-flex items-center gap-1 text-ember">
          <span className="h-2 w-2 rounded-full bg-ember" /> Active run
        </span>
      </div>
    </section>
  );
}

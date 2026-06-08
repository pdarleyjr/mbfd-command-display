import { ActiveRunsPanel } from '@/components/command/ActiveRunsPanel';
import { territoryByNumber } from '@/data/stationTerritories';
import type { IncidentRecord, IncidentsResponse } from '@/types/display';

interface Props {
  incidents: IncidentsResponse | undefined;
  servedFrom?: 'origin' | 'snapshot' | 'persisted' | 'empty' | 'unknown';
  ageSeconds: number | null;
  stationNumber: string;
  className?: string;
}

/**
 * Active runs filtered to a station's territory band where incident coordinates are
 * available. Incidents without coordinates are kept (cannot be localized) so nothing is
 * silently dropped.
 */
export function StationRunsPanel({ incidents, servedFrom, ageSeconds, stationNumber, className }: Props) {
  const band = territoryByNumber(stationNumber)?.band;
  const filter = (i: IncidentRecord): boolean => {
    if (!band) return true;
    const lat = typeof i.latitude === 'string' ? parseFloat(i.latitude) : i.latitude;
    if (typeof lat !== 'number' || Number.isNaN(lat)) return true; // can't localize → keep
    return lat >= band.south && lat <= band.north;
  };
  return (
    <ActiveRunsPanel data={incidents} servedFrom={servedFrom} ageSeconds={ageSeconds} filter={filter} className={className} />
  );
}

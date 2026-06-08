/**
 * Domain data hooks for the display. Each picks a sensible poll interval per the data's
 * volatility and rides on usePersistentQuery for last-good behavior.
 */

import { usePersistentQuery } from './usePersistentQuery';
import { normalizeOverview, normalizeStationDetail } from '@/lib/normalize';
import type {
  AiSnapshot,
  DisplayOverview,
  DisplayStationDetail,
  IncidentsResponse,
  PersonnelMember,
  DisplaySubmissionRow,
} from '@/types/display';

export function useDisplaySnapshot() {
  const r = usePersistentQuery<DisplayOverview>({
    key: 'snapshot',
    path: '/api/snapshot',
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
  // Reconcile the hub's flat readiness_* fields into the nested app shape.
  return { ...r, data: r.data ? normalizeOverview(r.data) : undefined };
}

export function useStations() {
  return usePersistentQuery<{ stations: DisplayOverview['stations'] } | DisplayOverview['stations']>({
    key: 'stations',
    path: '/api/stations',
    refetchInterval: 60_000,
    staleTime: 45_000,
  });
}

export function useStationDetail(stationId: number | null) {
  const r = usePersistentQuery<DisplayStationDetail>({
    key: `station-${stationId ?? 'none'}`,
    path: `/api/stations/${stationId}`,
    enabled: stationId != null,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
  return { ...r, data: r.data ? normalizeStationDetail(r.data) : undefined };
}

export function useStationPersonnel(stationId: number | null) {
  return usePersistentQuery<{ personnel: PersonnelMember[] } | PersonnelMember[]>({
    key: `station-${stationId ?? 'none'}-personnel`,
    path: `/api/stations/${stationId}/personnel`,
    enabled: stationId != null,
    refetchInterval: 300_000,
    staleTime: 240_000,
  });
}

export function useStationSubmissions(stationId: number | null) {
  return usePersistentQuery<{ submissions: DisplaySubmissionRow[] } | DisplaySubmissionRow[]>({
    key: `station-${stationId ?? 'none'}-subs`,
    path: `/api/stations/${stationId}/submissions`,
    enabled: stationId != null,
    refetchInterval: 60_000,
    staleTime: 45_000,
  });
}

export function useIncidents() {
  return usePersistentQuery<IncidentsResponse>({
    key: 'incidents',
    path: '/api/incidents',
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}

export function useAiSnapshot() {
  return usePersistentQuery<AiSnapshot>({
    key: 'ai-snapshot',
    path: '/api/ai-snapshot',
    refetchInterval: 60_000,
    staleTime: 55_000,
    okStatuses: [202, 504],
  });
}

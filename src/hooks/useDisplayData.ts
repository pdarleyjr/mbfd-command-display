/**
 * Domain data hooks for the display. Each picks a sensible poll interval per the data's
 * volatility and rides on usePersistentQuery for last-good behavior.
 */

import { usePersistentQuery } from './usePersistentQuery';
import { useQueries } from '@tanstack/react-query';
import { getJson } from '@/lib/apiClient';
import { computeFrontlineInspectionReadiness } from '@/lib/frontlineInspections';
import { normalizeOverview, normalizeStationDetail } from '@/lib/normalize';
import type {
  AiSnapshot,
  DisplayOverview,
  DisplayStationSummary,
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
    persistMaxAgeMs: 1000 * 60 * 60 * 6,
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
    persistMaxAgeMs: 1000 * 60 * 60 * 3,
  });
  return { ...r, data: r.data ? normalizeStationDetail(r.data) : undefined };
}

export function useFrontlineInspectionStations(stations: DisplayStationSummary[] | undefined) {
  const list = stations ?? [];
  const queries = useQueries({
    queries: list.map((station) => ({
      queryKey: ['frontline-station-detail', station.id],
      queryFn: async ({ signal }: { signal?: AbortSignal }) => {
        const result = await getJson<DisplayStationDetail>(`/api/stations/${station.id}`, { signal });
        return normalizeStationDetail(result.data);
      },
      enabled: station.id != null,
      staleTime: 20_000,
      refetchInterval: 30_000,
      retry: 1,
    })),
  });

  return list.map((station, index) => {
    const detail = queries[index]?.data;
    if (!detail?.apparatus) return station;
    const apparatusCount = detail.apparatus.length;
    const inService = detail.apparatus.filter((apparatus) => /in.?service|active/i.test(apparatus.status)).length;
    return {
      ...station,
      apparatus_count: apparatusCount || station.apparatus_count,
      in_service: apparatusCount ? inService : station.in_service,
      out_of_service: apparatusCount ? Math.max(0, apparatusCount - inService) : station.out_of_service,
      readiness: computeFrontlineInspectionReadiness(station.number, detail.apparatus),
    };
  });
}

export function useStationPersonnel(stationId: number | null) {
  return usePersistentQuery<{ personnel: PersonnelMember[] } | PersonnelMember[]>({
    key: `station-${stationId ?? 'none'}-personnel`,
    path: `/api/stations/${stationId}/personnel`,
    enabled: stationId != null,
    refetchInterval: 300_000,
    staleTime: 240_000,
    persist: false,
  });
}

export function useStationSubmissions(stationId: number | null) {
  return usePersistentQuery<{ submissions: DisplaySubmissionRow[] } | DisplaySubmissionRow[]>({
    key: `station-${stationId ?? 'none'}-subs`,
    path: `/api/stations/${stationId}/submissions`,
    enabled: stationId != null,
    refetchInterval: 60_000,
    staleTime: 45_000,
    persistMaxAgeMs: 1000 * 60 * 30,
  });
}

export function useIncidents() {
  return usePersistentQuery<IncidentsResponse>({
    key: 'incidents',
    path: '/api/incidents',
    refetchInterval: 30_000,
    staleTime: 25_000,
    persistMaxAgeMs: 1000 * 60 * 30,
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

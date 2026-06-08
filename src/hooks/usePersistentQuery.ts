import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getJson, type ApiResult } from '@/lib/apiClient';
import { loadPersisted, savePersisted } from '@/lib/persistentCache';

export interface PersistentQueryOptions {
  /** localStorage + query key suffix. */
  key: string;
  /** API path (e.g. /api/snapshot). */
  path: string;
  refetchInterval?: number | false;
  staleTime?: number;
  enabled?: boolean;
  /** Treat these HTTP statuses as success (e.g. 202 generating, 504 last-good). */
  okStatuses?: number[];
}

export interface PersistentQueryResult<T> {
  query: UseQueryResult<ApiResult<T>>;
  data: T | undefined;
  /** 'origin' | 'snapshot' (edge KV) | 'persisted' (localStorage) | 'empty' | 'unknown'. */
  servedFrom: ApiResult<T>['servedFrom'] | 'persisted';
  /** Age of the data being shown, seconds (best-effort). */
  ageSeconds: number | null;
  isStaleData: boolean;
}

/**
 * useQuery + localStorage last-good. Hydrates initialData from the previous successful
 * payload so the panel paints real data immediately, and re-persists on every fresh
 * fetch. Surfaces where the data came from so the UI can show a "cached" badge.
 */
export function usePersistentQuery<T>(opts: PersistentQueryOptions): PersistentQueryResult<T> {
  const persisted = loadPersisted<T>(opts.key);

  const query = useQuery<ApiResult<T>>({
    queryKey: ['display', opts.key],
    enabled: opts.enabled ?? true,
    refetchInterval: opts.refetchInterval ?? 30_000,
    staleTime: opts.staleTime ?? 20_000,
    initialData: persisted
      ? { data: persisted.data, servedFrom: 'unknown', snapshotAgeSeconds: persisted.ageSeconds, status: 200 }
      : undefined,
    initialDataUpdatedAt: persisted ? Date.now() - persisted.ageSeconds * 1000 : undefined,
    queryFn: ({ signal }) => getJson<T>(opts.path, { signal }),
  });

  // Persist the freshest origin/edge payload for next cold start.
  useEffect(() => {
    const result = query.data;
    if (result && query.isSuccess && result.data != null) {
      savePersisted(opts.key, result.data);
    }
  }, [query.data, query.isSuccess, opts.key]);

  const result = query.data;
  let servedFrom: PersistentQueryResult<T>['servedFrom'] = result?.servedFrom ?? 'unknown';
  // If we are showing initialData while the first fetch is in flight, label it persisted.
  if (query.isPending && persisted) servedFrom = 'persisted';

  const ageSeconds = result?.snapshotAgeSeconds ?? persisted?.ageSeconds ?? null;
  const isStaleData = servedFrom === 'snapshot' || servedFrom === 'persisted' || servedFrom === 'empty';

  return { query, data: result?.data, servedFrom, ageSeconds, isStaleData };
}

import { clsx } from 'clsx';
import { formatAge, freshnessFromAge, freshnessTone, type Freshness } from '@/lib/sourceFreshness';

interface FreshnessBadgeProps {
  /** Where the data came from (edge KV snapshot / localStorage / live origin). */
  servedFrom?: 'origin' | 'snapshot' | 'persisted' | 'empty' | 'unknown';
  ageSeconds: number | null;
  /** Override the computed freshness (e.g. a camera tile reporting offline). */
  freshness?: Freshness;
  className?: string;
}

const TONE_CLASS = {
  ready: 'cg-status--ready',
  attention: 'cg-status--attention',
  critical: 'cg-status--critical',
  unknown: 'cg-status--unknown',
} as const;

/** "Live · 12s" / "Cached · 4m" / "Offline" — the per-module trust indicator. */
export function FreshnessBadge({ servedFrom, ageSeconds, freshness, className }: FreshnessBadgeProps) {
  const cached = servedFrom === 'snapshot' || servedFrom === 'persisted';
  const empty = servedFrom === 'empty';
  const f: Freshness = freshness ?? (empty ? 'offline' : freshnessFromAge(ageSeconds));
  const tone = freshnessTone(f);

  let label: string;
  if (empty) label = 'No data';
  else if (cached) label = `Cached · ${formatAge(ageSeconds)}`;
  else if (f === 'offline') label = 'Offline';
  else label = `Live · ${formatAge(ageSeconds)}`;

  return (
    <span className={clsx('cg-status', TONE_CLASS[tone], className)} title={`Source: ${servedFrom ?? 'unknown'}`}>
      <span className="cg-status__dot" />
      {label}
    </span>
  );
}

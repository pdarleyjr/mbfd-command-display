import { GlassPanel } from '@/components/common/GlassPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { FreshnessBadge } from '@/components/common/FreshnessBadge';
import { Activity } from '@/components/common/icons';
import { formatAge } from '@/lib/sourceFreshness';
import type { IncidentRecord, IncidentsResponse } from '@/types/display';

interface Props {
  data: IncidentsResponse | undefined;
  servedFrom?: 'origin' | 'snapshot' | 'persisted' | 'empty' | 'unknown';
  ageSeconds: number | null;
  className?: string;
  /** Optionally filter to a station territory (Station view). */
  filter?: (i: IncidentRecord) => boolean;
}

/** Active PulsePoint runs — count, oldest age, and the live list. Situational awareness only. */
export function ActiveRunsPanel({ data, servedFrom, ageSeconds, className, filter }: Props) {
  const active = (data?.active ?? []).filter((i) => (filter ? filter(i) : true));
  const oldest = active.reduce((m, i) => Math.max(m, ageOf(i) ?? 0), 0);

  return (
    <GlassPanel
      label="Active Runs"
      icon={<Activity size={15} />}
      className={className}
      tone={active.length > 0 ? 'live' : 'flat'}
      bodyClassName="min-h-0 overflow-hidden"
      right={<FreshnessBadge servedFrom={servedFrom} ageSeconds={ageSeconds} />}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="mb-2 flex items-baseline gap-3">
          <span className="tnum text-4xl font-extrabold leading-none text-ember">{active.length}</span>
          <span className="text-xs text-mute">
            active{active.length > 0 ? ` · oldest ${formatAge(oldest)}` : ''}
          </span>
        </div>
        {active.length === 0 ? (
          <EmptyState icon={<Activity size={22} />} title="No active runs" hint="Feed clear" />
        ) : (
          <ul className="cg-scroll-y min-h-0 flex-1 space-y-1.5 pr-1">
            {active.slice(0, 14).map((i, idx) => (
              <li key={incidentKey(i, idx)} className="cg-panel animate-slide-in flex items-center gap-2 px-2.5 py-1.5">
                <span className="cg-live__dot mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-ink">{incidentType(i)}</div>
                  {address(i) && <div className="truncate text-[11px] text-faint">{address(i)}</div>}
                </div>
                <span className="tnum shrink-0 text-[11px] text-mute">{formatAge(ageOf(i))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </GlassPanel>
  );
}

function ageOf(i: IncidentRecord): number | null {
  if (typeof i.age_seconds === 'number') return i.age_seconds;
  if (typeof i.received === 'string') {
    const t = Date.parse(i.received);
    if (!Number.isNaN(t)) return Math.max(0, Math.round((Date.now() - t) / 1000));
  }
  return null;
}
function incidentType(i: IncidentRecord): string {
  return (i.type as string) || (i.status as string) || 'Incident';
}
function address(i: IncidentRecord): string | null {
  return (i.address as string) || null;
}
function incidentKey(i: IncidentRecord, idx: number): string {
  return (i.id as string) || `${incidentType(i)}-${idx}`;
}

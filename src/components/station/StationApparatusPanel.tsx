import { clsx } from 'clsx';
import { GlassPanel } from '@/components/common/GlassPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { Truck } from '@/components/common/icons';
import { computeFrontlineInspectionSummary, normalizeApparatusKey } from '@/lib/frontlineInspections';
import type { DisplayApparatus } from '@/types/display';

interface Props {
  apparatus: DisplayApparatus[] | undefined;
  stationNumber: string;
  className?: string;
}

/** Per-station apparatus roster with status + PM health + defect count. Read-only. */
export function StationApparatusPanel({ apparatus, stationNumber, className }: Props) {
  const list = apparatus ?? [];
  const frontline = computeFrontlineInspectionSummary(stationNumber, list);
  return (
    <GlassPanel
      label="Apparatus"
      icon={<Truck size={15} />}
      className={className}
      bodyClassName="min-h-0 overflow-hidden"
      right={<span className="text-[11px] uppercase tracking-wider text-faint"><span className="tnum">{frontline.completed}/{frontline.required}</span> checked</span>}
    >
      {list.length === 0 ? (
        <EmptyState icon={<Truck size={22} />} title="No apparatus assigned" hint={`Frontline mapping expects ${frontline.requiredUnits.join(', ') || 'no units configured'}`} />
      ) : (
        <ul className="cg-scroll-y h-full min-h-0 space-y-1.5 pr-1">
          {list.map((a) => {
            const oos = !inService(a.status);
            const unitKey = normalizeApparatusKey(a.designation) ?? normalizeApparatusKey(a.unit_id) ?? normalizeApparatusKey(a.type);
            const isFrontline = unitKey ? frontline.requiredUnits.includes(unitKey) : false;
            const checkedToday = unitKey ? frontline.completedUnits.includes(unitKey) : false;
            return (
              <li key={a.id} className="flex items-center gap-3 rounded-lg bg-graphite/40 px-3 py-2">
                <span className="cg-status__dot" style={{ background: statusColor(a.status) }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">{a.designation ?? a.unit_id ?? `Unit ${a.id}`}</div>
                  <div className="truncate text-[11px] text-faint">{a.type ?? '—'}</div>
                </div>
                {a.pm_health && (
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                    style={{ background: pmTint(a.pm_health.status), color: pmColor(a.pm_health.status) }}
                    title={`PM: ${a.pm_health.hours_since_pm}h since service${a.pm_health.overdue ? ' (overdue)' : ''}`}
                  >
                    PM {a.pm_health.status}
                  </span>
                )}
                {a.defect_count > 0 && (
                  <span className="tnum rounded bg-attention/15 px-1.5 py-0.5 text-[11px] font-bold text-attention">
                    {a.defect_count}
                  </span>
                )}
                {isFrontline && (
                  <span className={checkedToday ? 'cg-status cg-status--ready' : 'cg-status cg-status--critical'}>
                    {checkedToday ? 'checked' : 'due'}
                  </span>
                )}
                <span className={clsx('w-20 shrink-0 text-right text-[11px] font-semibold', oos ? 'text-critical' : 'text-ready')}>
                  {a.status}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </GlassPanel>
  );
}

function inService(status: string): boolean {
  return /in.?service|active/i.test(status);
}
function statusColor(status: string): string {
  if (inService(status)) return 'var(--c-ready)';
  if (/maintenance/i.test(status)) return 'var(--c-attention)';
  return 'var(--c-critical)';
}
function pmColor(s: 'green' | 'yellow' | 'red'): string {
  return s === 'green' ? 'var(--c-ready)' : s === 'yellow' ? 'var(--c-attention)' : 'var(--c-critical)';
}
function pmTint(s: 'green' | 'yellow' | 'red'): string {
  return s === 'green' ? 'var(--t-ready)' : s === 'yellow' ? 'var(--t-attention)' : 'var(--t-critical)';
}

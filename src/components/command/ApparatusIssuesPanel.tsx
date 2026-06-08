import { GlassPanel } from '@/components/common/GlassPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { Wrench } from '@/components/common/icons';
import type { DefectItem } from '@/types/display';

interface Props {
  items: DefectItem[] | undefined;
  totalOpen?: number;
  criticalMissing?: number;
  className?: string;
}

/** Unresolved apparatus defects, most-aged first. Missing = critical (red). Read-only. */
export function ApparatusIssuesPanel({ items, totalOpen, criticalMissing, className }: Props) {
  const sorted = [...(items ?? [])].sort((a, b) => (b.days_open ?? 0) - (a.days_open ?? 0));
  const open = totalOpen ?? sorted.length;
  return (
    <GlassPanel
      label="Apparatus Issues"
      icon={<Wrench size={15} />}
      className={className}
      tone={open > 0 ? 'attention' : 'flat'}
      bodyClassName="min-h-0 overflow-hidden"
      right={
        <span className="text-[11px] uppercase tracking-wider text-faint">
          {criticalMissing ? <span className="tnum text-critical">{criticalMissing} critical</span> : null}
          {criticalMissing ? ' · ' : ''}
          <span className="tnum">{totalOpen ?? sorted.length}</span> open
        </span>
      }
    >
      {sorted.length === 0 ? (
        <EmptyState icon={<Wrench size={22} />} title="No open defects" hint="Fleet clear" />
      ) : (
        <ul className="cg-scroll-y h-full min-h-0 space-y-1.5 pr-1">
          {sorted.slice(0, 12).map((d, idx) => {
            const critical = (d.status ?? '').toLowerCase() === 'missing';
            return (
              <li
                key={`${d.unit}-${d.item}-${idx}`}
                className="flex items-center gap-2.5 rounded-lg bg-graphite/40 px-2.5 py-1.5"
              >
                <span
                  className={`cg-status__dot ${critical ? 'text-critical' : 'text-attention'}`}
                  style={{ background: critical ? 'var(--c-critical)' : 'var(--c-attention)' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] text-ink">
                    {d.unit && d.unit !== 'Unknown' && <span className="font-semibold">{d.unit} · </span>}
                    <span className={d.unit && d.unit !== 'Unknown' ? 'text-mute' : 'font-semibold'}>{d.item ?? 'Item'}</span>
                  </div>
                </div>
                <span className={`shrink-0 text-[11px] font-semibold ${critical ? 'text-critical' : 'text-attention'}`}>
                  {d.status}
                </span>
                {d.days_open ? (
                  <span className="tnum w-10 shrink-0 text-right text-[11px] text-faint">{d.days_open}d</span>
                ) : (
                  <span className="w-10 shrink-0" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </GlassPanel>
  );
}

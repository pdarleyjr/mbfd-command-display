import { GlassPanel } from '@/components/common/GlassPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { ClipboardCheck } from '@/components/common/icons';
import { useStationSubmissions } from '@/hooks/useDisplayData';
import { ageSeconds, formatAge } from '@/lib/sourceFreshness';
import type { DisplaySubmissionRow } from '@/types/display';

const KIND_LABEL: Record<DisplaySubmissionRow['kind'], string> = {
  apparatus_inspection: 'Checkout',
  station_inspection: 'Station insp.',
  supply_request: 'Supply',
  big_ticket: 'Big-ticket',
};

/** Latest submissions for this station (read-only; identity redacted by the hub). */
export function StationSubmissionsPanel({ stationId, className }: { stationId: number | null; className?: string }) {
  const { data } = useStationSubmissions(stationId);
  const rows: DisplaySubmissionRow[] = Array.isArray(data) ? data : (data?.submissions ?? []);
  const otherForms = rows.filter((row) => row.kind !== 'apparatus_inspection');

  return (
    <GlassPanel
      label="MBFD Forms"
      icon={<ClipboardCheck size={15} />}
      className={className}
      bodyClassName="min-h-0 overflow-hidden"
      right={
        <a
          href="https://www.mbfdhub.com/daily/stations"
          target="_blank"
          rel="noreferrer"
          className="rounded border border-[color:var(--c-hairline)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-mute transition-colors hover:text-ink"
        >
          Hub forms
        </a>
      }
    >
      {rows.length === 0 ? (
        <EmptyState icon={<ClipboardCheck size={22} />} title="No recent form submissions" hint="Daily station forms, supply requests, big-ticket requests, and other admin-submitted forms appear here" />
      ) : (
        <div className="flex h-full min-h-0 flex-col gap-2">
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <FormCount label="Vehicle" count={rows.filter((row) => row.kind === 'apparatus_inspection').length} />
            <FormCount label="Station" count={rows.filter((row) => row.kind === 'station_inspection').length} />
            <FormCount label="Other" count={otherForms.length} />
          </div>
          <ul className="cg-scroll-y min-h-0 flex-1 space-y-1.5 pr-1">
            {rows.slice(0, 12).map((r) => (
              <li key={`${r.kind}-${r.id}`} className="flex items-center gap-3 rounded-lg bg-graphite/40 px-3 py-1.5">
                <span className="shrink-0 rounded bg-cyan/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan">
                  {KIND_LABEL[r.kind] ?? r.kind}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{r.label}</span>
                {r.status && <span className="shrink-0 text-[11px] text-mute">{r.status}</span>}
                <span className="tnum w-12 shrink-0 text-right text-[11px] text-faint">{formatAge(ageSeconds(r.at))}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </GlassPanel>
  );
}

function FormCount({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-lg bg-[color:var(--c-surface-2)] px-2 py-1.5">
      <div className="tnum text-base font-extrabold text-ink">{count}</div>
      <div className="truncate text-[10px] uppercase tracking-wider text-faint">{label}</div>
    </div>
  );
}

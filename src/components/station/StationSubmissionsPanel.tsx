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

  return (
    <GlassPanel label="Recent Submissions" icon={<ClipboardCheck size={15} />} className={className} bodyClassName="min-h-0 overflow-hidden">
      {rows.length === 0 ? (
        <EmptyState icon={<ClipboardCheck size={22} />} title="No recent submissions" />
      ) : (
        <ul className="cg-scroll-y h-full min-h-0 space-y-1.5 pr-1">
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
      )}
    </GlassPanel>
  );
}

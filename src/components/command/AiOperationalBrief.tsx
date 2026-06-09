import { clsx } from 'clsx';
import { GlassPanel } from '@/components/common/GlassPanel';
import { Cpu, AlertTriangle } from '@/components/common/icons';
import { formatAge } from '@/lib/sourceFreshness';
import type { AiSnapshot, DisplayOverview } from '@/types/display';

interface Props {
  ai: AiSnapshot | undefined;
  /** HTTP-derived state: 202 generating, otherwise from payload.status. */
  status?: 'fresh' | 'stale' | 'generating' | 'unavailable';
  ageSeconds: number | null;
  /** The live snapshot — used to render a grounded summary even when the LLM is quiet. */
  snapshot?: DisplayOverview;
  className?: string;
  showStationSummaries?: boolean;
}

/**
 * Descriptive AI operational brief. It is NEVER blank: when the model's prose is present it
 * leads, but a deterministic, grounded summary computed from the live snapshot is always
 * shown underneath (or alone). The confidence bar only appears for a real, scored briefing —
 * a "0%" bar on an empty brief is worse than no bar.
 */
export function AiOperationalBrief({ ai, status, ageSeconds, snapshot, className, showStationSummaries = true }: Props) {
  const effectiveStatus = status ?? ai?.status ?? (ai ? 'fresh' : 'generating');
  const briefing = safeBriefing(ai);
  const hasProse = briefing.length > 0;
  const confidencePct = ai ? Math.round((ai.confidence ?? 0) * 100) : 0;
  const showConfidence = hasProse && confidencePct > 0;
  const grounded = groundedSummary(snapshot);

  return (
    <GlassPanel
      label="AI Operational Brief"
      icon={<Cpu size={15} />}
      className={className}
      tone={hasProse && effectiveStatus === 'fresh' ? 'live' : 'flat'}
      bodyClassName="min-h-0 overflow-hidden"
      right={
        <span className="flex items-center gap-2 text-[11px] text-faint">
          <span className="rounded-full bg-info/15 px-2 py-0.5 font-mono text-[10px] text-info">{ai?.model ?? 'grounded'}</span>
          {hasProse && <span>updated {formatAge(ageSeconds)} ago</span>}
        </span>
      }
    >
      <div className="cg-scroll-y flex h-full min-h-0 flex-col gap-2.5">
        {/* Model prose when present, else the grounded summary as the lead. */}
        {hasProse ? (
          <p className="text-[15px] leading-relaxed text-ink/95">{briefing}</p>
        ) : grounded ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-[15px] leading-relaxed text-ink/95">{grounded}</p>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-info/12 px-2 py-0.5 text-[11px] text-info">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-info" />
              {effectiveStatus === 'unavailable' ? 'Grounded counts — AI narrative offline' : 'Grounded counts — AI narrative updating'}
            </span>
          </div>
        ) : (
          <p className="text-sm text-mute">Awaiting the first snapshot…</p>
        )}

        {showStationSummaries && ai?.station_summaries && ai.station_summaries.length > 0 && (
          <ul className="space-y-1 border-t border-[color:var(--c-hairline)] pt-2 text-[13px] text-mute">
            {ai.station_summaries.slice(0, 3).map((s) => (
              <li key={s.station} className="flex gap-2">
                <span className="shrink-0 font-semibold text-info">{s.station}</span>
                <span className="cg-clamp-2">{s.summary}</span>
              </li>
            ))}
          </ul>
        )}

        {ai?.data_gaps && ai.data_gaps.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-[color:var(--c-hairline)] pt-2">
            {ai.data_gaps.slice(0, 4).map((gap) => (
              <span key={gap} className="inline-flex items-center gap-1 rounded-full bg-attention/12 px-2 py-0.5 text-[11px] text-attention">
                <AlertTriangle size={11} />
                {gap}
              </span>
            ))}
          </div>
        )}

        {showConfidence && (
          <div className="mt-auto flex items-center gap-2 pt-1 text-[11px] text-faint">
            <span className="uppercase tracking-wider">Confidence</span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[color:var(--c-surface-2)]">
              <div
                className={clsx('h-full rounded-full', confidencePct >= 70 ? 'bg-ready' : confidencePct >= 40 ? 'bg-attention' : 'bg-critical')}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
            <span className="tnum">{confidencePct}%</span>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

function safeBriefing(ai: AiSnapshot | undefined): string {
  const text = ai?.briefing?.trim() ?? '';
  if (!text) return '';
  if (ai?.mode && ai.mode !== 'descriptive') return '';
  if (/\b(should|recommend|recommendation|advise|must)\b/i.test(text)) return '';
  return text.slice(0, 900);
}

/** Deterministic, grounded one-liner from the snapshot — guarantees real insight, no LLM. */
function groundedSummary(s: DisplayOverview | undefined): string | null {
  if (!s) return null;
  const stations = s.stations ?? [];
  const total = stations.length || s.overview?.stations_total || 0;
  if (total === 0) return null;
  const ready = stations.filter((x) => x.readiness?.status === 'READY').length;
  const below = total - ready;
  const oos = s.overview?.apparatus_status?.out_of_service ?? 0;
  const openDef = s.defects?.total_open ?? 0;
  const crit = s.defects?.critical_missing ?? 0;
  const req =
    (s.requests?.fire_equipment?.pending ?? 0) +
    (s.requests?.big_ticket?.outstanding ?? 0) +
    (s.requests?.employee_equipment?.pending ?? 0);

  const parts: string[] = [];
  parts.push(
    ready === total
      ? `All ${total} stations are at readiness baseline`
      : `${ready} of ${total} stations at readiness baseline; ${below} below`,
  );
  parts.push(oos > 0 ? `${oos} apparatus out of service` : 'all apparatus in service');
  if (openDef > 0) parts.push(`${openDef} open defect${openDef === 1 ? '' : 's'}${crit > 0 ? ` (${crit} critical)` : ''}`);
  parts.push(req > 0 ? `${req} open request${req === 1 ? '' : 's'}` : 'no open requests');

  return `${parts.join(' · ')}.`;
}

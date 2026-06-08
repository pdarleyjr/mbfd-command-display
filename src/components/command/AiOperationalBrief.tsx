import { clsx } from 'clsx';
import { GlassPanel } from '@/components/common/GlassPanel';
import { Cpu, AlertTriangle } from '@/components/common/icons';
import { formatAge } from '@/lib/sourceFreshness';
import type { AiSnapshot } from '@/types/display';

interface Props {
  ai: AiSnapshot | undefined;
  /** HTTP-derived state: 202 generating, otherwise from payload.status. */
  status?: 'fresh' | 'stale' | 'generating' | 'unavailable';
  ageSeconds: number | null;
  className?: string;
  /** Show per-station lines (overview) vs hide (station view shows its own). */
  showStationSummaries?: boolean;
}

/**
 * Descriptive AI operational brief. The server contract is descriptive-only (no
 * recommendations); this component just renders it and is explicit about stale/missing
 * data and confidence. Never blocks on a spinner — shows last-good while regenerating.
 */
export function AiOperationalBrief({ ai, status, ageSeconds, className, showStationSummaries = true }: Props) {
  const effectiveStatus = status ?? ai?.status ?? (ai ? 'fresh' : 'generating');
  const confidencePct = ai ? Math.round((ai.confidence ?? 0) * 100) : 0;

  return (
    <GlassPanel
      label="AI Operational Brief"
      icon={<Cpu size={15} />}
      className={className}
      bodyClassName="min-h-0 overflow-hidden"
      right={
        <span className="flex items-center gap-2 text-[11px] text-faint">
          <span className="rounded-full bg-info/15 px-2 py-0.5 font-mono text-[10px] text-info">{ai?.model ?? 'qwen3.6:35b'}</span>
          {ai && <span>updated {formatAge(ageSeconds)} ago</span>}
        </span>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-2.5">
        {effectiveStatus === 'generating' && !ai?.briefing && (
          <div className="flex items-center gap-2 text-sm text-mute">
            <span className="h-2 w-2 animate-ping rounded-full bg-info" />
            Generating briefing from the latest snapshot…
          </div>
        )}

        {effectiveStatus === 'stale' && (
          <Banner tone="attention">Showing the last briefing while a fresh one is generated.</Banner>
        )}
        {effectiveStatus === 'unavailable' && (
          <Banner tone="critical">AI briefing service is temporarily unreachable.</Banner>
        )}

        {ai?.briefing && (
          <p className="cg-scroll-y min-h-0 flex-1 text-[15px] leading-relaxed text-ink/95">{ai.briefing}</p>
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
              <span
                key={gap}
                className="inline-flex items-center gap-1 rounded-full bg-attention/12 px-2 py-0.5 text-[11px] text-attention"
              >
                <AlertTriangle size={11} />
                {gap}
              </span>
            ))}
          </div>
        )}

        {ai && (
          <div className="flex items-center gap-2 text-[11px] text-faint">
            <span className="uppercase tracking-wider">Confidence</span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-graphite-600">
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

function Banner({ tone, children }: { tone: 'attention' | 'critical'; children: React.ReactNode }) {
  return (
    <div
      className={clsx(
        'rounded-lg px-3 py-1.5 text-[12px]',
        tone === 'attention' ? 'bg-attention/12 text-attention' : 'bg-critical/12 text-critical',
      )}
    >
      {children}
    </div>
  );
}

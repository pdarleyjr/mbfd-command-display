import { GlassPanel } from '@/components/common/GlassPanel';
import { Cpu } from '@/components/common/icons';
import { formatAge } from '@/lib/sourceFreshness';
import type { AiSnapshot } from '@/types/display';

interface Props {
  ai: AiSnapshot | undefined;
  stationNumber: string;
  stationName?: string;
  ageSeconds: number | null;
  className?: string;
}

/** The descriptive AI line for this specific station, pulled from the overview briefing. */
export function StationAiSummary({ ai, stationNumber, stationName, ageSeconds, className }: Props) {
  const match = ai?.station_summaries?.find((s) => {
    const key = s.station.toLowerCase();
    return key.includes(`station ${stationNumber}`) || key.includes(`#${stationNumber}`) || key === stationNumber || (stationName ? key.includes(stationName.toLowerCase()) : false);
  });

  return (
    <GlassPanel
      label="AI Station Summary"
      icon={<Cpu size={15} />}
      className={className}
      bodyClassName="min-h-0 overflow-hidden"
      right={
        <span className="flex items-center gap-2 text-[11px] text-faint">
          <span className="rounded-full bg-info/15 px-2 py-0.5 font-mono text-[10px] text-info">{ai?.model ?? 'qwen3.6:35b'}</span>
          {ai && <span>{formatAge(ageSeconds)} ago</span>}
        </span>
      }
    >
      {match ? (
        <p className="cg-scroll-y h-full min-h-0 text-[14px] leading-relaxed text-ink/95">{match.summary}</p>
      ) : ai ? (
        <p className="text-sm text-faint">No station-specific note in the current briefing.</p>
      ) : (
        <p className="text-sm text-faint">Awaiting AI briefing…</p>
      )}
    </GlassPanel>
  );
}

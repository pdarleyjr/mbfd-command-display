import { GlassPanel } from '@/components/common/GlassPanel';
import { FreshnessBadge } from '@/components/common/FreshnessBadge';
import { Activity, AlertTriangle, Grid, Signal, Truck } from '@/components/common/icons';
import type { DisplayOverview, IncidentsResponse } from '@/types/display';
import type { ReactNode } from 'react';

interface Props {
  snapshot?: DisplayOverview;
  incidents?: IncidentsResponse;
  servedFrom?: 'origin' | 'snapshot' | 'persisted' | 'empty' | 'unknown';
  ageSeconds: number | null;
  className?: string;
}

export function WatchStatusStrip({ snapshot, incidents, servedFrom, ageSeconds, className }: Props) {
  const stations = snapshot?.stations ?? [];
  const ready = stations.filter((station) => station.readiness?.status === 'READY').length;
  const exceptions = stations.filter((station) => station.readiness?.status && station.readiness.status !== 'READY');
  const activeRuns = incidents?.active?.length ?? 0;
  const oos = snapshot?.overview?.apparatus_status?.out_of_service ?? 0;
  const criticalMissing = snapshot?.defects?.critical_missing ?? 0;
  const attentionCount = exceptions.length + activeRuns + oos + criticalMissing;
  const posture = stations.length === 0 ? 'Awaiting snapshot' : activeRuns > 0 ? 'Active incident posture' : attentionCount > 0 ? 'Inspection watch' : 'Steady state';

  return (
    <GlassPanel
      label="Watch Desk Posture"
      icon={<Signal size={15} />}
      className={className}
      tone={activeRuns > 0 || criticalMissing > 0 ? 'live' : attentionCount > 0 ? 'attention' : 'flat'}
      bodyClassName="min-h-0"
      right={<FreshnessBadge servedFrom={servedFrom} ageSeconds={ageSeconds} />}
    >
      <div className="grid h-full min-h-0 gap-3 md:grid-cols-[1.25fr_repeat(4,minmax(0,1fr))]">
        <div className="flex min-w-0 flex-col justify-center rounded-lg bg-[color:var(--c-surface-2)] px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-faint">Current posture</div>
          <div className="font-display text-2xl font-extrabold leading-tight text-ink">{posture}</div>
          <div className="cg-clamp-2 text-sm text-mute">
            {activeRuns > 0
              ? `${activeRuns} active run${activeRuns === 1 ? '' : 's'} visible across the city feed.`
              : stations.length === 0
                ? 'Waiting for the first MBFDHub station snapshot.'
              : exceptions.length > 0
                ? `${exceptions.length} station${exceptions.length === 1 ? '' : 's'} below frontline inspection completion.`
                : 'All frontline vehicle inspections are complete.'}
          </div>
        </div>

        <StatusMetric icon={<Activity size={16} />} label="Active runs" value={activeRuns} tone={activeRuns > 0 ? 'ember' : 'mute'} detail={activeRuns > 0 ? 'PulsePoint live' : 'Feed clear'} />
        <StatusMetric icon={<Grid size={16} />} label="Inspections complete" value={stations.length > 0 ? `${ready}/${stations.length}` : '—'} tone={ready === stations.length && stations.length > 0 ? 'ready' : 'attention'} detail={stations.length === 0 ? 'No snapshot yet' : exceptions.length > 0 ? `${exceptions.length} station${exceptions.length === 1 ? '' : 's'} pending` : 'All complete'} />
        <StatusMetric icon={<Truck size={16} />} label="Apparatus OOS" value={oos} tone={oos > 0 ? 'critical' : 'ready'} detail={oos > 0 ? 'Needs attention' : 'None reported'} />
        <StatusMetric icon={<AlertTriangle size={16} />} label="Critical items" value={criticalMissing} tone={criticalMissing > 0 ? 'critical' : 'mute'} detail={criticalMissing > 0 ? 'Missing/damaged' : 'No critical gaps'} />
      </div>
    </GlassPanel>
  );
}

function StatusMetric({
  icon,
  label,
  value,
  tone,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: React.ReactNode;
  tone: 'ready' | 'attention' | 'critical' | 'ember' | 'mute';
  detail: string;
}) {
  const toneClass = {
    ready: 'text-ready',
    attention: 'text-attention',
    critical: 'text-critical',
    ember: 'text-ember',
    mute: 'text-ink',
  }[tone];

  return (
    <div className="flex min-w-0 flex-col justify-center rounded-lg border border-[color:var(--c-hairline)] bg-[color:var(--c-surface-2)] px-3 py-3">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-faint">
        <span className="text-mute">{icon}</span>
        {label}
      </div>
      <div className={`tnum font-display text-3xl font-extrabold leading-none ${toneClass}`}>{value}</div>
      <div className="truncate text-[12px] text-mute">{detail}</div>
    </div>
  );
}

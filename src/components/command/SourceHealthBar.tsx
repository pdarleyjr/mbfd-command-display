import { clsx } from 'clsx';
import type { DisplayOverview } from '@/types/display';
import { useCameraHealthStore, summarizeCameraHealth } from '@/store/cameraHealthStore';
import { FreshnessBadge } from '@/components/common/FreshnessBadge';
import { Signal, Cpu, Activity, Camera, ShieldCheck } from '@/components/common/icons';

interface Props {
  snapshot?: DisplayOverview;
  servedFrom?: 'origin' | 'snapshot' | 'persisted' | 'empty' | 'unknown';
  ageSeconds: number | null;
  aiAvailable?: boolean;
  className?: string;
}

/** Bottom trust strip: per-source health, deploy marker, snapshot age, camera + edge state. */
export function SourceHealthBar({ snapshot, servedFrom, ageSeconds, aiAvailable, className }: Props) {
  const sh = snapshot?.source_health;
  const cams = useCameraHealthStore((s) => s.states);
  const camSummary = summarizeCameraHealth(cams);

  return (
    <footer className={clsx('cg-panel flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-1.5 text-[12px]', className)}>
      <Dot ok={sh?.hub_up ?? servedFrom === 'origin'} label="Hub" icon={<Signal size={13} />} />
      <Dot ok={aiAvailable ?? sh?.ai_available ?? false} label="AI" icon={<Cpu size={13} />} />
      <Dot ok={sh?.incidents_worker_up ?? true} label="Incidents" icon={<Activity size={13} />} />
      <span className="flex items-center gap-1.5 text-mute" title="Camera feeds live / degraded / offline">
        <Camera size={13} className="text-faint" />
        <span className="tnum text-ready">{camSummary.live}</span>
        <span className="text-faint">/</span>
        <span className="tnum text-attention">{camSummary.degraded}</span>
        <span className="text-faint">/</span>
        <span className="tnum text-critical">{camSummary.offline}</span>
      </span>

      <div className="ml-auto flex items-center gap-4 text-faint">
        {sh?.last_deploy_sha && (
          <span className="flex items-center gap-1 font-mono text-[11px]" title="Hub deploy marker">
            <ShieldCheck size={12} /> {sh.last_deploy_sha.slice(0, 8)}
          </span>
        )}
        <FreshnessBadge servedFrom={servedFrom} ageSeconds={ageSeconds} />
      </div>
    </footer>
  );
}

function Dot({ ok, label, icon }: { ok: boolean; label: string; icon: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-mute" title={`${label}: ${ok ? 'up' : 'down'}`}>
      <span className="text-faint">{icon}</span>
      <span className="cg-status__dot" style={{ background: ok ? 'var(--c-ready)' : 'var(--c-critical)' }} />
      <span className="uppercase tracking-wider">{label}</span>
    </span>
  );
}

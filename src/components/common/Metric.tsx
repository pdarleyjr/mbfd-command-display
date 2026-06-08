import { clsx } from 'clsx';
import type { ReactNode } from 'react';

type Tone = 'ink' | 'ready' | 'attention' | 'critical' | 'info';

const TONE: Record<Tone, string> = {
  ink: 'text-ink',
  ready: 'text-ready',
  attention: 'text-attention',
  critical: 'text-critical',
  info: 'text-info',
};

interface MetricProps {
  value: ReactNode;
  label: string;
  tone?: Tone;
  unit?: string;
  icon?: ReactNode;
  className?: string;
  /** Slightly smaller variant for dense grids. */
  compact?: boolean;
}

/** A single glance-readable metric: big tabular value + small label. */
export function Metric({ value, label, tone = 'ink', unit, icon, className, compact }: MetricProps) {
  return (
    <div className={clsx('flex flex-col gap-0.5', className)}>
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-faint">{icon}</span>}
        <span className="cg-label">{label}</span>
      </div>
      <div className={clsx('tnum leading-none font-bold', TONE[tone])}>
        <span
          style={{
            fontSize: compact ? 'var(--fs-metric-sm, 1.6rem)' : 'var(--fs-metric)',
          }}
        >
          {value}
        </span>
        {unit && <span className="ml-1 text-mute text-[0.5em] font-semibold align-top">{unit}</span>}
      </div>
    </div>
  );
}

import { clsx } from 'clsx';
import type { ReadinessStatus } from '@/types/display';
import { readinessVisual } from '@/lib/readiness';

/** Readiness chip — glyph + word + color (never color-alone). */
export function ReadinessChip({ status, className }: { status: ReadinessStatus; className?: string }) {
  const v = readinessVisual(status);
  return (
    <span className={clsx('cg-status', v.className, className)}>
      <span aria-hidden="true">{v.glyph}</span>
      {v.label}
    </span>
  );
}

type Tone = 'ready' | 'attention' | 'critical' | 'info' | 'unknown';

const TONE_CLASS: Record<Tone, string> = {
  ready: 'cg-status--ready',
  attention: 'cg-status--attention',
  critical: 'cg-status--critical',
  info: 'cg-status--info',
  unknown: 'cg-status--unknown',
};

/** Generic labeled status chip with a leading dot. */
export function StatusChip({
  tone,
  label,
  className,
}: {
  tone: Tone;
  label: string;
  className?: string;
}) {
  return (
    <span className={clsx('cg-status', TONE_CLASS[tone], className)}>
      <span className="cg-status__dot" />
      {label}
    </span>
  );
}

import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface GlassPanelProps {
  title?: string;
  label?: string;
  icon?: ReactNode;
  /** Right-aligned header slot (badge, count, control). */
  right?: ReactNode;
  large?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
  bodyClassName?: string;
  /** Briefly pulses when data updates. */
  fresh?: boolean;
  children: ReactNode;
}

/**
 * The base glass surface. Header (label + icon + right slot) is optional; body scrolls
 * independently when constrained. Interactive panels gain a cyan drill-down stroke.
 */
export function GlassPanel({
  title,
  label,
  icon,
  right,
  large,
  interactive,
  onClick,
  className,
  bodyClassName,
  fresh,
  children,
}: GlassPanelProps) {
  const hasHeader = label || title || right || icon;
  const Tag = interactive ? 'button' : 'div';
  return (
    <Tag
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      className={clsx(
        'cg-panel flex min-h-0 flex-col text-left',
        large && 'cg-panel--lg',
        interactive && 'cg-panel--interactive cg-reset',
        fresh && 'cg-fresh',
        className,
      )}
    >
      {hasHeader && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
          <div className="flex items-center gap-2 text-mute">
            {icon}
            <span className="cg-label">{label ?? title}</span>
          </div>
          {right}
        </header>
      )}
      <div className={clsx('min-h-0 flex-1', hasHeader ? 'px-5 pb-4' : 'p-5', bodyClassName)}>
        {children}
      </div>
    </Tag>
  );
}

import type { ReactNode } from 'react';

/** Honest empty/missing-data state — used instead of a permanent spinner or blank box. */
export function EmptyState({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex h-full min-h-[80px] flex-col items-center justify-center gap-1.5 py-6 text-center">
      {icon && <span className="text-faint opacity-70">{icon}</span>}
      <div className="text-sm font-semibold text-mute">{title}</div>
      {hint && <div className="text-xs text-faint">{hint}</div>}
    </div>
  );
}

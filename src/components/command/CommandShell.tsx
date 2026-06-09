import type { ReactNode } from 'react';
import { useLayoutRegime } from '@/hooks/useEnvironment';

/** App frame: applies the layout regime, mounts the optional ambient backdrop, hosts content. */
export function CommandShell({ children }: { children: ReactNode }) {
  useLayoutRegime(); // sets data-regime / type-scale on <html>

  return (
    <>
      <div className="cg-scene-layer" aria-hidden="true" />
      <div className="cg-app">{children}</div>
    </>
  );
}

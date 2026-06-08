import { Suspense, lazy, type ReactNode } from 'react';
import { useLayoutRegime, useReducedMotion, useResolvedQuality } from '@/hooks/useEnvironment';
import { useUiStore } from '@/store/uiStore';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Ambient WebGL backdrop is optional and lazy so it never blocks first paint or the data.
const HolographicBackdrop = lazy(() =>
  import('@/components/three/HolographicBackdrop').then((m) => ({ default: m.HolographicBackdrop })),
);

/** App frame: applies the layout regime, mounts the optional ambient backdrop, hosts content. */
export function CommandShell({ children }: { children: ReactNode }) {
  useLayoutRegime(); // sets data-regime / type-scale on <html>
  const ambient = useUiStore((s) => s.ambientBackdrop);
  const quality = useResolvedQuality();
  const reducedMotion = useReducedMotion();
  const showBackdrop = ambient && quality !== 'off';

  return (
    <>
      <div className="cg-scene-layer" aria-hidden="true">
        {showBackdrop && (
          <ErrorBoundary fallback={null} label="ambient">
            <Suspense fallback={null}>
              <HolographicBackdrop reducedMotion={reducedMotion} />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>
      <div className="cg-app">{children}</div>
    </>
  );
}

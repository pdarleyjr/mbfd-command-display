/**
 * Environment hooks: viewport layout regime, resolved motion preferences, and a ticking
 * clock for the command strip.
 */

import { useEffect, useState } from 'react';
import { applyRegime, detectRegime, isNoScrollRegime, type LayoutRegime } from '@/lib/layoutRegime';
import { useUiStore } from '@/store/uiStore';

function systemPrefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Read-only viewport regime. Tracks resize/orientation; applies no side effects. */
export function useViewportRegime(): LayoutRegime {
  const [regime, setRegime] = useState<LayoutRegime>(() =>
    typeof window === 'undefined' ? 'desktop' : detectRegime(window.innerWidth, window.innerHeight),
  );

  useEffect(() => {
    let raf = 0;
    const recompute = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setRegime(detectRegime(window.innerWidth, window.innerHeight)));
    };
    window.addEventListener('resize', recompute);
    window.addEventListener('orientationchange', recompute);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', recompute);
      window.removeEventListener('orientationchange', recompute);
    };
  }, []);

  return regime;
}

/** Owns the regime side effect: writes data-regime / data-display / --type-scale on <html>. */
export function useLayoutRegime(): { regime: LayoutRegime; isDisplay: boolean } {
  const displayMode = useUiStore((s) => s.displayMode);
  const regime = useViewportRegime();

  useEffect(() => {
    applyRegime(regime, displayMode);
  }, [regime, displayMode]);

  return { regime, isDisplay: displayMode || isNoScrollRegime(regime) };
}

export function useReducedMotion(): boolean {
  const pref = useUiStore((s) => s.motionPref);
  const [systemReduced, setSystemReduced] = useState<boolean>(() => systemPrefersReducedMotion());
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setSystemReduced(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  if (pref === 'off') return true;
  if (pref === 'on') return false;
  return systemReduced;
}

export function useClock(intervalMs = 1000): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

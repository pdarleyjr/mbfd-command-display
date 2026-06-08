/**
 * Environment hooks: viewport layout regime, resolved motion/GPU preferences, and a
 * ticking clock for the command strip.
 */

import { useEffect, useState } from 'react';
import { applyRegime, detectRegime, isNoScrollRegime, type LayoutRegime } from '@/lib/layoutRegime';
import { useUiStore } from '@/store/uiStore';
import { prefersReducedMotion as mqReducedMotion, recommendedQuality } from '@/lib/webgl';

export function useLayoutRegime(): { regime: LayoutRegime; isDisplay: boolean } {
  const displayMode = useUiStore((s) => s.displayMode);
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

  useEffect(() => {
    applyRegime(regime, displayMode);
  }, [regime, displayMode]);

  return { regime, isDisplay: displayMode || isNoScrollRegime(regime) };
}

export function useReducedMotion(): boolean {
  const pref = useUiStore((s) => s.motionPref);
  const [systemReduced, setSystemReduced] = useState<boolean>(() => mqReducedMotion());
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

export function useResolvedQuality(): 'high' | 'low' | 'off' {
  const pref = useUiStore((s) => s.qualityPref);
  if (pref === 'high' || pref === 'low' || pref === 'off') return pref;
  return recommendedQuality();
}

export function useClock(intervalMs = 1000): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Layout regimes — the same DOM reflows from a laptop to a 12372×2160 video wall.
 * detectRegime() classifies the viewport; applyRegime() sets data attributes + the
 * type scale that the CSS reads.
 */

export type LayoutRegime =
  | 'compact' // laptops / small windows
  | 'desktop' // standard horizontal monitor
  | 'wide' // large 1080p/1440p
  | 'ultrawide' // 21:9+ monitors
  | 'wall' // video-wall arrays (e.g. 12372×2160)
  | 'portrait'; // vertical monitors

const TYPE_SCALE: Record<LayoutRegime, number> = {
  compact: 0.92,
  desktop: 1,
  wide: 1.12,
  ultrawide: 1.32,
  wall: 1.8,
  portrait: 1.05,
};

export function detectRegime(width: number, height: number): LayoutRegime {
  const aspect = width / Math.max(1, height);
  if (height > width * 1.1) return 'portrait';
  if (width >= 5000) return 'wall';
  if (width >= 2560 && aspect >= 2.0) return 'ultrawide';
  if (width >= 1920) return 'wide';
  if (width >= 1280) return 'desktop';
  return 'compact';
}

export function typeScaleFor(regime: LayoutRegime): number {
  return TYPE_SCALE[regime];
}

/**
 * True for regimes that should fill exactly one screen with no scroll (glance-first
 * video walls). Standard monitors and laptops — including 1080p "wide" — get the
 * scrolling FLOW layout instead, because a single 1080p screen cannot legibly hold the
 * full command composition without cramming. Only genuine walls / ultrawide arrays, or
 * the manual Wall toggle, lock to no-scroll.
 */
export function isNoScrollRegime(regime: LayoutRegime): boolean {
  return regime === 'wall' || regime === 'ultrawide';
}

export function applyRegime(regime: LayoutRegime, displayMode: boolean): void {
  const root = document.documentElement;
  root.dataset.regime = regime;
  root.dataset.display = displayMode || isNoScrollRegime(regime) ? '1' : '0';
  root.style.setProperty('--type-scale', String(TYPE_SCALE[regime]));
}

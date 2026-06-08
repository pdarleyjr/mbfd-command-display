/**
 * WebGL capability + motion/quality heuristics for the spatial Operations Map.
 *
 * All checks are defensive and run once: the dashboard renders on a fixed command
 * wall (high-power) but may also be opened on a low-power kiosk or a tablet, so we
 * degrade to the SVG fallback (OperationsMap2D) rather than risk a black canvas.
 */

export type RenderQuality = 'high' | 'low' | 'off';

let cachedWebGL: boolean | null = null;

/**
 * Try to obtain a real WebGL2 (then WebGL1) context on a throwaway canvas.
 * Cached after the first call — the answer never changes within a session and the
 * probe allocates a context we immediately discard.
 */
export function detectWebGL(): boolean {
  if (cachedWebGL !== null) return cachedWebGL;

  if (typeof document === 'undefined') {
    cachedWebGL = false;
    return cachedWebGL;
  }

  try {
    const canvas = document.createElement('canvas');
    const attrs: WebGLContextAttributes = { failIfMajorPerformanceCaveat: false };
    const gl =
      canvas.getContext('webgl2', attrs) ??
      canvas.getContext('webgl', attrs) ??
      canvas.getContext('experimental-webgl', attrs);

    cachedWebGL = gl instanceof WebGLRenderingContext || isWebGL2(gl);

    // Best-effort release of the probe context.
    if (gl && 'getExtension' in gl) {
      const lose = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context');
      lose?.loseContext();
    }
  } catch {
    cachedWebGL = false;
  }

  return cachedWebGL;
}

function isWebGL2(gl: unknown): boolean {
  return typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
}

/** Whether the operator/system has requested reduced motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Heuristic device tier. The command wall has many cores; phones/kiosks do not.
 * deviceMemory is non-standard (Chromium) so it is treated as a hint only.
 */
export function recommendedQuality(): 'high' | 'low' {
  if (typeof navigator === 'undefined') return 'low';

  const cores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 4;
  const memory = readDeviceMemory();

  if (cores <= 4) return 'low';
  if (memory !== null && memory <= 4) return 'low';

  return 'high';
}

function readDeviceMemory(): number | null {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null;
}

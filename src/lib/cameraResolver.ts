/**
 * Resolve a catalog camera into a concrete playback strategy.
 *
 * Order of preference per source type:
 *   ozolio    → media-control wrapper iframe + poster fallback (no browser HLS CORS noise)
 *   hls       → media-control wrapper iframe + poster fallback (no browser HLS CORS noise)
 *   telemetry → JSON endpoint, rendered as a data card
 */

import type { StationCamera } from '@/data/stationCameraCatalog';

export type CameraPlayKind = 'hls' | 'iframe' | 'telemetry' | 'image';

export interface ResolvedCamera {
  kind: CameraPlayKind;
  /** Primary source: an HLS manifest url, an iframe url, a YouTube embed url, or a JSON url. */
  src: string | null;
  /** Iframe fallback (media-control wrapper) when native playback fails. */
  iframeFallback: string | null;
  poster: string | null;
}

export function resolveCamera(cam: StationCamera): ResolvedCamera {
  switch (cam.sourceType) {
    case 'iframe': // Ozolio / hosted wrapper. Prefer the wrapper to avoid browser-level HLS errors.
      return {
        kind: cam.wrapperUrl ? 'iframe' : 'image',
        src: cam.wrapperUrl ?? cam.posterUrl,
        iframeFallback: null,
        poster: cam.posterUrl,
      };

    case 'hls': // MBTV / hosted HLS wrapper. Avoid direct manifest fetches in the browser.
      if (cam.wrapperUrl) {
        return {
          kind: 'iframe',
          src: cam.wrapperUrl,
          iframeFallback: null,
          poster: cam.posterUrl,
        };
      }
      return {
        kind: 'image',
        src: cam.posterUrl,
        iframeFallback: null,
        poster: cam.posterUrl,
      };

    case 'telemetry':
      return { kind: 'telemetry', src: cam.telemetryUrl ?? null, iframeFallback: null, poster: null };

    case 'image':
      return { kind: 'image', src: cam.posterUrl, iframeFallback: cam.wrapperUrl ?? null, poster: cam.posterUrl };

    default:
      return { kind: 'iframe', src: cam.wrapperUrl ?? null, iframeFallback: null, poster: cam.posterUrl };
  }
}

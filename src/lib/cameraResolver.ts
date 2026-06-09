/**
 * Resolve a catalog camera into a concrete playback strategy.
 *
 * Order of preference per source type:
 *   youtube   → youtube-nocookie embed (works on any origin, no relay dependency)
 *   ozolio    → native HLS via our edge resolver (/api/cameras/ozolio?oid=…) + hls.js;
 *               iframe wrapper + poster as fallbacks (never a black frame)
 *   hls(news) → public direct master if present, else edge proxy (/api/cameras/news?key=…)
 *   telemetry → JSON endpoint, rendered as a data card
 */

import { API_BASE } from './apiClient';
import type { StationCamera } from '@/data/stationCameraCatalog';

export type CameraPlayKind = 'youtube' | 'hls' | 'iframe' | 'telemetry' | 'image';

export interface ResolvedCamera {
  kind: CameraPlayKind;
  /** Primary source: an HLS manifest url, an iframe url, a YouTube embed url, or a JSON url. */
  src: string | null;
  /** Iframe fallback (media-control wrapper) when native playback fails. */
  iframeFallback: string | null;
  poster: string | null;
}

export function youtubeEmbed(id: string): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    rel: '0',
    playsinline: '1',
    modestbranding: '1',
    loop: '1',
    playlist: id,
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

export function resolveCamera(cam: StationCamera): ResolvedCamera {
  const useEdgeResolvers = !import.meta.env.DEV || import.meta.env.VITE_USE_CAMERA_RESOLVERS === '1';
  switch (cam.sourceType) {
    case 'youtube':
      return {
        kind: 'youtube',
        src: cam.youtubeId ? youtubeEmbed(cam.youtubeId) : null,
        iframeFallback: null,
        poster: cam.posterUrl,
      };

    case 'iframe': // Ozolio / hosted wrapper. Prefer the wrapper to avoid browser-level HLS errors.
      return {
        kind: cam.wrapperUrl ? 'iframe' : 'image',
        src: cam.wrapperUrl ?? cam.posterUrl,
        iframeFallback: null,
        poster: cam.posterUrl,
      };

    case 'hls': // news
      if (!useEdgeResolvers && cam.wrapperUrl) {
        return {
          kind: 'iframe',
          src: cam.wrapperUrl,
          iframeFallback: null,
          poster: cam.posterUrl,
        };
      }
      return {
        kind: 'hls',
        src: cam.directHls ?? (cam.newsKey ? `${API_BASE}/api/cameras/news?key=${encodeURIComponent(cam.newsKey)}` : null),
        iframeFallback: cam.wrapperUrl ?? null,
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

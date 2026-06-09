/**
 * HLS attach helper. Uses native HLS where the browser supports it (Safari / iOS),
 * otherwise hls.js. Reports playback state so the camera tile can show
 * reconnecting / stale / offline overlays and never a black empty frame.
 */

import type Hls from 'hls.js';

export type HlsState = 'loading' | 'playing' | 'reconnecting' | 'offline';

export interface HlsHandle {
  destroy: () => void;
}

export function canPlayNativeHls(video: HTMLVideoElement): boolean {
  return video.canPlayType('application/vnd.apple.mpegurl') !== '';
}

export function attachHls(
  video: HTMLVideoElement,
  src: string,
  onState: (state: HlsState) => void,
): HlsHandle {
  onState('loading');

  // Native HLS path.
  if (canPlayNativeHls(video)) {
    video.src = src;
    let reconnectTimer: number | null = null;
    let offlineTimer: number | null = window.setTimeout(() => onState('offline'), 12_000);
    const clearTimers = () => {
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (offlineTimer) window.clearTimeout(offlineTimer);
      reconnectTimer = null;
      offlineTimer = null;
    };
    const onPlaying = () => {
      clearTimers();
      onState('playing');
    };
    const onCanPlay = () => clearTimers();
    const onError = () => {
      onState('reconnecting');
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      reconnectTimer = window.setTimeout(() => onState('offline'), 8_000);
    };
    video.addEventListener('playing', onPlaying);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onError);
    void video.play().catch(() => onState('reconnecting'));
    return {
      destroy() {
        clearTimers();
        video.removeEventListener('playing', onPlaying);
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('error', onError);
        video.removeAttribute('src');
        video.load();
      },
    };
  }

  let destroyed = false;
  let hls: Hls | null = null;
  let recoverAttempts = 0;
  void import('hls.js')
    .then(({ default: HlsCtor }) => {
      if (destroyed) return;
      if (!HlsCtor.isSupported()) {
        onState('offline');
        return;
      }

      hls = new HlsCtor({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 12,
        manifestLoadingMaxRetry: 4,
        manifestLoadingRetryDelay: 1500,
        fragLoadingMaxRetry: 6,
      });

      hls.on(HlsCtor.Events.MEDIA_ATTACHED, () => hls?.loadSource(src));
      hls.on(HlsCtor.Events.MANIFEST_PARSED, () => {
        void video.play().catch(() => onState('reconnecting'));
      });
      hls.on(HlsCtor.Events.FRAG_BUFFERED, () => onState('playing'));
      hls.on(HlsCtor.Events.ERROR, (_evt, data) => {
        if (!data.fatal) return;
        switch (data.type) {
          case HlsCtor.ErrorTypes.NETWORK_ERROR:
            onState('reconnecting');
            hls?.startLoad();
            break;
          case HlsCtor.ErrorTypes.MEDIA_ERROR:
            onState('reconnecting');
            if (recoverAttempts++ < 2) hls?.recoverMediaError();
            else onState('offline');
            break;
          default:
            onState('offline');
            hls?.destroy();
        }
      });

      hls.attachMedia(video);
    })
    .catch(() => onState('offline'));

  return {
    destroy() {
      destroyed = true;
      hls?.destroy();
    },
  };
}

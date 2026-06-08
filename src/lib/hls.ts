/**
 * HLS attach helper. Uses native HLS where the browser supports it (Safari / iOS),
 * otherwise hls.js. Reports playback state so the camera tile can show
 * reconnecting / stale / offline overlays and never a black empty frame.
 */

import Hls from 'hls.js';

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
    const onPlaying = () => onState('playing');
    const onError = () => onState('reconnecting');
    video.addEventListener('playing', onPlaying);
    video.addEventListener('error', onError);
    void video.play().catch(() => onState('reconnecting'));
    return {
      destroy() {
        video.removeEventListener('playing', onPlaying);
        video.removeEventListener('error', onError);
        video.removeAttribute('src');
        video.load();
      },
    };
  }

  if (!Hls.isSupported()) {
    onState('offline');
    return { destroy() {} };
  }

  const hls = new Hls({
    enableWorker: true,
    lowLatencyMode: false,
    maxBufferLength: 12,
    manifestLoadingMaxRetry: 4,
    manifestLoadingRetryDelay: 1500,
    fragLoadingMaxRetry: 6,
  });

  let recoverAttempts = 0;

  hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(src));
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    void video.play().catch(() => onState('reconnecting'));
  });
  hls.on(Hls.Events.FRAG_BUFFERED, () => onState('playing'));
  hls.on(Hls.Events.ERROR, (_evt, data) => {
    if (!data.fatal) return;
    switch (data.type) {
      case Hls.ErrorTypes.NETWORK_ERROR:
        onState('reconnecting');
        hls.startLoad();
        break;
      case Hls.ErrorTypes.MEDIA_ERROR:
        onState('reconnecting');
        if (recoverAttempts++ < 2) hls.recoverMediaError();
        else onState('offline');
        break;
      default:
        onState('offline');
        hls.destroy();
    }
  });

  hls.attachMedia(video);
  return {
    destroy() {
      hls.destroy();
    },
  };
}

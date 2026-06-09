import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import type { StationCamera, CamHealth } from '@/data/stationCameraCatalog';
import { resolveCamera } from '@/lib/cameraResolver';
import { attachHls, type HlsState } from '@/lib/hls';
import { useCameraHealthStore } from '@/store/cameraHealthStore';
import { formatAge } from '@/lib/sourceFreshness';
import { Camera as CameraIcon, Refresh } from '@/components/common/icons';
import { MarineTelemetryCard } from './MarineTelemetryCard';

/** Fallback ladder: live media → iframe wrapper → last-good poster → unavailable tile. */
type Stage = 'media' | 'iframe' | 'poster' | 'dead';

interface CameraTileProps {
  camera: StationCamera;
  className?: string;
  /** Show the dev-only manual refresh control. */
  allowRefresh?: boolean;
}

function hlsToHealth(s: HlsState): CamHealth {
  if (s === 'playing') return 'live';
  if (s === 'loading' || s === 'reconnecting') return 'reconnecting';
  return 'offline';
}

const HEALTH_LABEL: Record<CamHealth, string> = {
  live: 'LIVE',
  reconnecting: 'RECONNECTING',
  stale: 'STALE',
  offline: 'OFFLINE',
  unknown: '—',
};

export function CameraTile({ camera, className, allowRefresh }: CameraTileProps) {
  const resolved = resolveCamera(camera);
  const report = useCameraHealthStore((s) => s.report);
  const lastHealthyAt = useCameraHealthStore((s) => s.states[camera.id]?.lastHealthyAt ?? null);

  const [stage, setStage] = useState<Stage>(() => {
    if (resolved.kind === 'telemetry') return 'media';
    if (resolved.kind === 'hls' && resolved.src) return 'media';
    if (resolved.kind === 'iframe' && resolved.src) return 'iframe';
    if (resolved.iframeFallback) return 'iframe';
    if (resolved.poster) return 'poster';
    return 'dead';
  });
  const [health, setHealth] = useState<CamHealth>('unknown');
  const [reloadKey, setReloadKey] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Telemetry tiles render their own card.
  const isTelemetry = resolved.kind === 'telemetry';

  useEffect(() => {
    if (isTelemetry || stage !== 'media' || resolved.kind !== 'hls' || !resolved.src) return;
    const video = videoRef.current;
    if (!video) return;
    const handle = attachHls(video, resolved.src, (s) => {
      const h = hlsToHealth(s);
      setHealth(h);
      report(camera.id, h);
      if (s === 'offline') {
        // Escalate down the ladder.
        setStage(resolved.iframeFallback ? 'iframe' : resolved.poster ? 'poster' : 'dead');
      }
    });
    return () => handle.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, resolved.src, reloadKey, camera.id, isTelemetry]);

  function refresh() {
    setHealth('reconnecting');
    setStage(
      resolved.kind === 'hls' && resolved.src
        ? 'media'
        : resolved.kind === 'iframe' && resolved.src
          ? 'iframe'
          : resolved.iframeFallback
            ? 'iframe'
            : resolved.poster
              ? 'poster'
              : 'dead',
    );
    setReloadKey((k) => k + 1);
  }

  if (isTelemetry) {
    return <MarineTelemetryCard camera={camera} className={className} />;
  }

  return (
    <figure className={clsx('cg-panel relative aspect-video min-h-0 overflow-hidden', className)}>
      {/* Media layer */}
      {stage === 'media' && resolved.kind === 'hls' && (
        <video
          key={reloadKey}
          ref={videoRef}
          muted
          playsInline
          autoPlay
          poster={resolved.poster ?? undefined}
          className="absolute inset-0 h-full w-full bg-[color:var(--c-surface-2)] object-cover"
        />
      )}
      {stage === 'iframe' && (resolved.src || resolved.iframeFallback) && (
        <iframe
          key={`if-${reloadKey}`}
          src={resolved.kind === 'iframe' ? (resolved.src ?? resolved.iframeFallback ?? undefined) : (resolved.iframeFallback ?? undefined)}
          title={camera.displayName}
          className="absolute inset-0 h-full w-full border-0"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
          onLoad={() => {
            setHealth('live');
            report(camera.id, 'live');
          }}
        />
      )}
      {stage === 'poster' && resolved.poster && (
        <img src={resolved.poster} alt={camera.displayName} className="absolute inset-0 h-full w-full object-cover opacity-80" />
      )}
      {stage === 'dead' && (
        <div className="absolute inset-0 grid place-content-center bg-graphite text-center text-mute">
          <CameraIcon size={26} className="mx-auto mb-1 opacity-50" />
          <div className="text-xs font-semibold">Source unavailable</div>
          {lastHealthyAt && (
            <div className="text-[11px] text-faint">Last seen {formatAge(Math.round((Date.now() - lastHealthyAt) / 1000))} ago</div>
          )}
        </div>
      )}

      {/* Gradient + labels */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-2">
        <figcaption className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-ink drop-shadow">{camera.displayName}</div>
            <div className="truncate text-[10px] uppercase tracking-wider text-mute">{camera.territoryLabel}</div>
          </div>
          <HealthChip health={health} />
        </figcaption>
      </div>

      {(health === 'reconnecting' || stage === 'iframe') && health !== 'live' && (
        <div className="pointer-events-none absolute inset-0 grid place-content-center">
          <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-attention">
            Reconnecting…
          </span>
        </div>
      )}

      {allowRefresh && (
        <button
          type="button"
          onClick={refresh}
          className="absolute bottom-2 right-2 rounded-full bg-black/55 p-1.5 text-mute hover:text-ink"
          title="Reload feed"
        >
          <Refresh size={14} />
        </button>
      )}
    </figure>
  );
}

function HealthChip({ health }: { health: CamHealth }) {
  if (health === 'live') {
    return (
      <span className="cg-live shrink-0 rounded-full bg-black/50 px-2 py-0.5">
        <span className="cg-live__dot" />
        LIVE
      </span>
    );
  }
  const tone = health === 'offline' ? 'text-critical' : health === 'unknown' ? 'text-faint' : 'text-attention';
  return (
    <span className={clsx('shrink-0 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold tracking-wider', tone)}>
      {HEALTH_LABEL[health]}
    </span>
  );
}

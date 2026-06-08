import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import type { StationCamera } from '@/data/stationCameraCatalog';
import { Waves, Anchor } from '@/components/common/icons';

/**
 * Renders keyless marine telemetry (Open-Meteo waves/SST, NOAA tide predictions) for the
 * Station 6 marine context. These endpoints send permissive CORS, so the browser fetches
 * them directly. Shows an honest "unavailable" state on failure — never fabricated values.
 */
interface Props {
  camera: StationCamera;
  className?: string;
}

interface MarineCurrent {
  wave_height?: number;
  sea_surface_temperature?: number;
  wave_period?: number;
  wave_direction?: number;
}

interface TidePrediction {
  t: string;
  v: string;
  type: 'H' | 'L';
}

export function MarineTelemetryCard({ camera, className }: Props) {
  const [error, setError] = useState(false);
  const [marine, setMarine] = useState<MarineCurrent | null>(null);
  const [tides, setTides] = useState<TidePrediction[] | null>(null);
  const isTide = camera.sourceProvider.toLowerCase().includes('noaa');

  useEffect(() => {
    if (!camera.telemetryUrl) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(camera.telemetryUrl as string);
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as Record<string, unknown>;
        if (cancelled) return;
        if (isTide) {
          setTides(((data.predictions as TidePrediction[]) ?? []).slice(0, 4));
        } else {
          setMarine((data.current as MarineCurrent) ?? null);
        }
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    };
    void load();
    const id = window.setInterval(load, (camera.refreshSeconds ?? 600) * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [camera.telemetryUrl, camera.refreshSeconds, isTide]);

  return (
    <figure className={clsx('cg-panel relative flex aspect-video min-h-0 flex-col p-3', className)}>
      <div className="mb-1 flex items-center gap-1.5 text-marine">
        {isTide ? <Anchor size={15} /> : <Waves size={15} />}
        <span className="cg-label text-marine/90">{camera.displayName}</span>
      </div>

      {error && <div className="my-auto text-center text-xs text-faint">Telemetry unavailable</div>}

      {!error && !isTide && marine && (
        <div className="my-auto grid grid-cols-2 gap-2">
          <Stat label="Wave" value={fmt(marine.wave_height, 'ft')} />
          <Stat label="Sea Temp" value={fmt(marine.sea_surface_temperature, '°F')} />
          <Stat label="Period" value={fmt(marine.wave_period, 's')} />
          <Stat label="Dir" value={marine.wave_direction != null ? `${Math.round(marine.wave_direction)}°` : '—'} />
        </div>
      )}

      {!error && isTide && tides && (
        <ul className="my-auto grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
          {tides.map((t) => (
            <li key={t.t} className="flex items-baseline justify-between gap-2">
              <span className={clsx('text-xs font-semibold', t.type === 'H' ? 'text-info' : 'text-marine')}>
                {t.type === 'H' ? 'High' : 'Low'}
              </span>
              <span className="tnum text-ink">{t.t.slice(11, 16)}</span>
              <span className="tnum text-mute">{Number(t.v).toFixed(1)}ft</span>
            </li>
          ))}
        </ul>
      )}

      {!error && !marine && !tides && <div className="my-auto text-center text-xs text-faint">Loading…</div>}
    </figure>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="cg-label">{label}</div>
      <div className="tnum text-lg font-bold text-ink">{value}</div>
    </div>
  );
}

function fmt(n: number | undefined, unit: string): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${Math.round(n * 10) / 10}${unit}`;
}

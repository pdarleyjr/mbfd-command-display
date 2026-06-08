import { clsx } from 'clsx';
import { Canvas } from '@react-three/fiber';
import type { DisplayStationSummary, IncidentRecord } from '@/types/display';
import { STATION_TERRITORIES } from '@/data/stationTerritories';
import { detectWebGL } from '@/lib/webgl';
import { isNoScrollRegime } from '@/lib/layoutRegime';
import { useViewportRegime } from '@/hooks/useEnvironment';
import { useUiStore } from '@/store/uiStore';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { MapPin } from '@/components/common/icons';
import { SpatialCommandScene } from '@/components/three/SpatialCommandScene';
import { OperationsMap2D } from './OperationsMap2D';

interface OperationsMapProps {
  stations: DisplayStationSummary[];
  incidents: IncidentRecord[];
  selectedStationNumber: string | null;
  onSelectStation: (stationNumber: string) => void;
  quality?: 'high' | 'low' | 'off';
  reducedMotion?: boolean;
  className?: string;
}

/**
 * The spatial operations map. Renders the WebGL scene when capable, otherwise the SVG
 * fallback (OperationsMap2D). A nested error boundary drops to 2D if the GL context is
 * lost. Station labels + the legend are HTML/SVG overlays — no operational text in WebGL.
 */
export function OperationsMap({
  stations,
  incidents,
  selectedStationNumber,
  onSelectStation,
  quality = 'high',
  reducedMotion = false,
  className,
}: OperationsMapProps) {
  // The 3D spatial scene is reserved for genuine video walls (or the manual Wall toggle),
  // where its scale reads as intentional. On laptops/desktops the labeled top-down 2D map
  // is far more legible, so it is the default there. GPU "Off" forces 2D everywhere.
  const regime = useViewportRegime();
  const wallMode = useUiStore((s) => s.displayMode) || isNoScrollRegime(regime);
  const webgl = detectWebGL();
  const use2D = quality === 'off' || !webgl || !wallMode;
  const sceneQuality: 'high' | 'low' = quality === 'low' ? 'low' : 'high';

  const fallback = (
    <OperationsMap2D
      stations={stations}
      incidents={incidents}
      selectedStationNumber={selectedStationNumber}
      onSelectStation={onSelectStation}
      reducedMotion={reducedMotion}
    />
  );

  return (
    <section className={clsx('cg-panel cg-panel--lg relative overflow-hidden', className)}>
      <div className="absolute left-4 top-3 z-10 flex items-center gap-2 text-mute">
        <MapPin size={15} className="text-cyan" />
        <span className="cg-label">Operations Map — Miami Beach</span>
      </div>

      <div className="absolute inset-0">
        {use2D ? (
          fallback
        ) : (
          <ErrorBoundary label="Operations map" fallback={fallback}>
            <Canvas
              gl={{ antialias: true, alpha: true, powerPreference: sceneQuality === 'high' ? 'high-performance' : 'low-power' }}
              dpr={[1, sceneQuality === 'high' ? 2 : 1.5]}
              camera={{ position: [0, 7, 9], fov: 42 }}
            >
              <SpatialCommandScene
                stations={stations}
                incidents={incidents}
                selectedStationNumber={selectedStationNumber}
                onSelectStation={onSelectStation}
                quality={sceneQuality}
                reducedMotion={reducedMotion}
              />
            </Canvas>
          </ErrorBoundary>
        )}
      </div>

      {/* Legend overlay (HTML). */}
      <div className="absolute bottom-3 left-4 z-10 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-wider text-faint">
        {STATION_TERRITORIES.map((t) => (
          <span key={t.number} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: t.accent }} />
            {t.isMarine ? 'Marine' : t.number}
          </span>
        ))}
        <span className="inline-flex items-center gap-1 text-ember">
          <span className="h-2 w-2 rounded-full bg-ember" /> Run
        </span>
      </div>

      <span className="absolute bottom-3 right-4 z-10 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-faint">
        {use2D ? '2D' : 'WebGL'}
      </span>
    </section>
  );
}

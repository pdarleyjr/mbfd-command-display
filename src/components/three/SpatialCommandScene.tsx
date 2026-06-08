/**
 * SpatialCommandScene — the R3F scene graph for the Operations Map.
 *
 * Composes terrain, territory bands, station nodes, incident pings, the marine
 * layer, a faint relational network, lights/fog, optional limited orbit, and a
 * very slow auto-orbit (high quality + motion only). Postprocessing (a restrained
 * bloom) is applied only on high quality with motion enabled.
 *
 * The scene is purely spatial — all operational text lives in HTML overlays.
 */

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import type { DisplayStationSummary, IncidentRecord } from '@/types/display';
import { territoryByNumber } from '@/data/stationTerritories';
import { MiamiBeachTerrain, mapToScene, TERRAIN_Y } from './MiamiBeachTerrain';
import { TerritoryBands } from './TerritoryBands';
import { StationNodes } from './StationNodes';
import { IncidentPings } from './IncidentPings';
import { MarineLayer } from './MarineLayer';

interface SpatialCommandSceneProps {
  stations: DisplayStationSummary[];
  incidents: IncidentRecord[];
  selectedStationNumber: string | null;
  onSelectStation: (stationNumber: string) => void;
  quality: 'high' | 'low';
  reducedMotion: boolean;
}

export function SpatialCommandScene({
  stations,
  incidents,
  selectedStationNumber,
  onSelectStation,
  quality,
  reducedMotion,
}: SpatialCommandSceneProps): React.JSX.Element {
  const allowPost = quality === 'high' && !reducedMotion;
  const allowAutoOrbit = quality === 'high' && !reducedMotion;

  return (
    <>
      {/* Ambient lighting — soft, no harsh highlights. */}
      <ambientLight intensity={0.55} color="#acc4e6" />
      <hemisphereLight args={['#2b4a6e', '#070c16', 0.5]} />
      <directionalLight position={[3, 8, 6]} intensity={0.6} color="#cfe2ff" />
      <pointLight position={[0, 5, -4]} intensity={0.4} color="#37e6e0" distance={20} decay={2} />

      {/* Faint depth fog so far nodes recede into the navy. */}
      <fog attach="fog" args={['#070c16', 12, 26]} />

      <MiamiBeachTerrain />
      <TerritoryBands selectedStationNumber={selectedStationNumber} />
      <NetworkLines stations={stations} reducedMotion={reducedMotion} />
      <MarineLayer reducedMotion={reducedMotion} />
      <IncidentPings incidents={incidents} reducedMotion={reducedMotion} />
      <StationNodes
        stations={stations}
        selectedStationNumber={selectedStationNumber}
        onSelectStation={onSelectStation}
        reducedMotion={reducedMotion}
      />

      <CameraRig autoOrbit={allowAutoOrbit} />

      {/* Operator can nudge the view but never lose it. Disabled under reduced motion. */}
      {!reducedMotion && (
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minPolarAngle={Math.PI * 0.18}
          maxPolarAngle={Math.PI * 0.46}
          minAzimuthAngle={-Math.PI * 0.18}
          maxAzimuthAngle={Math.PI * 0.18}
          target={[0, 0.6, 0]}
        />
      )}

      {allowPost && (
        <EffectComposer>
          <Bloom intensity={0.6} luminanceThreshold={0.6} luminanceSmoothing={0.2} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
}

/**
 * Very slow, small-amplitude camera drift around the island — only when enabled.
 * Skips entirely if OrbitControls is taking input (reduced-motion path has no rig
 * motion anyway, and the rig is only mounted when autoOrbit is true).
 */
function CameraRig({ autoOrbit }: { autoOrbit: boolean }): null {
  const camera = useThree((state) => state.camera);
  const baseRadius = useRef(Math.hypot(0, 9));

  useFrame((state) => {
    if (!autoOrbit) return;
    const t = state.clock.elapsedTime * 0.04; // very slow
    const amp = 0.6; // small lateral amplitude
    camera.position.x = Math.sin(t) * amp;
    camera.position.z = baseRadius.current + Math.cos(t) * 0.3;
    camera.lookAt(0, 0.6, 0);
  });

  return null;
}

/** Faint cyan web connecting station nodes — communicates relational geometry only. */
function NetworkLines({
  stations,
  reducedMotion,
}: {
  stations: DisplayStationSummary[];
  reducedMotion: boolean;
}): React.JSX.Element | null {
  const materialRef = useRef<THREE.LineBasicMaterial>(null);

  const geometry = useMemo<THREE.BufferGeometry | null>(() => {
    const points: THREE.Vector3[] = stations.map((station) => {
      const territory = territoryByNumber(station.number);
      const lat = station.latitude ?? territory?.centroid.lat ?? 25.79;
      const lng = station.longitude ?? territory?.centroid.lng ?? -80.13;
      const { x, z } = mapToScene(lat, lng);
      return new THREE.Vector3(x, TERRAIN_Y + 0.12, z);
    });
    if (points.length < 2) return null;

    // Connect each station to the next two — a sparse web, not a full mesh.
    const linePoints: THREE.Vector3[] = [];
    for (let i = 0; i < points.length; i += 1) {
      for (let span = 1; span <= 2; span += 1) {
        const j = i + span;
        if (j < points.length) {
          linePoints.push(points[i], points[j]);
        }
      }
    }
    return new THREE.BufferGeometry().setFromPoints(linePoints);
  }, [stations]);

  useFrame((state) => {
    if (reducedMotion) return;
    const material = materialRef.current;
    if (material) {
      // Slow shimmer around a very low baseline.
      material.opacity = 0.08 + Math.sin(state.clock.elapsedTime * 0.6) * 0.025;
    }
  });

  if (!geometry) return null;

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial ref={materialRef} color="#37e6e0" transparent opacity={0.08} depthWrite={false} />
    </lineSegments>
  );
}

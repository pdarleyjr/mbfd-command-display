/**
 * Station nodes — one glowing pillar per station at its mapped position.
 *
 * Height + halo scale with readiness.percent (taller/greener = more ready; short +
 * red pulse = critical). Hover raises the node and emissive; click selects it. The
 * selected node gets a ring halo. The station number is an HTML badge above the
 * node (drei <Html>) — operational labels never live inside the GL layer.
 */

import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { DisplayStationSummary } from '@/types/display';
import { readinessVisual } from '@/lib/readiness';
import { territoryByNumber } from '@/data/stationTerritories';
import { mapToScene, TERRAIN_Y } from './MiamiBeachTerrain';

const TONE_COLOR: Record<'ready' | 'attention' | 'critical' | 'unknown', string> = {
  ready: '#21D07A',
  attention: '#FFC53D',
  critical: '#FF5C6C',
  unknown: '#6B7C98',
};
const MARINE_COLOR = '#2FB6C9';

interface StationNodesProps {
  stations: DisplayStationSummary[];
  selectedStationNumber: string | null;
  onSelectStation: (stationNumber: string) => void;
  reducedMotion: boolean;
}

interface NodePlacement {
  station: DisplayStationSummary;
  x: number;
  z: number;
  isMarine: boolean;
}

export function StationNodes({
  stations,
  selectedStationNumber,
  onSelectStation,
  reducedMotion,
}: StationNodesProps): React.JSX.Element {
  const placements = useMemo<NodePlacement[]>(() => {
    return stations.map((station) => {
      const territory = territoryByNumber(station.number);
      const lat = station.latitude ?? territory?.centroid.lat ?? 25.79;
      const lng = station.longitude ?? territory?.centroid.lng ?? -80.13;
      const { x, z } = mapToScene(lat, lng);
      return { station, x, z, isMarine: territory?.isMarine ?? false };
    });
  }, [stations]);

  return (
    <group>
      {placements.map((placement) => (
        <StationNode
          key={placement.station.number}
          placement={placement}
          selected={placement.station.number === selectedStationNumber}
          onSelectStation={onSelectStation}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}

function StationNode({
  placement,
  selected,
  onSelectStation,
  reducedMotion,
}: {
  placement: NodePlacement;
  selected: boolean;
  onSelectStation: (stationNumber: string) => void;
  reducedMotion: boolean;
}): React.JSX.Element {
  const { station, x, z, isMarine } = placement;
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  const visual = readinessVisual(station.readiness.status);
  const baseColorHex = isMarine ? MARINE_COLOR : TONE_COLOR[visual.tone];
  const isCritical = visual.tone === 'critical';

  // Readiness percent → pillar height. Critical stays short; ready stands tall.
  const percent = clampPercent(station.readiness.percent);
  const height = 0.5 + (percent / 100) * 1.7;

  const color = useMemo(() => new THREE.Color(baseColorHex), [baseColorHex]);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    // Hover/select lift + scale (transform only, kept subtle).
    const targetScale = hovered ? 1.18 : selected ? 1.08 : 1;
    group.scale.setScalar(THREE.MathUtils.lerp(group.scale.x, targetScale, 0.18));

    const material = materialRef.current;
    if (material) {
      const baseEmissive = hovered ? 1.5 : selected ? 1.1 : 0.7;
      let emissive = baseEmissive;
      if (isCritical && !reducedMotion) {
        // Gentle critical pulse — never a strobe.
        emissive = baseEmissive + Math.sin(state.clock.elapsedTime * 3) * 0.35 + 0.35;
      }
      material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity, emissive, 0.2);
    }

    const halo = haloRef.current;
    if (halo) {
      const haloMat = halo.material as THREE.MeshBasicMaterial;
      const baseHalo = selected ? 0.5 : hovered ? 0.34 : 0.18;
      let haloOpacity = baseHalo;
      if (!reducedMotion) {
        haloOpacity = baseHalo + Math.sin(state.clock.elapsedTime * (isCritical ? 3 : 1.4)) * 0.06;
      }
      haloMat.opacity = THREE.MathUtils.lerp(haloMat.opacity, haloOpacity, 0.2);
    }
  });

  const handleOver = (event: ThreeEvent<PointerEvent>): void => {
    event.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };
  const handleOut = (): void => {
    setHovered(false);
    document.body.style.cursor = '';
  };
  const handleClick = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    onSelectStation(station.number);
  };

  return (
    <group ref={groupRef} position={[x, TERRAIN_Y, z]}>
      {/* Ground halo disc. */}
      <mesh ref={haloRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.16, selected ? 0.42 : 0.3, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Pillar marker. */}
      <mesh
        position={[0, height / 2, 0]}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
        castShadow
      >
        <cylinderGeometry args={[0.07, 0.11, height, 18]} />
        <meshStandardMaterial
          ref={materialRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.7}
          roughness={0.35}
          metalness={0.4}
        />
      </mesh>

      {/* Cap glow at the top of the pillar. */}
      <mesh position={[0, height + 0.04, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>

      {/* Selection ring (only when selected). */}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <ringGeometry args={[0.46, 0.52, 48]} />
          <meshBasicMaterial color="#37e6e0" transparent opacity={0.7} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* HTML number badge above the node (NOT 3D text). */}
      <Html
        position={[0, height + 0.32, 0]}
        center
        distanceFactor={9}
        zIndexRange={[20, 0]}
        pointerEvents="none"
        wrapperClass="cd-node-badge-wrap"
      >
        <button
          type="button"
          aria-label={`Station ${station.number} — ${station.name}`}
          onClick={() => onSelectStation(station.number)}
          className={badgeClass(selected)}
          style={{ pointerEvents: 'auto' }}
        >
          {isMarine ? '⚓' : station.number}
        </button>
      </Html>
    </group>
  );
}

function badgeClass(selected: boolean): string {
  const base =
    'inline-flex min-w-[24px] items-center justify-center rounded-md border px-1.5 py-0.5 text-[11px] font-bold leading-none tracking-wide backdrop-blur-sm transition-colors';
  const tone = selected
    ? 'border-cyan-300/70 bg-cyan-400/20 text-cyan-100 shadow-[0_0_14px_-2px_rgba(55,230,224,0.6)]'
    : 'border-white/15 bg-[#0f1a2e]/80 text-[#e6edf7]';
  return `${base} ${tone}`;
}

function clampPercent(percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  return Math.max(0, Math.min(100, percent));
}

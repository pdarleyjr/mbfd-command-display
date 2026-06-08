/**
 * Stylized Miami Beach barrier-island terrain.
 *
 * The island runs north→south, so it is modeled as an elongated plane along the
 * scene's Z axis (long & narrow). All spatial elements (station nodes, incident
 * pings, marine layer) place themselves through the shared `mapToScene` helper so
 * everything stays aligned with this surface.
 *
 * Nothing here renders operational data — the terrain only communicates geography.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { projectToMap } from '@/data/stationTerritories';

/** Scene dimensions (world units). The island is long (Z) and narrow (X). */
export const ISLAND_LENGTH = 14;
export const ISLAND_WIDTH = 4;

/** Where the island surface sits on the Y axis. Nodes rise from here. */
export const TERRAIN_Y = 0;

/**
 * Convert a real lat/lng into scene coordinates aligned to the terrain.
 * projectToMap returns x:0..1 (west→east) and y:0..1 (north→south, screen-down),
 * which we re-center to the island's local frame.
 */
export function mapToScene(lat: number, lng: number): { x: number; z: number } {
  const p = projectToMap(lat, lng);
  return {
    x: (p.x - 0.5) * ISLAND_WIDTH,
    z: (p.y - 0.5) * ISLAND_LENGTH,
  };
}

export function MiamiBeachTerrain(): React.JSX.Element {
  // A faint contour grid baked once; cheap LineSegments instead of per-frame work.
  const gridGeometry = useMemo(() => buildIslandGrid(), []);
  const gridMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#37e6e0'),
        transparent: true,
        opacity: 0.06,
      }),
    [],
  );

  return (
    <group>
      {/* Island deck — a long, narrow, very dark navy slab. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, TERRAIN_Y, 0]} receiveShadow>
        <planeGeometry args={[ISLAND_WIDTH, ISLAND_LENGTH, 1, 1]} />
        <meshStandardMaterial
          color="#0d1726"
          roughness={0.92}
          metalness={0.08}
          transparent
          opacity={0.96}
        />
      </mesh>

      {/* Soft shoreline halo just under the deck so it reads as a lit island. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, TERRAIN_Y - 0.02, 0]}>
        <planeGeometry args={[ISLAND_WIDTH + 1.6, ISLAND_LENGTH + 2.2, 1, 1]} />
        <meshBasicMaterial color="#13243e" transparent opacity={0.35} />
      </mesh>

      {/* Contour grid, slightly above the deck to avoid z-fighting. */}
      <lineSegments geometry={gridGeometry} material={gridMaterial} position={[0, TERRAIN_Y + 0.005, 0]} />
    </group>
  );
}

/** A sparse rectangular grid across the island footprint (built once). */
function buildIslandGrid(): THREE.BufferGeometry {
  const positions: number[] = [];
  const halfW = ISLAND_WIDTH / 2;
  const halfL = ISLAND_LENGTH / 2;
  const cols = 4;
  const rows = 16;

  for (let i = 0; i <= cols; i += 1) {
    const x = -halfW + (i / cols) * ISLAND_WIDTH;
    positions.push(x, 0, -halfL, x, 0, halfL);
  }
  for (let j = 0; j <= rows; j += 1) {
    const z = -halfL + (j / rows) * ISLAND_LENGTH;
    positions.push(-halfW, 0, z, halfW, 0, z);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

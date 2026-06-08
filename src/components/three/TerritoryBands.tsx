/**
 * Territory bands — translucent colored strips across the island width, one per
 * land station, positioned at that station's latitude band. The selected station's
 * band brightens so the operator can see which territory is in focus.
 *
 * Marine (Station 6) is excluded — it is a water/zone station, drawn by MarineLayer.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { STATION_TERRITORIES } from '@/data/stationTerritories';
import { ISLAND_WIDTH, mapToScene, TERRAIN_Y } from './MiamiBeachTerrain';

interface TerritoryBandsProps {
  selectedStationNumber: string | null;
}

interface BandLayout {
  number: string;
  accent: string;
  centerZ: number;
  depth: number;
}

export function TerritoryBands({ selectedStationNumber }: TerritoryBandsProps): React.JSX.Element {
  const bands = useMemo<BandLayout[]>(() => {
    return STATION_TERRITORIES.filter((t) => !t.isMarine).map((t) => {
      const lng = t.centroid.lng;
      const south = mapToScene(t.band.south, lng).z;
      const north = mapToScene(t.band.north, lng).z;
      const centerZ = (south + north) / 2;
      // Depth is the band's extent along Z; guard against zero-height bands.
      const depth = Math.max(0.4, Math.abs(south - north));
      return { number: t.number, accent: t.accent, centerZ, depth };
    });
  }, []);

  return (
    <group>
      {bands.map((band) => {
        const selected = band.number === selectedStationNumber;
        return <Band key={band.number} band={band} selected={selected} />;
      })}
    </group>
  );
}

function Band({ band, selected }: { band: BandLayout; selected: boolean }): React.JSX.Element {
  const color = useMemo(() => new THREE.Color(band.accent), [band.accent]);
  const fillOpacity = selected ? 0.26 : 0.12;
  const edgeOpacity = selected ? 0.85 : 0.4;
  const width = ISLAND_WIDTH * 0.98;
  const halfDepth = band.depth / 2;

  return (
    <group position={[0, TERRAIN_Y + 0.015, band.centerZ]}>
      {/* Translucent fill across the island width. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, band.depth, 1, 1]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={fillOpacity}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Brighter edge lines at the band's north & south boundaries. */}
      <BandEdge color={color} opacity={edgeOpacity} width={width} z={-halfDepth} />
      <BandEdge color={color} opacity={edgeOpacity} width={width} z={halfDepth} />
    </group>
  );
}

function BandEdge({
  color,
  opacity,
  width,
  z,
}: {
  color: THREE.Color;
  opacity: number;
  width: number;
  z: number;
}): React.JSX.Element {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, z]}>
      <planeGeometry args={[width, 0.03, 1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

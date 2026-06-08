/**
 * Incident pings — an expanding ring + ember point per active incident.
 *
 * Incidents arrive loosely typed (PulsePoint proxy). Usable lat/lng map to the
 * terrain; incidents without coordinates are fanned out near downtown / Station 1
 * so the wall still shows activity. Count caps at MAX_PINGS. Reduced motion renders
 * static rings (no expand/pulse).
 */

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { IncidentRecord } from '@/types/display';
import { territoryByNumber } from '@/data/stationTerritories';
import { mapToScene, TERRAIN_Y } from './MiamiBeachTerrain';

const EMBER = '#FF6A3D';
const MAX_PINGS = 12;

interface IncidentPingsProps {
  incidents: IncidentRecord[];
  reducedMotion: boolean;
}

interface PingPlacement {
  key: string;
  x: number;
  z: number;
  phase: number;
}

export function IncidentPings({ incidents, reducedMotion }: IncidentPingsProps): React.JSX.Element {
  const placements = useMemo<PingPlacement[]>(() => buildPlacements(incidents), [incidents]);

  return (
    <group>
      {placements.map((ping) => (
        <Ping key={ping.key} ping={ping} reducedMotion={reducedMotion} />
      ))}
    </group>
  );
}

function Ping({ ping, reducedMotion }: { ping: PingPlacement; reducedMotion: boolean }): React.JSX.Element {
  const ringRef = useRef<THREE.Mesh>(null);
  const color = useMemo(() => new THREE.Color(EMBER), []);

  useFrame((state) => {
    if (reducedMotion) return;
    const ring = ringRef.current;
    if (!ring) return;

    // 0..1 expanding cycle, offset per-ping so they don't pulse in lockstep.
    const t = (state.clock.elapsedTime * 0.8 + ping.phase) % 1;
    const scale = 0.3 + t * 1.4;
    ring.scale.set(scale, scale, scale);
    const mat = ring.material as THREE.MeshBasicMaterial;
    mat.opacity = (1 - t) * 0.6;
  });

  return (
    <group position={[ping.x, TERRAIN_Y + 0.03, ping.z]}>
      {/* Expanding (or static) ring. */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} scale={reducedMotion ? 0.9 : 0.3}>
        <ringGeometry args={[0.18, 0.24, 40]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={reducedMotion ? 0.5 : 0.6}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Steady ember point at the incident origin. */}
      <mesh position={[0, 0.04, 0]}>
        <sphereGeometry args={[0.07, 14, 14]} />
        <meshBasicMaterial color={color} transparent opacity={0.92} />
      </mesh>
    </group>
  );
}

function buildPlacements(incidents: IncidentRecord[]): PingPlacement[] {
  const active = incidents.slice(0, MAX_PINGS);
  // Fallback anchor: Station 1 territory centroid (downtown / South Beach).
  const fallback = territoryByNumber('1')?.centroid ?? { lat: 25.7796, lng: -80.134 };

  return active.map((incident, index) => {
    const lat = toCoord(incident.latitude);
    const lng = toCoord(incident.longitude);
    const hasCoords = lat !== null && lng !== null;

    let scene: { x: number; z: number };
    if (hasCoords) {
      scene = mapToScene(lat, lng);
    } else {
      // Fan undistributed incidents in a small ring near the fallback anchor.
      const angle = (index / Math.max(1, active.length)) * Math.PI * 2;
      const radius = 0.4 + (index % 3) * 0.25;
      const base = mapToScene(fallback.lat, fallback.lng);
      scene = { x: base.x + Math.cos(angle) * radius, z: base.z + Math.sin(angle) * radius };
    }

    return {
      key: incident.id ?? `incident-${index}`,
      x: scene.x,
      z: scene.z,
      phase: (index / Math.max(1, active.length)) % 1,
    };
  });
}

function toCoord(value: number | string | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

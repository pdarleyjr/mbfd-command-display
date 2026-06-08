/**
 * Marine layer — a low, marine-tinted water plane on the bay (west) side near the
 * Station 6 marine zone. Gentle vertex ripple via a tiny custom shader; held static
 * when reduced motion is requested. Kept cheap (modest segment count, no textures).
 */

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { territoryByNumber } from '@/data/stationTerritories';
import { ISLAND_LENGTH, ISLAND_WIDTH, mapToScene, TERRAIN_Y } from './MiamiBeachTerrain';

interface MarineLayerProps {
  reducedMotion: boolean;
}

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uAmplitude;
  varying float vWave;
  void main() {
    vec3 pos = position;
    float wave = sin(pos.x * 1.6 + uTime) * 0.5 + sin(pos.y * 2.1 + uTime * 1.3) * 0.5;
    pos.z += wave * uAmplitude;
    vWave = wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vWave;
  void main() {
    float shade = 0.78 + vWave * 0.18;
    gl_FragColor = vec4(uColor * shade, uOpacity);
  }
`;

export function MarineLayer({ reducedMotion }: MarineLayerProps): React.JSX.Element {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Anchor the water near Station 6 on the bay side; widen it off the west edge.
  const position = useMemo<[number, number, number]>(() => {
    const marine = territoryByNumber('6')?.centroid ?? { lat: 25.782, lng: -80.158 };
    const { x, z } = mapToScene(marine.lat, marine.lng);
    // Push further west of the island deck so it reads as open water (bay side).
    return [x - ISLAND_WIDTH * 0.35, TERRAIN_Y - 0.06, z];
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: { value: reducedMotion ? 0 : 0.12 },
      uColor: { value: new THREE.Color('#2FB6C9') },
      uOpacity: { value: 0.16 },
    }),
    [reducedMotion],
  );

  useFrame((state) => {
    if (reducedMotion) return;
    const material = materialRef.current;
    if (material) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position}>
      <planeGeometry args={[ISLAND_WIDTH * 1.4, ISLAND_LENGTH * 0.55, 24, 24]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

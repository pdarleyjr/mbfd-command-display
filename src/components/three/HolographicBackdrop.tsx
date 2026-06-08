/**
 * HolographicBackdrop — an optional, extremely subtle ambient field intended to
 * sit BEHIND the whole app (fixed, pointer-events:none). The app may or may not
 * mount it. It must never reduce text readability, so opacity stays very low and
 * it degrades to a pure CSS gradient when WebGL is unavailable or motion is off.
 *
 * This component owns its own <Canvas>; it is independent of the Operations Map.
 */

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { detectWebGL, prefersReducedMotion } from '@/lib/webgl';

interface HolographicBackdropProps {
  className?: string;
  /** Override the reduced-motion decision (defaults to the media query). */
  reducedMotion?: boolean;
}

const FIXED_BEHIND: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: -1,
  pointerEvents: 'none',
};

/** Pure-CSS ambient gradient — the always-safe fallback. */
const GRADIENT_BG =
  'radial-gradient(120% 90% at 50% -10%, rgba(55,230,224,0.05), transparent 55%),' +
  'radial-gradient(100% 80% at 80% 110%, rgba(77,163,255,0.05), transparent 60%),' +
  'linear-gradient(180deg, #070c16 0%, #0b1220 100%)';

export function HolographicBackdrop({ className, reducedMotion }: HolographicBackdropProps): React.JSX.Element {
  const motionOff = reducedMotion ?? prefersReducedMotion();
  const webglOk = detectWebGL();

  // No WebGL (or static): a gentle CSS gradient field, nothing animated.
  if (!webglOk || motionOff) {
    return (
      <div
        aria-hidden="true"
        className={className}
        style={{ ...FIXED_BEHIND, background: GRADIENT_BG }}
      />
    );
  }

  return (
    <div aria-hidden="true" className={className} style={FIXED_BEHIND}>
      <Canvas
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 60 }}
        style={{ width: '100%', height: '100%', background: GRADIENT_BG }}
      >
        <ParticleField />
      </Canvas>
    </div>
  );
}

/** A sparse drifting point cloud — kept dim so it never competes with foreground text. */
function ParticleField(): React.JSX.Element {
  const pointsRef = useRef<THREE.Points>(null);
  const COUNT = 220;

  const geometry = useMemo<THREE.BufferGeometry>(() => {
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    const points = pointsRef.current;
    if (points) {
      points.rotation.y = state.clock.elapsedTime * 0.02;
      points.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.06;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#37e6e0"
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.18}
        depthWrite={false}
      />
    </points>
  );
}

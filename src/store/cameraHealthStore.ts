/**
 * Camera health registry. Each CameraTile reports its playback state; the source-health
 * bar and camera panels read the aggregate. Kept tiny and outside React render state so
 * frequent HLS state changes don't thrash component trees.
 */

import { create } from 'zustand';
import type { CamHealth } from '@/data/stationCameraCatalog';

interface CameraHealthState {
  states: Record<string, { health: CamHealth; lastHealthyAt: number | null }>;
  report: (id: string, health: CamHealth) => void;
  clear: (id: string) => void;
}

export const useCameraHealthStore = create<CameraHealthState>((set) => ({
  states: {},
  report: (id, health) =>
    set((s) => {
      const prev = s.states[id];
      const lastHealthyAt = health === 'live' ? Date.now() : (prev?.lastHealthyAt ?? null);
      return { states: { ...s.states, [id]: { health, lastHealthyAt } } };
    }),
  clear: (id) =>
    set((s) => {
      const next = { ...s.states };
      delete next[id];
      return { states: next };
    }),
}));

export function summarizeCameraHealth(states: CameraHealthState['states']): {
  total: number;
  live: number;
  degraded: number;
  offline: number;
} {
  const vals = Object.values(states);
  return {
    total: vals.length,
    live: vals.filter((v) => v.health === 'live').length,
    degraded: vals.filter((v) => v.health === 'reconnecting' || v.health === 'stale').length,
    offline: vals.filter((v) => v.health === 'offline').length,
  };
}

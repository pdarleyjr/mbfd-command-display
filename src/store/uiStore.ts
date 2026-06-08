/**
 * UI preference store (Zustand, persisted). Holds display-mode + motion/GPU prefs
 * that the operator can toggle on the wall. Data lives in TanStack Query, not here.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MotionPref = 'auto' | 'on' | 'off';
export type QualityPref = 'auto' | 'high' | 'low' | 'off';

interface UiState {
  /** No-scroll kiosk/wall mode (also auto-enabled for wide regimes). */
  displayMode: boolean;
  motionPref: MotionPref;
  qualityPref: QualityPref;
  /** Whether the ambient WebGL backdrop is mounted behind the app. */
  ambientBackdrop: boolean;
  setDisplayMode: (v: boolean) => void;
  toggleDisplayMode: () => void;
  setMotionPref: (v: MotionPref) => void;
  setQualityPref: (v: QualityPref) => void;
  setAmbientBackdrop: (v: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      displayMode: false,
      motionPref: 'auto',
      qualityPref: 'auto',
      // Flat "Watch Desk" aesthetic — no decorative WebGL backdrop behind content.
      ambientBackdrop: false,
      setDisplayMode: (v) => set({ displayMode: v }),
      toggleDisplayMode: () => set((s) => ({ displayMode: !s.displayMode })),
      setMotionPref: (v) => set({ motionPref: v }),
      setQualityPref: (v) => set({ qualityPref: v }),
      setAmbientBackdrop: (v) => set({ ambientBackdrop: v }),
    }),
    { name: 'mbfd-command-ui' },
  ),
);

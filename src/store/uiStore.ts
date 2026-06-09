/**
 * UI preference store (Zustand, persisted). Holds display-mode + motion prefs
 * that the operator can toggle on the wall. Data lives in TanStack Query, not here.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MotionPref = 'auto' | 'on' | 'off';

interface UiState {
  /** No-scroll kiosk/wall mode (also auto-enabled for wide regimes). */
  displayMode: boolean;
  motionPref: MotionPref;
  setDisplayMode: (v: boolean) => void;
  toggleDisplayMode: () => void;
  setMotionPref: (v: MotionPref) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      displayMode: false,
      motionPref: 'auto',
      setDisplayMode: (v) => set({ displayMode: v }),
      toggleDisplayMode: () => set((s) => ({ displayMode: !s.displayMode })),
      setMotionPref: (v) => set({ motionPref: v }),
    }),
    { name: 'mbfd-command-ui' },
  ),
);

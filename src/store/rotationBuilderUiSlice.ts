import type { StateCreator } from 'zustand';

import type { RotationSlice } from './rotationSlice';
import type { TeamSlice } from './teamSlice';

export const rotationBuilderTabs = ['team', 'rotation', 'results'] as const;
export type RotationBuilderTab = (typeof rotationBuilderTabs)[number];

export interface RotationBuilderUiSlice {
  activeTab: RotationBuilderTab;
  setActiveTab: (tab: RotationBuilderTab) => void;
}

export const createRotationBuilderUiSlice: StateCreator<
  RotationBuilderUiSlice & RotationSlice & TeamSlice,
  [['zustand/immer', never], ['zustand/persist', unknown]],
  [],
  RotationBuilderUiSlice
> = (set) => ({
  activeTab: 'team',

  setActiveTab: (tab) =>
    set((state) => {
      state.activeTab = tab;
    }),
});

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createRotationSlice } from './rotationSlice';
import type { RotationSlice } from './rotationSlice';
import { createTeamSlice } from './teamSlice';
import type { TeamSlice } from './teamSlice';

export type AppStore = RotationSlice & TeamSlice;

export const useStore = create<AppStore>()(
  persist(
    immer((...arguments_) => ({
      ...createRotationSlice(...arguments_),
      ...createTeamSlice(...arguments_),
    })),
    {
      name: 'wuwa-app-store',
    },
  ),
);

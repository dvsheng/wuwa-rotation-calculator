import { useEffect, useState } from 'react';
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

export const useStoreHydrated = () => {
  // Always initialize as false so the first committed render is consistent.
  // Using `useState(() => useStore.persist.hasHydrated())` causes a React 18
  // concurrent-mode hydration mismatch: hasHydrated() can return different
  // values across render attempts (false → Skeleton committed to DOM, then
  // true → RotationBuilderContainer on next pass), which React flags as a
  // mismatch. Starting false guarantees the Skeleton is always the first
  // committed output; the effect below promotes to true after mount.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      const hydrationUpdateId = globalThis.setTimeout(() => setHydrated(true), 0);
      return () => globalThis.clearTimeout(hydrationUpdateId);
    }
    const unsubHydrate = useStore.persist.onHydrate(() => setHydrated(false));
    const unsubFinish = useStore.persist.onFinishHydration(() => setHydrated(true));

    void useStore.persist.rehydrate();

    return () => {
      unsubHydrate();
      unsubFinish();
    };
  }, []);

  return hydrated;
};

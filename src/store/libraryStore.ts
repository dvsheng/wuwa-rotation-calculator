import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { SavedRotation, SavedRotationData } from '@/schemas/library';

interface LibraryState {
  rotations: Array<SavedRotation>;
  addRotation: (name: string, data: SavedRotationData, description?: string) => void;
  deleteRotation: (id: string) => void;
  updateRotation: (id: string, updates: Partial<SavedRotation>) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    immer((set) => ({
      rotations: [],
      addRotation: (name, data, description) =>
        set((state) => {
          const newRotation: SavedRotation = {
            id: crypto.randomUUID(),
            name,
            description,
            data,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          state.rotations.push(newRotation);
        }),
      deleteRotation: (id) =>
        set((state) => {
          state.rotations = state.rotations.filter((r) => r.id !== id);
        }),
      updateRotation: (id, updates) =>
        set((state) => {
          const index = state.rotations.findIndex((r) => r.id === id);
          if (index !== -1) {
            state.rotations[index] = {
              ...state.rotations[index],
              ...updates,
              updatedAt: Date.now(),
            };
          }
        }),
    })),
    {
      name: 'wuwa-rotation-library',
    },
  ),
);

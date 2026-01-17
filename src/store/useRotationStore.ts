import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { Attack, Buff } from '@/schemas/rotation';

import { useTeamStore } from './useTeamStore';

export interface RotationState {
  attacks: Array<Attack>;
  buffs: Array<Buff>;

  // Actions for attacks
  addAttack: (attack: Omit<Attack, 'id'>, atIndex?: number) => void;
  removeAttack: (id: string) => void;
  reorderAttacks: (oldIndex: number, newIndex: number) => void;
  clearAttacks: () => void;

  // Actions for buffs
  addBuff: (buff: Omit<Buff, 'timelineId'>) => void;
  removeBuff: (timelineId: string) => void;
  updateBuffLayout: (
    timelineId: string,
    layout: Partial<Pick<Buff, 'x' | 'y' | 'w' | 'h'>>,
  ) => void;
  updateBuffParameter: (timelineId: string, value: number) => void;
  clearBuffs: () => void;

  clearAll: () => void;
}

export const useRotationStore = create<RotationState>()(
  immer((set) => ({
    attacks: [],
    buffs: [],

    addAttack: (attack, atIndex) =>
      set((state) => {
        const newAttack = { ...attack, id: crypto.randomUUID() };
        if (atIndex !== undefined && atIndex !== -1) {
          state.attacks.splice(atIndex, 0, newAttack);
        } else {
          state.attacks.push(newAttack);
        }
      }),

    removeAttack: (id) =>
      set((state) => {
        state.attacks = state.attacks.filter((a) => a.id !== id);
      }),

    reorderAttacks: (oldIndex, newIndex) =>
      set((state) => {
        const [removed] = state.attacks.splice(oldIndex, 1);
        state.attacks.splice(newIndex, 0, removed);
      }),

    clearAttacks: () =>
      set((state) => {
        state.attacks = [];
      }),

    addBuff: (buff) =>
      set((state) => {
        state.buffs.push({ ...buff, timelineId: crypto.randomUUID() });
      }),

    removeBuff: (timelineId) =>
      set((state) => {
        state.buffs = state.buffs.filter((b) => b.timelineId !== timelineId);
      }),

    updateBuffLayout: (timelineId, layout) =>
      set((state) => {
        const buff = state.buffs.find((b) => b.timelineId === timelineId);
        if (buff) {
          Object.assign(buff, layout);
        }
      }),

    updateBuffParameter: (timelineId, value) =>
      set((state) => {
        const buff = state.buffs.find((b) => b.timelineId === timelineId);
        if (buff) {
          buff.parameterValue = value;
        }
      }),

    clearBuffs: () =>
      set((state) => {
        state.buffs = [];
      }),

    clearAll: () =>
      set((state) => {
        state.attacks = [];
        state.buffs = [];
      }),
  })),
);

// Subscribe to TeamStore changes to clear rotation when characters change
let previousCharacterIds = useTeamStore
  .getState()
  .team.map((c) => c.id)
  .join(',');

useTeamStore.subscribe((state) => {
  const currentCharacterIds = state.team.map((c) => c.id).join(',');
  if (currentCharacterIds !== previousCharacterIds) {
    previousCharacterIds = currentCharacterIds;
    useRotationStore.getState().clearAll();
  }
});

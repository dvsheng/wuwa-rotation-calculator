import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { AttackInstance, Capability, ModifierInstance } from '@/schemas/rotation';

import { useTeamStore } from './useTeamStore';

export interface RotationState {
  attacks: Array<AttackInstance>;
  buffs: Array<ModifierInstance>;

  // Actions for attacks
  addAttack: (attack: Capability, atIndex?: number) => void;
  removeAttack: (instanceId: string) => void;
  reorderAttacks: (oldIndex: number, newIndex: number) => void;
  updateAttackParameters: (instanceId: string, values: Array<number>) => void;
  setAttacks: (attacks: Array<AttackInstance>) => void;
  clearAttacks: () => void;

  // Actions for buffs
  addBuff: (
    buff: Capability,
    position: Pick<ModifierInstance, 'x' | 'y' | 'w' | 'h'>,
  ) => void;
  removeBuff: (instanceId: string) => void;
  updateBuffLayout: (
    instanceId: string,
    layout: Partial<Pick<ModifierInstance, 'x' | 'y' | 'w' | 'h'>>,
  ) => void;
  updateBuffParameters: (instanceId: string, values: Array<number>) => void;
  clearBuffs: () => void;

  clearAll: () => void;
}

export const useRotationStore = create<RotationState>()(
  persist(
    immer((set) => ({
      attacks: [],
      buffs: [],

      addAttack: (attack, atIndex) =>
        set((state) => {
          const newAttack: AttackInstance = {
            instanceId: crypto.randomUUID(),
            id: attack.id,
            characterId: attack.characterId,
            parameterValues: attack.parameters?.map((p) => p.value ?? p.minimum),
          };
          if (atIndex !== undefined && atIndex !== -1) {
            state.attacks.splice(atIndex, 0, newAttack);
          } else {
            state.attacks.push(newAttack);
          }
        }),

      removeAttack: (instanceId) =>
        set((state) => {
          state.attacks = state.attacks.filter((a) => a.instanceId !== instanceId);
        }),

      reorderAttacks: (oldIndex, newIndex) =>
        set((state) => {
          const [removed] = state.attacks.splice(oldIndex, 1);
          state.attacks.splice(newIndex, 0, removed);
        }),

      updateAttackParameters: (instanceId, values) =>
        set((state) => {
          const attack = state.attacks.find((a) => a.instanceId === instanceId);
          if (attack) {
            attack.parameterValues = values;
          }
        }),

      setAttacks: (attacks) =>
        set((state) => {
          state.attacks = attacks;
        }),

      clearAttacks: () =>
        set((state) => {
          state.attacks = [];
        }),

      addBuff: (buff, position) =>
        set((state) => {
          const newBuff: ModifierInstance = {
            instanceId: crypto.randomUUID(),
            id: buff.id,
            characterId: buff.characterId,
            parameterValues: buff.parameters?.map((p) => p.value ?? p.minimum),
            ...position,
          };
          state.buffs.push(newBuff);
        }),

      removeBuff: (instanceId) =>
        set((state) => {
          state.buffs = state.buffs.filter((b) => b.instanceId !== instanceId);
        }),

      updateBuffLayout: (instanceId, layout) =>
        set((state) => {
          const buff = state.buffs.find((b) => b.instanceId === instanceId);
          if (buff) {
            Object.assign(buff, layout);
          }
        }),

      updateBuffParameters: (instanceId, values) =>
        set((state) => {
          const buff = state.buffs.find((b) => b.instanceId === instanceId);
          if (buff) {
            buff.parameterValues = values;
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
    {
      name: 'wuwa-rotation-data',
      partialize: (state) => ({ attacks: state.attacks, buffs: state.buffs }),
    },
  ),
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

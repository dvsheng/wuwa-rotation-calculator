import type { StateCreator } from 'zustand';

import type {
  AttackInstance,
  ModifierInstance,
  ParameterInstance,
} from '@/schemas/rotation';

import type { TeamSlice } from './teamSlice';

export interface RotationSlice {
  attacks: Array<AttackInstance>;
  buffs: Array<ModifierInstance>;

  // Actions for attacks
  addAttack: (attack: Omit<AttackInstance, 'instanceId'>, atIndex?: number) => void;
  removeAttack: (instanceId: string) => void;
  reorderAttacks: (oldIndex: number, newIndex: number) => void;
  updateAttackParameters: (
    instanceId: string,
    values: Array<ParameterInstance>,
  ) => void;
  setAttacks: (attacks: Array<AttackInstance>) => void;
  clearAttacks: () => void;
  clearAttacksForCharacter: (characterId: number) => void;

  // Actions for buffs
  addBuff: (
    buff: Omit<ModifierInstance, 'instanceId' | 'x' | 'y' | 'w' | 'h'>,
    position: Pick<ModifierInstance, 'x' | 'y' | 'w' | 'h'>,
  ) => void;
  removeBuff: (instanceId: string) => void;
  updateBuffLayout: (
    instanceId: string,
    layout: Partial<Pick<ModifierInstance, 'x' | 'y' | 'w' | 'h'>>,
  ) => void;
  updateBuffParameters: (instanceId: string, values: Array<ParameterInstance>) => void;
  setBuffs: (buffs: Array<ModifierInstance>) => void;
  clearBuffs: () => void;
  clearBuffsForCharacter: (characterId: number) => void;

  clearAll: () => void;
  clearAllForCharacter: (characterId: number) => void;
}

export const createRotationSlice: StateCreator<
  RotationSlice & TeamSlice,
  [['zustand/immer', never], ['zustand/persist', unknown]],
  [],
  RotationSlice
> = (set) => ({
  attacks: [],
  buffs: [],

  addAttack: (attack, atIndex) =>
    set((state) => {
      const newAttack = {
        ...attack,
        instanceId: crypto.randomUUID(),
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

  clearAttacksForCharacter: (characterId) =>
    set((state) => {
      state.attacks = state.attacks.filter((a) => a.characterId !== characterId);
    }),

  addBuff: (buff, position) =>
    set((state) => {
      const newBuff = {
        ...buff,
        ...position,
        instanceId: crypto.randomUUID(),
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

  setBuffs: (buffs) =>
    set((state) => {
      state.buffs = buffs;
    }),

  clearBuffs: () =>
    set((state) => {
      state.buffs = [];
    }),

  clearBuffsForCharacter: (characterId) =>
    set((state) => {
      state.buffs = state.buffs.filter((b) => b.characterId !== characterId);
    }),

  clearAll: () =>
    set((state) => {
      state.attacks = [];
      state.buffs = [];
    }),

  clearAllForCharacter: (characterId) =>
    set((state) => {
      state.attacks = state.attacks.filter((a) => a.characterId !== characterId);
      state.buffs = state.buffs.filter((b) => b.characterId !== characterId);
    }),
});

import { beforeEach, describe, expect, it } from 'vitest';

import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';

import { useRotationStore } from './useRotationStore';

describe('useRotationStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useRotationStore.setState({
      attacks: [],
      buffs: [],
    });
  });

  describe('clearAttacksForCharacter', () => {
    it('should clear only attacks for the specified character', () => {
      const attacks: Array<AttackInstance> = [
        {
          id: 1,
          characterId: 1304,
          instanceId: 'attack-1',
          parameterValues: [],
        },
        {
          id: 2,
          characterId: 1209,
          instanceId: 'attack-2',
          parameterValues: [],
        },
        {
          id: 3,
          characterId: 1304,
          instanceId: 'attack-3',
          parameterValues: [],
        },
        {
          id: 4,
          characterId: 1505,
          instanceId: 'attack-4',
          parameterValues: [],
        },
      ];

      useRotationStore.setState({ attacks });

      useRotationStore.getState().clearAttacksForCharacter(1304);

      const remainingAttacks = useRotationStore.getState().attacks;
      expect(remainingAttacks).toHaveLength(2);
      expect(remainingAttacks.every((a) => a.characterId !== 1304)).toBe(true);
      expect(remainingAttacks.map((a) => a.instanceId)).toEqual([
        'attack-2',
        'attack-4',
      ]);
    });

    it('should not affect attacks when character has no attacks', () => {
      const attacks: Array<AttackInstance> = [
        {
          id: 1,
          characterId: 1304,
          instanceId: 'attack-1',
          parameterValues: [],
        },
        {
          id: 2,
          characterId: 1209,
          instanceId: 'attack-2',
          parameterValues: [],
        },
      ];

      useRotationStore.setState({ attacks });

      useRotationStore.getState().clearAttacksForCharacter(9999);

      expect(useRotationStore.getState().attacks).toHaveLength(2);
    });
  });

  describe('clearBuffsForCharacter', () => {
    it('should clear only buffs for the specified character', () => {
      const buffs: Array<ModifierInstance> = [
        {
          id: 1,
          characterId: 1304,
          instanceId: 'buff-1',
          parameterValues: [],
          x: 0,
          y: 0,
          w: 1,
          h: 1,
        },
        {
          id: 2,
          characterId: 1209,
          instanceId: 'buff-2',
          parameterValues: [],
          x: 0,
          y: 0,
          w: 1,
          h: 1,
        },
        {
          id: 3,
          characterId: 1304,
          instanceId: 'buff-3',
          parameterValues: [],
          x: 0,
          y: 0,
          w: 1,
          h: 1,
        },
        {
          id: 4,
          characterId: 1505,
          instanceId: 'buff-4',
          parameterValues: [],
          x: 0,
          y: 0,
          w: 1,
          h: 1,
        },
      ];

      useRotationStore.setState({ buffs });

      useRotationStore.getState().clearBuffsForCharacter(1304);

      const remainingBuffs = useRotationStore.getState().buffs;
      expect(remainingBuffs).toHaveLength(2);
      expect(remainingBuffs.every((b) => b.characterId !== 1304)).toBe(true);
      expect(remainingBuffs.map((b) => b.instanceId)).toEqual(['buff-2', 'buff-4']);
    });

    it('should not affect buffs when character has no buffs', () => {
      const buffs: Array<ModifierInstance> = [
        {
          id: 1,
          characterId: 1304,
          instanceId: 'buff-1',
          parameterValues: [],
          x: 0,
          y: 0,
          w: 1,
          h: 1,
        },
        {
          id: 2,
          characterId: 1209,
          instanceId: 'buff-2',
          parameterValues: [],
          x: 0,
          y: 0,
          w: 1,
          h: 1,
        },
      ];

      useRotationStore.setState({ buffs });

      useRotationStore.getState().clearBuffsForCharacter(9999);

      expect(useRotationStore.getState().buffs).toHaveLength(2);
    });
  });

  describe('clearAllForCharacter', () => {
    it('should clear both attacks and buffs for the specified character', () => {
      const attacks: Array<AttackInstance> = [
        {
          id: 1,
          characterId: 1304,
          instanceId: 'attack-1',
          parameterValues: [],
        },
        {
          id: 2,
          characterId: 1209,
          instanceId: 'attack-2',
          parameterValues: [],
        },
      ];

      const buffs: Array<ModifierInstance> = [
        {
          id: 1,
          characterId: 1304,
          instanceId: 'buff-1',
          parameterValues: [],
          x: 0,
          y: 0,
          w: 1,
          h: 1,
        },
        {
          id: 2,
          characterId: 1209,
          instanceId: 'buff-2',
          parameterValues: [],
          x: 0,
          y: 0,
          w: 1,
          h: 1,
        },
      ];

      useRotationStore.setState({ attacks, buffs });

      useRotationStore.getState().clearAllForCharacter(1304);

      const state = useRotationStore.getState();
      expect(state.attacks).toHaveLength(1);
      expect(state.attacks[0].characterId).toBe(1209);
      expect(state.buffs).toHaveLength(1);
      expect(state.buffs[0].characterId).toBe(1209);
    });

    it('should handle clearing when character has only attacks', () => {
      const attacks: Array<AttackInstance> = [
        {
          id: 1,
          characterId: 1304,
          instanceId: 'attack-1',
          parameterValues: [],
        },
        {
          id: 2,
          characterId: 1209,
          instanceId: 'attack-2',
          parameterValues: [],
        },
      ];

      const buffs: Array<ModifierInstance> = [
        {
          id: 1,
          characterId: 1209,
          instanceId: 'buff-1',
          parameterValues: [],
          x: 0,
          y: 0,
          w: 1,
          h: 1,
        },
      ];

      useRotationStore.setState({ attacks, buffs });

      useRotationStore.getState().clearAllForCharacter(1304);

      const state = useRotationStore.getState();
      expect(state.attacks).toHaveLength(1);
      expect(state.attacks[0].characterId).toBe(1209);
      expect(state.buffs).toHaveLength(1);
    });

    it('should handle clearing when character has only buffs', () => {
      const attacks: Array<AttackInstance> = [
        {
          id: 1,
          characterId: 1209,
          instanceId: 'attack-1',
          parameterValues: [],
        },
      ];

      const buffs: Array<ModifierInstance> = [
        {
          id: 1,
          characterId: 1304,
          instanceId: 'buff-1',
          parameterValues: [],
          x: 0,
          y: 0,
          w: 1,
          h: 1,
        },
        {
          id: 2,
          characterId: 1209,
          instanceId: 'buff-2',
          parameterValues: [],
          x: 0,
          y: 0,
          w: 1,
          h: 1,
        },
      ];

      useRotationStore.setState({ attacks, buffs });

      useRotationStore.getState().clearAllForCharacter(1304);

      const state = useRotationStore.getState();
      expect(state.attacks).toHaveLength(1);
      expect(state.buffs).toHaveLength(1);
      expect(state.buffs[0].characterId).toBe(1209);
    });
  });
});

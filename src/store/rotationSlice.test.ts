import { describe, expect, it } from 'vitest';

import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';

import { useStore } from './index';

const makeAttack = (instanceId: string): AttackInstance => ({
  id: 1,
  characterId: 1,
  instanceId,
  parameterValues: [],
});

const makeBuff = (instanceId: string, x: number, w: number): ModifierInstance => ({
  id: 1,
  characterId: 1,
  instanceId,
  parameterValues: [],
  x,
  y: 0,
  w,
  h: 1,
});

describe('useStore - rotation slice', () => {
  // Store is automatically reset after each test via vitest.setup.ts

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

      useStore.setState({ attacks });

      useStore.getState().clearAttacksForCharacter(1304);

      const remainingAttacks = useStore.getState().attacks;
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

      useStore.setState({ attacks });

      useStore.getState().clearAttacksForCharacter(9999);

      expect(useStore.getState().attacks).toHaveLength(2);
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

      useStore.setState({ buffs });

      useStore.getState().clearBuffsForCharacter(1304);

      const remainingBuffs = useStore.getState().buffs;
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

      useStore.setState({ buffs });

      useStore.getState().clearBuffsForCharacter(9999);

      expect(useStore.getState().buffs).toHaveLength(2);
    });
  });

  describe('addAttack - buff adjustment', () => {
    it('shifts buff right when inserting before it', () => {
      // attacks: [a0, a1, a2, a3, a4], buff covers [1,3] (x=1, w=3)
      useStore.setState({
        attacks: ['a0', 'a1', 'a2', 'a3', 'a4'].map((id) => makeAttack(id)),
        buffs: [makeBuff('buff-1', 1, 3)],
      });

      useStore.getState().addAttack({ id: 1, characterId: 1, parameterValues: [] }, 0);

      const buff = useStore.getState().buffs[0];
      expect(buff.x).toBe(2);
      expect(buff.w).toBe(3);
    });

    it('expands buff when inserting within it', () => {
      // attacks: [a0, a1, a2, a3, a4], buff covers [1,3] (x=1, w=3)
      useStore.setState({
        attacks: ['a0', 'a1', 'a2', 'a3', 'a4'].map((id) => makeAttack(id)),
        buffs: [makeBuff('buff-1', 1, 3)],
      });

      useStore.getState().addAttack({ id: 1, characterId: 1, parameterValues: [] }, 2);

      const buff = useStore.getState().buffs[0];
      expect(buff.x).toBe(1);
      expect(buff.w).toBe(4);
    });

    it('expands buff when inserting at its start position', () => {
      // attacks: [a0, a1, a2], buff covers [1,2] (x=1, w=2)
      useStore.setState({
        attacks: ['a0', 'a1', 'a2'].map((id) => makeAttack(id)),
        buffs: [makeBuff('buff-1', 1, 2)],
      });

      useStore.getState().addAttack({ id: 1, characterId: 1, parameterValues: [] }, 1);

      const buff = useStore.getState().buffs[0];
      expect(buff.x).toBe(1);
      expect(buff.w).toBe(3);
    });

    it('expands buff when inserting one past its end', () => {
      // attacks: [a0, a1, a2, a3], buff covers [0,1] (x=0, w=2)
      useStore.setState({
        attacks: ['a0', 'a1', 'a2', 'a3'].map((id) => makeAttack(id)),
        buffs: [makeBuff('buff-1', 0, 2)],
      });

      // insertIndex=2 == buff.x + buff.w, immediately adjacent to the right
      useStore.getState().addAttack({ id: 1, characterId: 1, parameterValues: [] }, 2);

      const buff = useStore.getState().buffs[0];
      expect(buff.x).toBe(0);
      expect(buff.w).toBe(3);
    });

    it('does not change buff when appending to end', () => {
      // attacks: [a0, a1, a2], buff covers [0,1] (x=0, w=2)
      useStore.setState({
        attacks: ['a0', 'a1', 'a2'].map((id) => makeAttack(id)),
        buffs: [makeBuff('buff-1', 0, 2)],
      });

      useStore.getState().addAttack({ id: 1, characterId: 1, parameterValues: [] });

      const buff = useStore.getState().buffs[0];
      expect(buff.x).toBe(0);
      expect(buff.w).toBe(2);
    });

    it('does not change buff when inserting after it', () => {
      // attacks: [a0, a1, a2, a3], buff covers [0,1] (x=0, w=2)
      useStore.setState({
        attacks: ['a0', 'a1', 'a2', 'a3'].map((id) => makeAttack(id)),
        buffs: [makeBuff('buff-1', 0, 2)],
      });

      useStore.getState().addAttack({ id: 1, characterId: 1, parameterValues: [] }, 3);

      const buff = useStore.getState().buffs[0];
      expect(buff.x).toBe(0);
      expect(buff.w).toBe(2);
    });

    it('adjusts multiple buffs independently', () => {
      // attacks: [a0, a1, a2, a3, a4]
      // buff-1 covers [0,1] (x=0, w=2), buff-2 covers [2,4] (x=2, w=3)
      useStore.setState({
        attacks: ['a0', 'a1', 'a2', 'a3', 'a4'].map((id) => makeAttack(id)),
        buffs: [makeBuff('buff-1', 0, 2), makeBuff('buff-2', 2, 3)],
      });

      // Insert at index 1: within buff-1, before buff-2
      useStore.getState().addAttack({ id: 1, characterId: 1, parameterValues: [] }, 1);

      const [b1, b2] = useStore.getState().buffs;
      expect(b1.x).toBe(0);
      expect(b1.w).toBe(3); // expanded
      expect(b2.x).toBe(3); // shifted right
      expect(b2.w).toBe(3); // unchanged
    });
  });

  describe('removeAttack - buff adjustment', () => {
    it('shifts buff left when removing an attack before it', () => {
      // attacks: [a0, a1, a2, a3], buff covers [1,3] (x=1, w=3)
      useStore.setState({
        attacks: ['a0', 'a1', 'a2', 'a3'].map((id) => makeAttack(id)),
        buffs: [makeBuff('buff-1', 1, 3)],
      });

      useStore.getState().removeAttack('a0');

      const buff = useStore.getState().buffs[0];
      expect(buff.x).toBe(0);
      expect(buff.w).toBe(3);
    });

    it('shrinks buff when removing an attack within it', () => {
      // attacks: [a0, a1, a2, a3, a4], buff covers [1,3] (x=1, w=3)
      useStore.setState({
        attacks: ['a0', 'a1', 'a2', 'a3', 'a4'].map((id) => makeAttack(id)),
        buffs: [makeBuff('buff-1', 1, 3)],
      });

      useStore.getState().removeAttack('a2');

      const buff = useStore.getState().buffs[0];
      expect(buff.x).toBe(1);
      expect(buff.w).toBe(2);
    });

    it('removes buff entirely when its last covered attack is removed', () => {
      // attacks: [a0, a1], buff covers [1,1] (x=1, w=1)
      useStore.setState({
        attacks: ['a0', 'a1'].map((id) => makeAttack(id)),
        buffs: [makeBuff('buff-1', 1, 1)],
      });

      useStore.getState().removeAttack('a1');

      expect(useStore.getState().buffs).toHaveLength(0);
    });

    it('does not change buff when removing an attack after it', () => {
      // attacks: [a0, a1, a2, a3], buff covers [0,2] (x=0, w=3)
      useStore.setState({
        attacks: ['a0', 'a1', 'a2', 'a3'].map((id) => makeAttack(id)),
        buffs: [makeBuff('buff-1', 0, 3)],
      });

      useStore.getState().removeAttack('a3');

      const buff = useStore.getState().buffs[0];
      expect(buff.x).toBe(0);
      expect(buff.w).toBe(3);
    });

    it('does nothing when the instanceId does not exist', () => {
      useStore.setState({
        attacks: ['a0', 'a1'].map((id) => makeAttack(id)),
        buffs: [makeBuff('buff-1', 0, 2)],
      });

      useStore.getState().removeAttack('nonexistent');

      expect(useStore.getState().attacks).toHaveLength(2);
      const buff = useStore.getState().buffs[0];
      expect(buff.x).toBe(0);
      expect(buff.w).toBe(2);
    });

    it('adjusts multiple buffs independently', () => {
      // attacks: [a0, a1, a2, a3, a4]
      // buff-1 covers [0,1] (x=0, w=2), buff-2 covers [2,4] (x=2, w=3)
      useStore.setState({
        attacks: ['a0', 'a1', 'a2', 'a3', 'a4'].map((id) => makeAttack(id)),
        buffs: [makeBuff('buff-1', 0, 2), makeBuff('buff-2', 2, 3)],
      });

      // Remove a1: last attack of buff-1 (shrinks it), before buff-2 (shifts it)
      useStore.getState().removeAttack('a1');

      const [b1, b2] = useStore.getState().buffs;
      expect(b1.x).toBe(0);
      expect(b1.w).toBe(1); // shrunk
      expect(b2.x).toBe(1); // shifted left
      expect(b2.w).toBe(3); // unchanged
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

      useStore.setState({ attacks, buffs });

      useStore.getState().clearAllForCharacter(1304);

      const state = useStore.getState();
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

      useStore.setState({ attacks, buffs });

      useStore.getState().clearAllForCharacter(1304);

      const state = useStore.getState();
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

      useStore.setState({ attacks, buffs });

      useStore.getState().clearAllForCharacter(1304);

      const state = useStore.getState();
      expect(state.attacks).toHaveLength(1);
      expect(state.buffs).toHaveLength(1);
      expect(state.buffs[0].characterId).toBe(1209);
    });
  });
});

import { describe, expect, it } from 'vitest';

import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';

import { useStore } from './index';

describe('useStore - setCharacter integration', () => {
  // Store is automatically reset after each test via vitest.setup.ts

  it('should clear attacks and buffs for the old character when character changes', () => {
    const attacks: Array<AttackInstance> = [
      {
        id: 1,
        characterId: 468,
        instanceId: 'attack-1',
        parameterValues: [],
      },
      {
        id: 2,
        characterId: 463,
        instanceId: 'attack-2',
        parameterValues: [],
      },
      {
        id: 3,
        characterId: 468,
        instanceId: 'attack-3',
        parameterValues: [],
      },
    ];

    const buffs: Array<ModifierInstance> = [
      {
        id: 1,
        characterId: 468,
        instanceId: 'buff-1',
        parameterValues: [],
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      },
      {
        id: 2,
        characterId: 463,
        instanceId: 'buff-2',
        parameterValues: [],
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      },
    ];

    useStore.setState({ attacks, buffs });

    // Change character at index 0 from 468 to 484
    useStore.getState().setCharacter(0, 484);

    const rotationState = useStore.getState();

    // Should only have attacks/buffs from character 463
    expect(rotationState.attacks).toHaveLength(1);
    expect(rotationState.attacks[0].characterId).toBe(463);
    expect(rotationState.buffs).toHaveLength(1);
    expect(rotationState.buffs[0].characterId).toBe(463);

    // Team should have new character
    expect(useStore.getState().team[0].id).toBe(484);
  });

  it('should not clear rotation data when setting to the same character', () => {
    const attacks: Array<AttackInstance> = [
      {
        id: 1,
        characterId: 468,
        instanceId: 'attack-1',
        parameterValues: [],
      },
      {
        id: 2,
        characterId: 463,
        instanceId: 'attack-2',
        parameterValues: [],
      },
    ];

    const buffs: Array<ModifierInstance> = [
      {
        id: 1,
        characterId: 468,
        instanceId: 'buff-1',
        parameterValues: [],
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      },
    ];

    useStore.setState({ attacks, buffs });

    // Set to same character
    useStore.getState().setCharacter(0, 468);

    const rotationState = useStore.getState();

    // Should still have all attacks and buffs
    expect(rotationState.attacks).toHaveLength(2);
    expect(rotationState.buffs).toHaveLength(1);
  });

  it('should preserve rotation data for other characters when one changes', () => {
    const attacks: Array<AttackInstance> = [
      {
        id: 1,
        characterId: 468,
        instanceId: 'attack-1',
        parameterValues: [],
      },
      {
        id: 2,
        characterId: 463,
        instanceId: 'attack-2',
        parameterValues: [],
      },
      {
        id: 3,
        characterId: 484,
        instanceId: 'attack-3',
        parameterValues: [],
      },
    ];

    const buffs: Array<ModifierInstance> = [
      {
        id: 1,
        characterId: 468,
        instanceId: 'buff-1',
        parameterValues: [],
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      },
      {
        id: 2,
        characterId: 463,
        instanceId: 'buff-2',
        parameterValues: [],
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      },
      {
        id: 3,
        characterId: 484,
        instanceId: 'buff-3',
        parameterValues: [],
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      },
    ];

    useStore.setState({ attacks, buffs });

    // Change character at index 1 from 463 to 468 (swap)
    useStore.getState().setCharacter(1, 468);

    const rotationState = useStore.getState();

    // Should clear 463's data but keep 468 and 484
    expect(rotationState.attacks).toHaveLength(2);
    expect(rotationState.attacks.map((a) => a.characterId)).toEqual([468, 484]);
    expect(rotationState.buffs).toHaveLength(2);
    expect(rotationState.buffs.map((b) => b.characterId)).toEqual([468, 484]);
  });

  it('should handle changing character when rotation is empty', () => {
    useStore.getState().setCharacter(0, 484);

    const rotationState = useStore.getState();

    // Should still be empty
    expect(rotationState.attacks).toHaveLength(0);
    expect(rotationState.buffs).toHaveLength(0);

    // Team should have new character
    expect(useStore.getState().team[0].id).toBe(484);
  });

  it('should clear all instances of old character across multiple attacks and buffs', () => {
    const attacks: Array<AttackInstance> = [
      {
        id: 1,
        characterId: 468,
        instanceId: 'attack-1',
        parameterValues: [],
      },
      {
        id: 2,
        characterId: 468,
        instanceId: 'attack-2',
        parameterValues: [],
      },
      {
        id: 3,
        characterId: 468,
        instanceId: 'attack-3',
        parameterValues: [],
      },
      {
        id: 4,
        characterId: 463,
        instanceId: 'attack-4',
        parameterValues: [],
      },
    ];

    const buffs: Array<ModifierInstance> = [
      {
        id: 1,
        characterId: 468,
        instanceId: 'buff-1',
        parameterValues: [],
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      },
      {
        id: 2,
        characterId: 468,
        instanceId: 'buff-2',
        parameterValues: [],
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      },
    ];

    useStore.setState({ attacks, buffs });

    // Change character from 468 to 484
    useStore.getState().setCharacter(0, 484);

    const rotationState = useStore.getState();

    // All 468 instances should be gone
    expect(rotationState.attacks).toHaveLength(1);
    expect(rotationState.attacks[0].characterId).toBe(463);
    expect(rotationState.buffs).toHaveLength(0);
  });
});

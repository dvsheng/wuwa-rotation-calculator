import { beforeEach, describe, expect, it } from 'vitest';

import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';

import { useRotationStore } from './useRotationStore';
import { useTeamStore } from './useTeamStore';

describe('useTeamStore - setCharacter integration', () => {
  beforeEach(() => {
    // Reset both stores before each test
    useTeamStore.setState({
      team: [
        {
          id: 1304,
          sequence: 0,
          weapon: { id: 21_010_025, refine: '1' },
          echoSets: [{ id: 5, requirement: '5' }],
          primarySlotEcho: { id: 6_000_059 },
          echoStats: [],
        },
        {
          id: 1209,
          sequence: 0,
          weapon: { id: 21_010_045, refine: '1' },
          echoSets: [{ id: 2, requirement: '5' }],
          primarySlotEcho: { id: 390_080_007 },
          echoStats: [],
        },
        {
          id: 1505,
          sequence: 0,
          weapon: { id: 21_050_036, refine: '1' },
          echoSets: [{ id: 7, requirement: '5' }],
          primarySlotEcho: { id: 390_080_005 },
          echoStats: [],
        },
      ],
    });

    useRotationStore.setState({
      attacks: [],
      buffs: [],
    });
  });

  it('should clear attacks and buffs for the old character when character changes', () => {
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

    // Change character at index 0 from 1304 to 1505
    useTeamStore.getState().setCharacter(0, 1505);

    const rotationState = useRotationStore.getState();

    // Should only have attacks/buffs from character 1209
    expect(rotationState.attacks).toHaveLength(1);
    expect(rotationState.attacks[0].characterId).toBe(1209);
    expect(rotationState.buffs).toHaveLength(1);
    expect(rotationState.buffs[0].characterId).toBe(1209);

    // Team should have new character
    expect(useTeamStore.getState().team[0].id).toBe(1505);
  });

  it('should not clear rotation data when setting to the same character', () => {
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
    ];

    useRotationStore.setState({ attacks, buffs });

    // Set to same character
    useTeamStore.getState().setCharacter(0, 1304);

    const rotationState = useRotationStore.getState();

    // Should still have all attacks and buffs
    expect(rotationState.attacks).toHaveLength(2);
    expect(rotationState.buffs).toHaveLength(1);
  });

  it('should preserve rotation data for other characters when one changes', () => {
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
        characterId: 1505,
        instanceId: 'attack-3',
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
      {
        id: 3,
        characterId: 1505,
        instanceId: 'buff-3',
        parameterValues: [],
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      },
    ];

    useRotationStore.setState({ attacks, buffs });

    // Change character at index 1 from 1209 to 1304 (swap)
    useTeamStore.getState().setCharacter(1, 1304);

    const rotationState = useRotationStore.getState();

    // Should clear 1209's data but keep 1304 and 1505
    expect(rotationState.attacks).toHaveLength(2);
    expect(rotationState.attacks.map((a) => a.characterId)).toEqual([1304, 1505]);
    expect(rotationState.buffs).toHaveLength(2);
    expect(rotationState.buffs.map((b) => b.characterId)).toEqual([1304, 1505]);
  });

  it('should handle changing character when rotation is empty', () => {
    useTeamStore.getState().setCharacter(0, 1505);

    const rotationState = useRotationStore.getState();

    // Should still be empty
    expect(rotationState.attacks).toHaveLength(0);
    expect(rotationState.buffs).toHaveLength(0);

    // Team should have new character
    expect(useTeamStore.getState().team[0].id).toBe(1505);
  });

  it('should clear all instances of old character across multiple attacks and buffs', () => {
    const attacks: Array<AttackInstance> = [
      {
        id: 1,
        characterId: 1304,
        instanceId: 'attack-1',
        parameterValues: [],
      },
      {
        id: 2,
        characterId: 1304,
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
        characterId: 1209,
        instanceId: 'attack-4',
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
        characterId: 1304,
        instanceId: 'buff-2',
        parameterValues: [],
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      },
    ];

    useRotationStore.setState({ attacks, buffs });

    // Change character from 1304 to 1505
    useTeamStore.getState().setCharacter(0, 1505);

    const rotationState = useRotationStore.getState();

    // All 1304 instances should be gone
    expect(rotationState.attacks).toHaveLength(1);
    expect(rotationState.attacks[0].characterId).toBe(1209);
    expect(rotationState.buffs).toHaveLength(0);
  });
});

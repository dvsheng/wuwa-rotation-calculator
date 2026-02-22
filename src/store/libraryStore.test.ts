import { describe, expect, it } from 'vitest';

import type { Character } from '@/schemas/character';
import type { EchoCost, EchoPiece, EchoSubstatOptionType } from '@/schemas/echo';
import {
  ECHO_SUBSTAT_VALUES,
  EchoMainStatOption,
  EchoSubstatOption,
} from '@/schemas/echo';
import { initialEnemyData } from '@/schemas/enemy';
import type { SavedRotationData } from '@/schemas/library';
import type { Team } from '@/schemas/team';

import { useLibraryStore } from './libraryStore';

// --- Helpers copied from teamSlice.ts to create valid data ---

const getEchoSubstatValue = (stat: EchoSubstatOptionType) =>
  ECHO_SUBSTAT_VALUES[stat][0];

const createDefaultEchoStats = (cost: EchoCost): EchoPiece => {
  const mainStatType =
    cost === 4 ? EchoMainStatOption.CRIT_DMG : EchoMainStatOption.ATK_PERCENT;

  return {
    cost,
    mainStatType,
    substats: [
      {
        stat: EchoSubstatOption.HP_PERCENT,
        value: getEchoSubstatValue(EchoSubstatOption.HP_PERCENT),
      },
      {
        stat: EchoSubstatOption.ATK_PERCENT,
        value: getEchoSubstatValue(EchoSubstatOption.ATK_PERCENT),
      },
      {
        stat: EchoSubstatOption.DEF_PERCENT,
        value: getEchoSubstatValue(EchoSubstatOption.DEF_PERCENT),
      },
      {
        stat: EchoSubstatOption.CRIT_RATE,
        value: getEchoSubstatValue(EchoSubstatOption.CRIT_RATE),
      },
      {
        stat: EchoSubstatOption.CRIT_DMG,
        value: getEchoSubstatValue(EchoSubstatOption.CRIT_DMG),
      },
    ],
  };
};

const CHARACTER_DEFAULTS: Record<
  number,
  | {
      weaponId: number;
      echoSetId: number;
      primaryEchoId: number;
    }
  | undefined
> = {
  468: {
    // Jinhsi
    weaponId: 504,
    echoSetId: 791,
    primaryEchoId: 667,
  },
  463: {
    // Mornye
    weaponId: 509,
    echoSetId: 778,
    primaryEchoId: 645,
  },
  484: {
    // Shorekeeper
    weaponId: 596,
    echoSetId: 793,
    primaryEchoId: 644,
  },
} as const;

const createDefaultCharacter = (
  id: number = 468,
  defaults = CHARACTER_DEFAULTS[id] as {
    weaponId: number;
    echoSetId: number;
    primaryEchoId: number;
  },
): Character => ({
  id,
  sequence: 0,
  weapon: { id: defaults.weaponId, refine: '1' },
  echoSets: [{ id: defaults.echoSetId, requirement: '5' }],
  primarySlotEcho: { id: defaults.primaryEchoId },
  echoStats: [
    createDefaultEchoStats(4),
    createDefaultEchoStats(3),
    createDefaultEchoStats(3),
    createDefaultEchoStats(1),
    createDefaultEchoStats(1),
  ],
});

const initialTeam: Team = [
  createDefaultCharacter(468),
  createDefaultCharacter(463),
  createDefaultCharacter(484),
];

// --- End Helpers ---

describe('useLibraryStore', () => {
  const dummyData: SavedRotationData = {
    team: initialTeam,
    enemy: initialEnemyData,
    attacks: [{ instanceId: 'a1', id: 1, characterId: 1, parameterValues: [] }],
    buffs: [
      {
        instanceId: 'b1',
        id: 1,
        characterId: 1,
        x: 0,
        y: 0,
        w: 1,
        h: 1,
        parameterValues: [],
      },
    ],
  };

  it('should add a rotation', () => {
    const store = useLibraryStore.getState();
    store.addRotation('Test Rotation', dummyData, 'Test Description');

    const { rotations } = useLibraryStore.getState();
    expect(rotations).toHaveLength(1);
    expect(rotations[0].name).toBe('Test Rotation');
    expect(rotations[0].description).toBe('Test Description');
    expect(rotations[0].data).toEqual(dummyData);
    expect(rotations[0].id).toBeDefined();
    expect(rotations[0].createdAt).toBeDefined();
    expect(rotations[0].updatedAt).toBeDefined();
  });

  it('should delete a rotation', () => {
    const store = useLibraryStore.getState();
    // Ensure clean state or add explicit clear if needed, but getState() is persistent?
    // In test environment, usually each test should be isolated.
    // However, zustand persistence might persist across tests if using localStorage mock.
    // But since we are not mocking localStorage explicitly and just using in-memory default behavior (or whatever mock does),
    // let's manually clear or check length.
    // Actually, `useLibraryStore` is a singleton.
    // We should probably reset it.
    // Or just work with accumulated state if we don't reset.
    // Let's reset:
    useLibraryStore.setState({ rotations: [] });

    store.addRotation('Test Rotation', dummyData);

    let { rotations } = useLibraryStore.getState();
    expect(rotations).toHaveLength(1);
    const idToDelete = rotations[0].id;

    store.deleteRotation(idToDelete);

    rotations = useLibraryStore.getState().rotations;
    expect(rotations).toHaveLength(0);
  });

  it('should update a rotation', () => {
    useLibraryStore.setState({ rotations: [] });
    const store = useLibraryStore.getState();
    store.addRotation('Original Name', dummyData);

    let { rotations } = useLibraryStore.getState();
    const idToUpdate = rotations[0].id;
    const originalUpdatedAt = rotations[0].updatedAt;

    store.updateRotation(idToUpdate, { name: 'Updated Name' });

    rotations = useLibraryStore.getState().rotations;
    expect(rotations).toHaveLength(1);
    expect(rotations[0].name).toBe('Updated Name');
    expect(rotations[0].id).toBe(idToUpdate);
    expect(rotations[0].updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
  });
});

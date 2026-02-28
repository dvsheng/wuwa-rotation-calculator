import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Character } from '@/schemas/character';
import { EchoMainStatOption, EchoSubstatOption } from '@/schemas/echo';
import type { Enemy } from '@/schemas/enemy';
import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';
import type { Team } from '@/schemas/team';
import { calculateRotationHandler } from '@/services/rotation-calculator/calculate-client-rotation-damage';
import {
  AttackScalingProperty,
  Attribute,
  CharacterStat,
  EnemyStat,
  NegativeStatus,
  Tag,
} from '@/types';

import * as enrichRotationData from './client-input-adapter/enrich-rotation-data';

// Use vi.hoisted to define mocks used in vi.mock
const { mockGetEntityByHakushinId } = vi.hoisted(() => ({
  mockGetEntityByHakushinId: vi.fn(),
}));

vi.mock('@/services/game-data/get-entity-details.function', () => ({
  getEntityByHakushinId: mockGetEntityByHakushinId,
}));

/**
 * Creates a minimal character configuration for testing.
 */
const createTestCharacter = (
  id: number,
  overrides: Partial<Character> = {},
): Character => ({
  id,
  sequence: 0,
  weapon: { id: 21_020_016, refine: '1' }, // Commando of Conviction (3★ sword)
  echoSets: [{ id: 1, requirement: '5' }], // Lingering Tunes
  primarySlotEcho: { id: 6_000_038 }, // Crownless
  echoStats: [
    {
      cost: 4,
      mainStatType: EchoMainStatOption.CRIT_DMG,
      substats: [
        { stat: EchoSubstatOption.HP_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.ATK_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.DEF_PERCENT, value: 8.1 },
        { stat: EchoSubstatOption.CRIT_RATE, value: 6.3 },
        { stat: EchoSubstatOption.CRIT_DMG, value: 12.6 },
      ],
    },
    {
      cost: 3,
      mainStatType: EchoMainStatOption.ATK_PERCENT,
      substats: [
        { stat: EchoSubstatOption.HP_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.ATK_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.DEF_PERCENT, value: 8.1 },
        { stat: EchoSubstatOption.CRIT_RATE, value: 6.3 },
        { stat: EchoSubstatOption.CRIT_DMG, value: 12.6 },
      ],
    },
    {
      cost: 3,
      mainStatType: EchoMainStatOption.ATK_PERCENT,
      substats: [
        { stat: EchoSubstatOption.HP_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.ATK_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.DEF_PERCENT, value: 8.1 },
        { stat: EchoSubstatOption.CRIT_RATE, value: 6.3 },
        { stat: EchoSubstatOption.CRIT_DMG, value: 12.6 },
      ],
    },
    {
      cost: 1,
      mainStatType: EchoMainStatOption.ATK_PERCENT,
      substats: [
        { stat: EchoSubstatOption.HP_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.ATK_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.DEF_PERCENT, value: 8.1 },
        { stat: EchoSubstatOption.CRIT_RATE, value: 6.3 },
        { stat: EchoSubstatOption.CRIT_DMG, value: 12.6 },
      ],
    },
    {
      cost: 1,
      mainStatType: EchoMainStatOption.ATK_PERCENT,
      substats: [
        { stat: EchoSubstatOption.HP_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.ATK_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.DEF_PERCENT, value: 8.1 },
        { stat: EchoSubstatOption.CRIT_RATE, value: 6.3 },
        { stat: EchoSubstatOption.CRIT_DMG, value: 12.6 },
      ],
    },
  ],
  ...overrides,
});

const createTestEnemy = (): Enemy => ({
  level: 90,
  resistances: {
    [Attribute.GLACIO]: 10,
    [Attribute.FUSION]: 10,
    [Attribute.AERO]: 10,
    [Attribute.ELECTRO]: 10,
    [Attribute.HAVOC]: 10,
    [Attribute.SPECTRO]: 10,
    [Attribute.PHYSICAL]: 10,
  },
});

/**
 * Creates mock character data returned by getCharacterDetails
 */
const createMockCharacterData = (
  id: number,
  name: string,
  attribute: string,
  attacks: Array<{
    id: number;
    name: string;
    damageInstances: Array<{
      motionValue: number;
      tags: Array<string>;
      scalingStat: AttackScalingProperty;
    }>;
  }> = [],
  modifiers: Array<{
    id: number;
    name: string;
    target: string;
    modifiedStats: Array<{ stat: string; value: number; tags: Array<string> }>;
  }> = [],
) => ({
  id,
  name,
  attribute,
  capabilities: {
    attacks: attacks.map((a) => ({
      ...a,
      parentName: name,
    })),
    modifiers,
    permanentStats: [
      // Base ATK for damage calculation
      { stat: CharacterStat.ATTACK_FLAT, value: 400, tags: [Tag.ALL] },
    ],
  },
});

/**
 * Creates mock weapon data
 */
const createMockWeaponData = () => ({
  capabilities: {
    attacks: [],
    modifiers: [],
    permanentStats: [{ stat: CharacterStat.ATTACK_FLAT, value: 337, tags: [Tag.ALL] }],
  },
});

/**
 * Creates mock echo data
 */
const createMockEchoData = () => ({
  capabilities: {
    attacks: [],
    modifiers: [],
    permanentStats: [],
  },
});

/**
 * Creates mock echo set data
 */
const createMockEchoSetData = () => ({
  capabilities: {
    attacks: [],
    modifiers: [],
    permanentStats: [],
  },
});

describe('calculateRotation', () => {
  beforeEach(() => {
    mockGetEntityByHakushinId.mockReset();

    // Default mock implementation - returns appropriate data based on entity type
    mockGetEntityByHakushinId.mockImplementation(({ data }) => {
      switch (data.entityType) {
        case 'echo': {
          return Promise.resolve(createMockEchoData());
        }
        case 'weapon': {
          return Promise.resolve(createMockWeaponData());
        }
        case 'echo_set': {
          return Promise.resolve(createMockEchoSetData());
        }
        case 'character': {
          return Promise.reject(new Error(`Character ${data.id} not mocked`));
        }
        default: {
          return Promise.reject(new Error(`Unknown entity type: ${data.entityType}`));
        }
      }
    });
  });

  describe('Augusta (1306) with Crown of Wills modifier', () => {
    const AUGUSTA_ID = 1306;
    const AUGUSTA_BASIC_ATTACK_1_ID = 1_234_565; // Basic Attack Stage 1
    const AUGUSTA_CROWN_OF_WILLS_ID = 9_602_988; // Crown of Wills (Electro DMG Bonus)

    // Mock Augusta with her Basic Attack and Crown of Wills modifier
    const mockAugusta = createMockCharacterData(
      AUGUSTA_ID,
      'Augusta',
      Tag.ELECTRO,
      [
        {
          id: AUGUSTA_BASIC_ATTACK_1_ID,
          name: 'Basic Attack Stage 1',
          damageInstances: [
            {
              motionValue: 0.5,
              tags: [Tag.BASIC_ATTACK],
              scalingStat: AttackScalingProperty.ATK,
            },
            {
              motionValue: 0.5,
              tags: [Tag.BASIC_ATTACK],
              scalingStat: AttackScalingProperty.ATK,
            },
          ],
        },
      ],
      [
        {
          id: AUGUSTA_CROWN_OF_WILLS_ID,
          name: 'Crown of Wills',
          target: 'self',
          modifiedStats: [
            {
              stat: CharacterStat.DAMAGE_BONUS,
              value: 0.15, // 15% Electro DMG Bonus at S0
              tags: [Tag.ELECTRO],
            },
          ],
        },
      ],
    );

    // Mock filler characters (minimal data)
    const mockJinhsi = createMockCharacterData(1304, 'Jinhsi', Tag.SPECTRO);
    const mockShorekeeper = createMockCharacterData(1505, 'Shorekeeper', Tag.SPECTRO);

    beforeEach(() => {
      mockGetEntityByHakushinId.mockImplementation(({ data }) => {
        // Handle character requests
        if (data.entityType === 'character') {
          switch (data.id) {
            case AUGUSTA_ID: {
              return Promise.resolve(mockAugusta);
            }
            case 1304: {
              return Promise.resolve(mockJinhsi);
            }
            case 1505: {
              return Promise.resolve(mockShorekeeper);
            }
            default: {
              return Promise.reject(new Error(`Unknown character ID: ${data.id}`));
            }
          }
        }
        // Handle other entity types with defaults
        switch (data.entityType) {
          case 'echo': {
            return Promise.resolve(createMockEchoData());
          }
          case 'weapon': {
            return Promise.resolve(createMockWeaponData());
          }
          case 'echo_set': {
            return Promise.resolve(createMockEchoSetData());
          }
          default: {
            return Promise.reject(new Error(`Unknown entity type: ${data.entityType}`));
          }
        }
      });
    });

    it('modifier does not apply when attack is outside modifier range', async () => {
      const team: Team = [
        createTestCharacter(AUGUSTA_ID),
        createTestCharacter(1304),
        createTestCharacter(1505),
      ];

      const enemy = createTestEnemy();

      const attack: AttackInstance = {
        instanceId: 'attack-instance-1',
        id: AUGUSTA_BASIC_ATTACK_1_ID,
        characterId: AUGUSTA_ID,
      };

      // Modifier is positioned AFTER the attack (x=1, but attack is at index 0)
      const crownOfWillsModifier: ModifierInstance = {
        instanceId: 'modifier-instance-1',
        id: AUGUSTA_CROWN_OF_WILLS_ID,
        characterId: AUGUSTA_ID,
        x: 1, // Start position (does NOT cover attack at index 0)
        y: 0,
        w: 1,
        h: 1,
      };

      const resultWithoutModifier = await calculateRotationHandler(
        team,
        enemy,
        [attack],
        [],
      );
      const resultWithMispositionedModifier = await calculateRotationHandler(
        team,
        enemy,
        [attack],
        [crownOfWillsModifier],
      );

      // Damage should be the same since modifier doesn't cover the attack
      expect(resultWithMispositionedModifier.totalDamage).toBe(
        resultWithoutModifier.totalDamage,
      );
    });
  });

  describe('Aero Erosion negative-status damage', () => {
    const AERO_CHARACTER_ID = 1601;
    const AERO_EROSION_ATTACK_ID = 7_701_001;
    const AERO_EROSION_STACK_MODIFIER_ID = 7_701_002;
    const AERO_EROSION_AMP_MODIFIER_ID = 7_701_003;
    const AERO_EROSION_DEFENSE_IGNORE_MODIFIER_ID = 7_701_004;

    beforeEach(() => {
      vi.spyOn(enrichRotationData, 'createGameDataEnricher').mockResolvedValue({
        enrichAttack: (attack) => ({
          ...attack,
          id: AERO_EROSION_ATTACK_ID,
          name: 'Aero Erosion',
          parentName: 'Negative Status',
          originType: 'Inherent Skill',
          attribute: Attribute.AERO,
          damageInstances: [
            {
              motionValue: 0,
              tags: [Tag.ALL, Attribute.AERO, NegativeStatus.AERO_EROSION],
              scalingStat: NegativeStatus.AERO_EROSION,
            },
          ],
        }),
        enrichModifier: (modifier) => {
          if (modifier.id === AERO_EROSION_STACK_MODIFIER_ID) {
            return {
              ...modifier,
              name: 'Aero Erosion Stacks',
              originType: 'Inherent Skill',
              parentName: 'Negative Status',
              target: 'enemy',
              modifiedStats: [
                { stat: EnemyStat.AERO_EROSION, value: 9, tags: [Tag.ALL] },
              ],
            };
          }
          if (modifier.id === AERO_EROSION_DEFENSE_IGNORE_MODIFIER_ID) {
            return {
              ...modifier,
              name: 'Aero Erosion Defense Ignore',
              originType: 'Inherent Skill',
              parentName: 'Negative Status',
              target: 'team',
              modifiedStats: [
                {
                  stat: CharacterStat.DEFENSE_IGNORE,
                  value: 0.3,
                  tags: [Attribute.AERO],
                },
              ],
            };
          }
          return {
            ...modifier,
            name: 'Aero Erosion Damage Amplify',
            originType: 'Inherent Skill',
            parentName: 'Negative Status',
            target: 'team',
            modifiedStats: [
              {
                stat: CharacterStat.DAMAGE_AMPLIFICATION,
                value: 1,
                tags: [Tag.AERO_EROSION],
              },
            ],
          };
        },
        getPermanentStatsForCharacter: () => [],
        getTuneBreakAttacks: () => [],
      });
    });

    it('deals approximately 28,471 total damage with 9 Aero Erosion stacks and +100% amp', async () => {
      const team: Team = [
        createTestCharacter(AERO_CHARACTER_ID),
        createTestCharacter(1304),
        createTestCharacter(1505),
      ];
      const enemy: Enemy = {
        ...createTestEnemy(),
        level: 100,
        resistances: {
          ...createTestEnemy().resistances,
          [Attribute.AERO]: 10,
        },
      };

      const attack: AttackInstance = {
        instanceId: 'attack-instance-1',
        id: AERO_EROSION_ATTACK_ID,
        characterId: AERO_CHARACTER_ID,
      };
      const erosionStacks: ModifierInstance = {
        instanceId: 'modifier-instance-erosion-stacks',
        id: AERO_EROSION_STACK_MODIFIER_ID,
        characterId: AERO_CHARACTER_ID,
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      };
      const erosionAmp: ModifierInstance = {
        instanceId: 'modifier-instance-erosion-amp',
        id: AERO_EROSION_AMP_MODIFIER_ID,
        characterId: AERO_CHARACTER_ID,
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      };

      const result = await calculateRotationHandler(
        team,
        enemy,
        [attack],
        [erosionStacks, erosionAmp],
      );

      expect(result.damageDetails[0].enemy.aeroErosion).toBe(9);
      expect(result.damageDetails[0].character.damageAmplification).toBe(1);
      expect(result.totalDamage).toBeCloseTo(28_471, 0);
      expect(result.damageDetails).toHaveLength(1);
      expect(result.damageDetails[0].damage).toBeCloseTo(28_471, 0);
    });

    it('applies defense ignore modifiers to negative-status damage', async () => {
      const team: Team = [
        createTestCharacter(AERO_CHARACTER_ID),
        createTestCharacter(1304),
        createTestCharacter(1505),
      ];
      const enemy: Enemy = {
        ...createTestEnemy(),
        level: 100,
        resistances: {
          ...createTestEnemy().resistances,
          [Attribute.AERO]: 10,
        },
      };

      const attack: AttackInstance = {
        instanceId: 'attack-instance-1',
        id: AERO_EROSION_ATTACK_ID,
        characterId: AERO_CHARACTER_ID,
      };
      const erosionStacks: ModifierInstance = {
        instanceId: 'modifier-instance-erosion-stacks',
        id: AERO_EROSION_STACK_MODIFIER_ID,
        characterId: AERO_CHARACTER_ID,
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      };
      const erosionDefenseIgnore: ModifierInstance = {
        instanceId: 'modifier-instance-erosion-defense-ignore',
        id: AERO_EROSION_DEFENSE_IGNORE_MODIFIER_ID,
        characterId: AERO_CHARACTER_ID,
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      };

      const resultWithoutDefenseIgnore = await calculateRotationHandler(
        team,
        enemy,
        [attack],
        [erosionStacks],
      );
      const resultWithDefenseIgnore = await calculateRotationHandler(
        team,
        enemy,
        [attack],
        [erosionStacks, erosionDefenseIgnore],
      );

      expect(resultWithoutDefenseIgnore.damageDetails[0].character.defenseIgnore).toBe(
        0,
      );
      expect(resultWithDefenseIgnore.damageDetails[0].character.defenseIgnore).toBe(
        0.3,
      );
      expect(resultWithDefenseIgnore.totalDamage).toBeGreaterThan(
        resultWithoutDefenseIgnore.totalDamage,
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });
  });

  describe('Tune Break virtual attack expansion', () => {
    const CHAR_A_ID = 1601;
    const CHAR_B_ID = 1602;
    const TUNE_BREAK_ATK_ID_A = 8_800_001;
    const TUNE_BREAK_ATK_ID_B = 8_800_002;

    beforeEach(() => {
      mockGetEntityByHakushinId.mockImplementation(({ data }) => {
        if (data.entityType === 'character') {
          const tuneBreakAttack = (id: number) => ({
            id,
            name: 'Tune Rupture Response',
            parentName: 'Tune Break',
            originType: 'Tune Break',
            attribute: Tag.SPECTRO,
            damageInstances: [
              {
                motionValue: 1,
                tags: [Tag.ALL],
                scalingStat: AttackScalingProperty.TUNE_RUPTURE_ATK,
              },
            ],
          });
          switch (data.id) {
            case CHAR_A_ID: {
              return Promise.resolve(
                createMockCharacterData(CHAR_A_ID, 'CharA', Tag.SPECTRO, [
                  tuneBreakAttack(TUNE_BREAK_ATK_ID_A),
                ]),
              );
            }
            case CHAR_B_ID: {
              return Promise.resolve(
                createMockCharacterData(CHAR_B_ID, 'CharB', Tag.SPECTRO, [
                  tuneBreakAttack(TUNE_BREAK_ATK_ID_B),
                ]),
              );
            }
            case 1505: {
              return Promise.resolve(
                createMockCharacterData(1505, 'Filler', Tag.SPECTRO),
              );
            }
            default: {
              return Promise.reject(new Error(`Unknown character ID: ${data.id}`));
            }
          }
        }
        switch (data.entityType) {
          case 'echo': {
            return Promise.resolve(createMockEchoData());
          }
          case 'weapon': {
            return Promise.resolve(createMockWeaponData());
          }
          case 'echo_set': {
            return Promise.resolve(createMockEchoSetData());
          }
          default: {
            return Promise.reject(new Error(`Unknown entity type: ${data.entityType}`));
          }
        }
      });
    });

    it('expands a single virtual Tune Break attack into one damage entry per character', async () => {
      const team: Team = [
        createTestCharacter(CHAR_A_ID),
        createTestCharacter(CHAR_B_ID),
        createTestCharacter(1505),
      ];
      const enemy = createTestEnemy();

      const tuneBreakAttack: AttackInstance = {
        instanceId: 'tune-break-1',
        id: 0, // TUNE_BREAK_ATTACK_ID
        characterId: 0,
      };

      const result = await calculateRotationHandler(team, enemy, [tuneBreakAttack], []);

      // Two characters each contribute one damage entry
      expect(result.damageDetails).toHaveLength(2);

      // Both entries trace back to stored attack index 0 (the single Tune Break instance)
      expect(result.damageDetails[0].attackIndex).toBe(0);
      expect(result.damageDetails[1].attackIndex).toBe(0);

      // Each entry is attributed to a different character slot
      expect(result.damageDetails[0].characterIndex).toBe(0);
      expect(result.damageDetails[1].characterIndex).toBe(1);

      // Total damage is the sum of both characters' contributions
      const sum = result.damageDetails[0].damage + result.damageDetails[1].damage;
      expect(result.totalDamage).toBeCloseTo(sum, 5);
      expect(result.totalDamage).toBeGreaterThan(0);
    });

    it('produces no damage entries when no characters have tune break attacks', async () => {
      const team: Team = [
        createTestCharacter(1505), // filler with no tune break
        createTestCharacter(1505),
        createTestCharacter(1505),
      ];
      const enemy = createTestEnemy();

      const tuneBreakAttack: AttackInstance = {
        instanceId: 'tune-break-1',
        id: 0,
        characterId: 0,
      };

      const result = await calculateRotationHandler(team, enemy, [tuneBreakAttack], []);

      expect(result.damageDetails).toHaveLength(0);
      expect(result.totalDamage).toBe(0);
    });
  });

  describe('error handling', () => {
    it('throws an error when an invalid character entity ID is provided', async () => {
      const INVALID_CHARACTER_ID = 99_999;

      // Set up mock to throw error for invalid ID
      mockGetEntityByHakushinId.mockImplementation(({ data }) => {
        if (data.entityType === 'character' && data.id === INVALID_CHARACTER_ID) {
          return Promise.reject(new Error(`Entity not found for ID ${data.id}`));
        }
        // Return defaults for other entity types
        switch (data.entityType) {
          case 'echo': {
            return Promise.resolve(createMockEchoData());
          }
          case 'weapon': {
            return Promise.resolve(createMockWeaponData());
          }
          case 'echo_set': {
            return Promise.resolve(createMockEchoSetData());
          }
          default: {
            return Promise.reject(new Error(`Unknown entity type: ${data.entityType}`));
          }
        }
      });

      const team: Team = [
        createTestCharacter(INVALID_CHARACTER_ID),
        createTestCharacter(1304),
        createTestCharacter(1505),
      ];
      const enemy = createTestEnemy();
      const attack: AttackInstance = {
        instanceId: 'attack-1',
        id: 1,
        characterId: INVALID_CHARACTER_ID,
      };

      await expect(calculateRotationHandler(team, enemy, [attack], [])).rejects.toThrow(
        'Failed to fetch game data for team',
      );
    });
  });
});

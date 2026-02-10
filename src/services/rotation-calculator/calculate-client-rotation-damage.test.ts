import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Character } from '@/schemas/character';
import { EchoMainStatOption, EchoSubstatOption } from '@/schemas/echo';
import type { Enemy } from '@/schemas/enemy';
import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';
import type { Team } from '@/schemas/team';
import type {
  Attack,
  Modifier as GameDataModifier,
  GameDataRotationRuntimeResolvableNumber,
} from '@/services/game-data/types';
import {
  calculateRotationHandler,
  toRotationModifier,
  toRotationPermanentStat,
} from '@/services/rotation-calculator/calculate-client-rotation-damage';
import type { ResolveUserParameterizedType } from '@/services/rotation-calculator/resolve-user-parameterized-values';
import { AbilityAttribute, Attribute, CharacterStat, Tag } from '@/types';
import type { CharacterSlotNumber } from '@/types';

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
    tags: Array<string>;
    motionValues: Array<number>;
    scalingStat?: string;
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
      scalingStat: a.scalingStat ?? CharacterStat.ATTACK_FLAT,
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

/**
 * Helper to create mock modifiers for testing toRotationModifier
 */
const createMockModifier = (
  id: number,
  characterId: number,
  target: 'self' | 'team' | 'activeCharacter' | 'enemy',
  modifiedStats: Array<{
    stat: CharacterStat;
    value: number | GameDataRotationRuntimeResolvableNumber;
    tags: Array<string>;
  }>,
): ModifierInstance & ResolveUserParameterizedType<GameDataModifier> => ({
  instanceId: `modifier-${id}`,
  id,
  characterId,
  x: 0,
  y: 0,
  w: 1,
  h: 1,
  description: 'Test modifier description',
  target,
  modifiedStats,
  name: `Modifier ${id}`,
  originType: 'Echo',
});

/**
 * Helper to create mock attacks for testing toRotationModifier
 */
const createMockAttack = (
  id: number,
  characterId: number,
): AttackInstance & ResolveUserParameterizedType<Attack> => ({
  instanceId: `attack-${id}`,
  id,
  characterId,
  description: 'Test attack description',
  scalingStat: AbilityAttribute.ATK,
  attribute: Attribute.PHYSICAL,
  tags: [Tag.BASIC_ATTACK],
  motionValues: [1],
  name: `Attack ${id}`,
  originType: 'Echo',
});

describe('toRotationPermanentStat', () => {
  it('maps literal number values unchanged', () => {
    const stat = {
      stat: CharacterStat.ATTACK_FLAT,
      tags: [Tag.ALL],
      value: 500,
    };

    const result = toRotationPermanentStat(stat, 0);

    expect(result.stat).toBe(CharacterStat.ATTACK_FLAT);
    expect(result.tags).toEqual([Tag.ALL]);
    expect(result.value).toBe(500);
  });

  it('maps resolveWith from "self" to character index 0', () => {
    const stat = {
      stat: CharacterStat.DAMAGE_BONUS,
      tags: [Tag.ELECTRO],
      value: {
        resolveWith: 'self' as const,
        parameterConfigs: {
          energyRegen: {
            scale: 0.15,
            minimum: 0.1,
            maximum: 0.5,
          },
        },
      },
    };

    const result = toRotationPermanentStat(stat, 0);

    expect(result.stat).toBe(CharacterStat.DAMAGE_BONUS);
    expect(result.tags).toEqual([Tag.ELECTRO]);
    expect(typeof result.value).toBe('object');
    if (typeof result.value === 'object') {
      expect(result.value.resolveWith).toBe(0);
      expect(result.value.parameterConfigs).toEqual(stat.value.parameterConfigs);
    }
  });

  it('maps resolveWith from "self" to character index 1', () => {
    const stat = {
      stat: CharacterStat.DAMAGE_BONUS,
      tags: [Tag.GLACIO],
      value: {
        resolveWith: 'self' as const,
        parameterConfigs: {
          energyRegen: {
            scale: 0.2,
          },
        },
      },
    };

    const result = toRotationPermanentStat(stat, 1);

    expect(typeof result.value).toBe('object');
    if (typeof result.value === 'object') {
      expect(result.value.resolveWith).toBe(1);
    }
  });

  it('maps resolveWith from "self" to character index 2', () => {
    const stat = {
      stat: CharacterStat.DAMAGE_BONUS,
      tags: [Tag.FUSION],
      value: {
        resolveWith: 'self' as const,
        parameterConfigs: {
          energyRegen: {
            scale: 0.3,
          },
        },
      },
    };

    const result = toRotationPermanentStat(stat, 2);

    expect(typeof result.value).toBe('object');
    if (typeof result.value === 'object') {
      expect(result.value.resolveWith).toBe(2);
    }
  });

  it('preserves parameterConfigs and offset', () => {
    const stat = {
      stat: CharacterStat.DAMAGE_BONUS,
      tags: [Tag.ALL],
      value: {
        resolveWith: 'self' as const,
        parameterConfigs: {
          energyRegen: {
            scale: 1,
            minimum: 0.5,
            maximum: 2,
          },
        },
        offset: 0.25,
      },
    };

    const result = toRotationPermanentStat(stat, 1);

    expect(typeof result.value).toBe('object');
    if (typeof result.value === 'object') {
      expect(result.value.resolveWith).toBe(1);
      expect(result.value.parameterConfigs).toEqual(stat.value.parameterConfigs);
      expect(result.value.offset).toBe(0.25);
    }
  });
});

describe('toRotationModifier', () => {
  it('maps self target modifier with resolveWith "self" to character slot 0', () => {
    const modifier = createMockModifier(45_667, 32_132, 'self', [
      {
        stat: CharacterStat.DAMAGE_BONUS,
        value: {
          resolveWith: 'self',
          parameterConfigs: {
            energyRegen: {
              scale: 0.15,
            },
          },
        },
        tags: [Tag.ELECTRO],
      },
    ]);
    const attack = createMockAttack(15_678, 32_132);
    const characterIdToSlotNumberMap = {
      32_132: 0,
      1234: 1,
      5678: 2,
    } as Record<number, CharacterSlotNumber>;

    const result = toRotationModifier(modifier, attack, characterIdToSlotNumberMap);

    expect(result.targets).toEqual([0]);
    expect(result.modifiedStats[CharacterStat.DAMAGE_BONUS]).toBeDefined();
    const damageBonus = result.modifiedStats[CharacterStat.DAMAGE_BONUS]![0];
    expect(damageBonus.tags).toEqual([Tag.ELECTRO]);
    expect(typeof damageBonus.value).toBe('object');
    if (typeof damageBonus.value === 'object') {
      expect(damageBonus.value.resolveWith).toBe(0);
    }
  });

  it('maps self target modifier with resolveWith "self" to character slot 1', () => {
    const modifier = createMockModifier(45_667, 1234, 'self', [
      {
        stat: CharacterStat.DAMAGE_BONUS,
        value: {
          resolveWith: 'self',
          parameterConfigs: {
            energyRegen: {
              scale: 0.2,
            },
          },
        },
        tags: [Tag.GLACIO],
      },
    ]);
    const attack = createMockAttack(15_678, 1234);
    const characterIdToSlotNumberMap = {
      32_132: 0,
      1234: 1,
      5678: 2,
    } as Record<number, CharacterSlotNumber>;

    const result = toRotationModifier(modifier, attack, characterIdToSlotNumberMap);

    expect(result.targets).toEqual([1]);
    const damageBonus = result.modifiedStats[CharacterStat.DAMAGE_BONUS]![0];
    if (typeof damageBonus.value === 'object') {
      expect(damageBonus.value.resolveWith).toBe(1);
    }
  });

  it('maps team target modifier to all character slots', () => {
    const modifier = createMockModifier(45_667, 32_132, 'team', [
      {
        stat: CharacterStat.DAMAGE_AMPLIFICATION,
        value: 0.15,
        tags: [Tag.ALL],
      },
    ]);
    const attack = createMockAttack(15_678, 32_132);
    const characterIdToSlotNumberMap = {
      32_132: 0,
      1234: 1,
      5678: 2,
    } as Record<number, CharacterSlotNumber>;

    const result = toRotationModifier(modifier, attack, characterIdToSlotNumberMap);

    expect(result.targets).toEqual([0, 1, 2]);
    expect(result.modifiedStats[CharacterStat.DAMAGE_AMPLIFICATION]).toBeDefined();
  });

  it('maps activeCharacter target modifier to attacking character slot', () => {
    const modifier = createMockModifier(45_667, 32_132, 'activeCharacter', [
      {
        stat: CharacterStat.DAMAGE_BONUS,
        value: 0.25,
        tags: [Tag.RESONANCE_SKILL],
      },
    ]);
    const attack = createMockAttack(15_678, 1234);
    const characterIdToSlotNumberMap = {
      32_132: 0,
      1234: 1,
      5678: 2,
    } as Record<number, CharacterSlotNumber>;

    const result = toRotationModifier(modifier, attack, characterIdToSlotNumberMap);

    // Should target the attacking character (char2, slot 1), not the modifier source
    expect(result.targets).toEqual([1]);
  });

  it('maps enemy target modifier to enemy', () => {
    const modifier = createMockModifier(45_667, 32_132, 'enemy', [
      {
        stat: CharacterStat.DAMAGE_BONUS, // This would typically be an EnemyStat in real usage
        value: 0.1,
        tags: [Tag.ALL],
      },
    ]);
    const attack = createMockAttack(15_678, 32_132);
    const characterIdToSlotNumberMap = {
      32_132: 0,
      1234: 1,
      5678: 2,
    } as Record<number, CharacterSlotNumber>;

    const result = toRotationModifier(modifier, attack, characterIdToSlotNumberMap);

    expect(result.targets).toEqual(['enemy']);
  });

  it('handles multiple stats with different resolveWith mappings', () => {
    const modifier = createMockModifier(45_667, 1234, 'self', [
      {
        stat: CharacterStat.DAMAGE_BONUS,
        value: {
          resolveWith: 'self',
          parameterConfigs: {
            energyRegen: {
              scale: 0.15,
            },
          },
        },
        tags: [Tag.ELECTRO],
      },
      {
        stat: CharacterStat.CRITICAL_RATE,
        value: 0.05,
        tags: [Tag.ALL],
      },
    ]);
    const attack = createMockAttack(15_678, 1234);
    const characterIdToSlotNumberMap = {
      32_132: 0,
      1234: 1,
      5678: 2,
    } as Record<number, CharacterSlotNumber>;

    const result = toRotationModifier(modifier, attack, characterIdToSlotNumberMap);

    expect(result.targets).toEqual([1]);

    const damageBonus = result.modifiedStats[CharacterStat.DAMAGE_BONUS]![0];
    if (typeof damageBonus.value === 'object') {
      expect(damageBonus.value.resolveWith).toBe(1);
    }

    const critRate = result.modifiedStats[CharacterStat.CRITICAL_RATE]![0];
    expect(critRate.value).toBe(0.05);
  });

  it('preserves all parameterConfigs fields during mapping', () => {
    const modifier = createMockModifier(45_667, 32_132, 'self', [
      {
        stat: CharacterStat.DAMAGE_BONUS,
        value: {
          resolveWith: 'self',
          parameterConfigs: {
            energyRegen: {
              scale: 1,
              minimum: 0.5,
              maximum: 2,
            },
          },
          offset: 0.1,
        },
        tags: [Tag.ELECTRO],
      },
    ]);
    const attack = createMockAttack(15_678, 32_132);
    const characterIdToSlotNumberMap = {
      32_132: 0,
      1234: 1,
      5678: 2,
    } as Record<number, CharacterSlotNumber>;

    const result = toRotationModifier(modifier, attack, characterIdToSlotNumberMap);

    const damageBonus = result.modifiedStats[CharacterStat.DAMAGE_BONUS]![0];
    if (typeof damageBonus.value === 'object') {
      expect(damageBonus.value.resolveWith).toBe(0);
      expect(damageBonus.value.parameterConfigs.energyRegen?.scale).toBe(1);
      expect(damageBonus.value.parameterConfigs.energyRegen?.minimum).toBe(0.5);
      expect(damageBonus.value.parameterConfigs.energyRegen?.maximum).toBe(2);
      expect(damageBonus.value.offset).toBe(0.1);
    }
  });
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
          tags: [Tag.BASIC_ATTACK],
          motionValues: [0.5, 0.5], // Example motion values
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
        `Entity not found for ID ${INVALID_CHARACTER_ID}`,
      );
    });
  });
});

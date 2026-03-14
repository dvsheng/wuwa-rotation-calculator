import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Character } from '@/schemas/character';
import {
  ECHO_SUBSTAT_VALUES,
  EchoMainStatOption,
  EchoSubstatOption,
} from '@/schemas/echo';
import type { Enemy } from '@/schemas/enemy';
import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';
import type { Team } from '@/schemas/team';
import { CapabilityType } from '@/services/game-data';
import { calculateRotationHandler } from '@/services/rotation-calculator/calculate-client-rotation-damage';
import { SensitivityAnalysisCategory } from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';
import {
  AttackScalingProperty,
  Attribute,
  CharacterStat,
  DamageType,
  EnemyStat,
  NegativeStatus,
  Tag,
} from '@/types';

import * as enrichRotationData from './client-input-adapter/enrich-rotation-data';

// Use vi.hoisted to define mocks used in vi.mock
const { mockgetEntityById } = vi.hoisted(() => ({
  mockgetEntityById: vi.fn(),
}));

vi.mock('@/services/game-data', async () => {
  const actual = await vi.importActual('@/services/game-data');

  return {
    ...actual,
    getEntityById: ({ data }: { data: unknown }) => mockgetEntityById(data),
  };
});

vi.mock('@/services/game-data/get-entity-details.function', () => ({
  getEntityById: ({ data }: { data: unknown }) => mockgetEntityById(data),
  getTypedEntityById: mockgetEntityById,
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
 * Creates mock character entity data returned by getTypedEntityById
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
    modifiedStats: Array<{
      target: string;
      stat: string;
      value: number;
      tags: Array<string>;
    }>;
  }> = [],
) => ({
  id,
  name,
  attribute,
  derivedAttributes: {
    preferredScalingStat: 'atk',
    dominantAttribute: attribute === Attribute.PHYSICAL ? undefined : attribute,
    preferredThreeCostScalingMainStat: EchoMainStatOption.ATK_PERCENT,
    preferredThreeCostAttributeMainStat:
      attribute === Attribute.GLACIO
        ? EchoMainStatOption.DAMAGE_BONUS_GLACIO
        : attribute === Attribute.FUSION
          ? EchoMainStatOption.DAMAGE_BONUS_FUSION
          : attribute === Attribute.AERO
            ? EchoMainStatOption.DAMAGE_BONUS_AERO
            : attribute === Attribute.ELECTRO
              ? EchoMainStatOption.DAMAGE_BONUS_ELECTRO
              : attribute === Attribute.HAVOC
                ? EchoMainStatOption.DAMAGE_BONUS_HAVOC
                : attribute === Attribute.SPECTRO
                  ? EchoMainStatOption.DAMAGE_BONUS_SPECTRO
                  : undefined,
  },
  capabilities: {
    attacks: attacks.map((a) => ({
      ...a,
      parentName: name,
      capabilityType: CapabilityType.ATTACK,
    })),
    modifiers: modifiers.map((modifier) => ({
      ...modifier,
      parentName: name,
      capabilityType: CapabilityType.MODIFIER,
    })),
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
    mockgetEntityById.mockReset();

    // Default mock implementation - returns appropriate data based on entity type
    mockgetEntityById.mockImplementation((data) => {
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
          modifiedStats: [
            {
              target: 'self',
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
      mockgetEntityById.mockImplementation((data) => {
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
      mockgetEntityById.mockImplementation((data) => {
        switch (data.entityType) {
          case 'character': {
            return Promise.resolve(
              createMockCharacterData(data.id, `Character ${data.id}`, Attribute.AERO),
            );
          }
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

      vi.spyOn(enrichRotationData, 'createGameDataEnricher').mockResolvedValue({
        enrichAttack: (attack) => ({
          ...attack,
          id: AERO_EROSION_ATTACK_ID,
          name: 'Aero Erosion',
          parentName: 'Negative Status',
          originType: 'Inherent Skill',
          capabilityType: CapabilityType.ATTACK,
          attribute: Attribute.AERO,
          damageInstances: [
            {
              motionValue: 0,
              tags: [Tag.ALL, Attribute.AERO, NegativeStatus.AERO_EROSION],
              damageType: DamageType.NEGATIVE_STATUS,
              attribute: Attribute.AERO,
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
              capabilityType: CapabilityType.MODIFIER,
              modifiedStats: [
                {
                  target: 'enemy',
                  stat: EnemyStat.AERO_EROSION,
                  value: 9,
                  tags: [Tag.ALL],
                },
              ],
            };
          }
          if (modifier.id === AERO_EROSION_DEFENSE_IGNORE_MODIFIER_ID) {
            return {
              ...modifier,
              name: 'Aero Erosion Defense Ignore',
              originType: 'Inherent Skill',
              parentName: 'Negative Status',
              capabilityType: CapabilityType.MODIFIER,
              modifiedStats: [
                {
                  target: 'team',
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
            capabilityType: CapabilityType.MODIFIER,
            modifiedStats: [
              {
                target: 'team',
                stat: CharacterStat.DAMAGE_AMPLIFICATION,
                value: 1,
                tags: [Tag.AERO_EROSION],
              },
            ],
          };
        },
        getPermanentStatsForCharacter: () => [],
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

  describe('stat details (name/description) in damage output', () => {
    const DETAIL_CHARACTER_ID = 1306;
    const DETAIL_ATTACK_ID = 1_234_565;
    const DETAIL_MODIFIER_ID = 9_602_988;

    beforeEach(() => {
      mockgetEntityById.mockImplementation((data) => {
        switch (data.entityType) {
          case 'character': {
            return Promise.resolve(
              createMockCharacterData(
                data.id,
                data.id === DETAIL_CHARACTER_ID
                  ? 'Detail Character'
                  : `Character ${data.id}`,
                Attribute.ELECTRO,
              ),
            );
          }
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

      vi.spyOn(enrichRotationData, 'createGameDataEnricher').mockResolvedValue({
        enrichAttack: (attack) => ({
          ...attack,
          id: DETAIL_ATTACK_ID,
          name: 'Basic Attack Stage 1',
          parentName: 'Augusta',
          originType: 'Base Stats',
          capabilityType: CapabilityType.ATTACK,
          attribute: Tag.ELECTRO,
          damageInstances: [
            {
              motionValue: 0.5,
              tags: [Tag.BASIC_ATTACK, Tag.ELECTRO],
              damageType: DamageType.BASIC_ATTACK,
              attribute: Attribute.ELECTRO,
              scalingStat: AttackScalingProperty.ATK,
            },
          ],
        }),
        enrichModifier: (modifier) => ({
          ...modifier,
          id: DETAIL_MODIFIER_ID,
          name: 'Crown of Wills',
          description: 'Electro DMG Bonus from Sequence 1',
          parentName: 'Augusta',
          originType: 'Inherent Skill',
          capabilityType: CapabilityType.MODIFIER,
          modifiedStats: [
            {
              target: 'self',
              stat: CharacterStat.DAMAGE_BONUS,
              value: 0.15,
              tags: [Tag.ELECTRO],
            },
          ],
        }),
        getPermanentStatsForCharacter: (charIndex) =>
          charIndex === 0
            ? [
                {
                  id: 1,
                  name: 'Base ATK',
                  description: 'Augusta base attack',
                  parentName: 'Augusta',
                  originType: 'Base Stats',
                  capabilityType: CapabilityType.PERMANENT_STAT,
                  stat: CharacterStat.ATTACK_FLAT,
                  value: 400,
                  tags: [Tag.ALL],
                },
              ]
            : [],
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('includes name and description from permanent stat in teamDetails', async () => {
      const team: Team = [
        createTestCharacter(DETAIL_CHARACTER_ID),
        createTestCharacter(1304),
        createTestCharacter(1505),
      ];
      const attack: AttackInstance = {
        instanceId: 'attack-1',
        id: DETAIL_ATTACK_ID,
        characterId: DETAIL_CHARACTER_ID,
      };

      const result = await calculateRotationHandler(
        team,
        createTestEnemy(),
        [attack],
        [],
      );

      const attackFlatStats =
        result.damageDetails[0].teamDetails[0][CharacterStat.ATTACK_FLAT];
      expect(attackFlatStats.length).toBeGreaterThan(0);
      expect(attackFlatStats[0].name).toBe('Base ATK');
      expect(attackFlatStats[0].description).toBe('Augusta base attack');
    });

    it('includes modifier name and description on modifier stats in teamDetails', async () => {
      const team: Team = [
        createTestCharacter(DETAIL_CHARACTER_ID),
        createTestCharacter(1304),
        createTestCharacter(1505),
      ];
      const attack: AttackInstance = {
        instanceId: 'attack-1',
        id: DETAIL_ATTACK_ID,
        characterId: DETAIL_CHARACTER_ID,
      };
      const modifier: ModifierInstance = {
        instanceId: 'modifier-1',
        id: DETAIL_MODIFIER_ID,
        characterId: DETAIL_CHARACTER_ID,
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      };

      const result = await calculateRotationHandler(
        team,
        createTestEnemy(),
        [attack],
        [modifier],
      );

      const damageBonusStats =
        result.damageDetails[0].teamDetails[0][CharacterStat.DAMAGE_BONUS];
      const modifierStat = damageBonusStats.find((s) => s.name === 'Crown of Wills');
      expect(modifierStat).toBeDefined();
      expect(modifierStat?.description).toBe('Electro DMG Bonus from Sequence 1');
    });

    it('includes name and description on echo main stat in teamDetails', async () => {
      const team: Team = [
        createTestCharacter(DETAIL_CHARACTER_ID),
        createTestCharacter(1304),
        createTestCharacter(1505),
      ];
      const attack: AttackInstance = {
        instanceId: 'attack-1',
        id: DETAIL_ATTACK_ID,
        characterId: DETAIL_CHARACTER_ID,
      };

      const result = await calculateRotationHandler(
        team,
        createTestEnemy(),
        [attack],
        [],
      );

      // Test character has a crit_dmg echo main stat and several atk_percent echoes
      const critDamageStats =
        result.damageDetails[0].teamDetails[0][CharacterStat.CRITICAL_DAMAGE];
      const echoMainStat = critDamageStats.find((s) => s.name === 'Echo Main Stat');
      expect(echoMainStat).toBeDefined();
      expect(echoMainStat?.description).toBe('crit_dmg');
    });

    it('includes name and description on enemy base resistance in enemyDetails', async () => {
      const result = await calculateRotationHandler(
        [
          createTestCharacter(DETAIL_CHARACTER_ID),
          createTestCharacter(1304),
          createTestCharacter(1505),
        ],
        createTestEnemy(),
        [
          {
            instanceId: 'attack-1',
            id: DETAIL_ATTACK_ID,
            characterId: DETAIL_CHARACTER_ID,
          },
        ],
        [],
      );

      const baseResistanceStats =
        result.damageDetails[0].enemyDetails[EnemyStat.BASE_RESISTANCE];
      expect(baseResistanceStats.length).toBeGreaterThan(0);
      expect(baseResistanceStats.every((s) => s.name.length > 0)).toBe(true);
      expect(
        baseResistanceStats.every((s) => s.description === 'Base Resistance'),
      ).toBe(true);
    });
  });

  describe('sensitivity analysis', () => {
    const SENSITIVITY_CHARACTER_ID = 1306;
    const SENSITIVITY_ATTACK_ID = 1_234_565;

    beforeEach(() => {
      mockgetEntityById.mockImplementation((data) => {
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
            if (data.id === SENSITIVITY_CHARACTER_ID) {
              return Promise.resolve(
                createMockCharacterData(
                  SENSITIVITY_CHARACTER_ID,
                  'Augusta',
                  Attribute.FUSION,
                  [
                    {
                      id: SENSITIVITY_ATTACK_ID,
                      name: 'Basic Attack Stage 1',
                      damageInstances: [
                        {
                          motionValue: 0.5,
                          tags: [Tag.BASIC_ATTACK, Tag.FUSION],
                          scalingStat: AttackScalingProperty.ATK,
                        },
                      ],
                    },
                  ],
                ),
              );
            }

            return Promise.resolve(
              createMockCharacterData(
                data.id,
                `Character ${data.id}`,
                Attribute.FUSION,
              ),
            );
          }
          default: {
            return Promise.reject(new Error(`Unknown entity type: ${data.entityType}`));
          }
        }
      });
    });

    it('returns grouped sensitivity scenarios using the configured perturbations', async () => {
      const team: Team = [
        createTestCharacter(SENSITIVITY_CHARACTER_ID),
        createTestCharacter(1304),
        createTestCharacter(1505),
      ];
      const attack: AttackInstance = {
        instanceId: 'attack-1',
        id: SENSITIVITY_ATTACK_ID,
        characterId: SENSITIVITY_CHARACTER_ID,
      };

      const result = await calculateRotationHandler(
        team,
        createTestEnemy(),
        [attack],
        [],
      );

      const substatScenarios = result.sensitivityAnalysis.scenarios.filter(
        (scenario) => scenario.category === SensitivityAnalysisCategory.SUBSTAT_ROLL,
      );
      const threeCostScenarios = result.sensitivityAnalysis.scenarios.filter(
        (scenario) =>
          scenario.category === SensitivityAnalysisCategory.THREE_COST_MAIN_STAT_SWAP,
      );
      const fourCostScenarios = result.sensitivityAnalysis.scenarios.filter(
        (scenario) =>
          scenario.category === SensitivityAnalysisCategory.FOUR_COST_MAIN_STAT_SWAP,
      );

      expect(result.sensitivityAnalysis.characterIndex).toBe(0);
      expect(result.sensitivityAnalysis.baselineTotalDamage).toBe(result.totalDamage);
      expect(substatScenarios).toHaveLength(Object.values(EchoSubstatOption).length);
      expect(threeCostScenarios).toHaveLength(1);
      expect(fourCostScenarios).toHaveLength(1);
      expect(fourCostScenarios[0].label).toContain('Crit Dmg');
      expect(fourCostScenarios[0].label).toContain('Crit Rate');
      expect(threeCostScenarios[0].label).toContain('Atk Percent');
      expect(threeCostScenarios[0].label).toContain('Damage Bonus Fusion');
    });

    it('applies substat sensitivity using the third roll tier and correct tags', async () => {
      const team: Team = [
        createTestCharacter(SENSITIVITY_CHARACTER_ID),
        createTestCharacter(1304),
        createTestCharacter(1505),
      ];
      const attack: AttackInstance = {
        instanceId: 'attack-1',
        id: SENSITIVITY_ATTACK_ID,
        characterId: SENSITIVITY_CHARACTER_ID,
      };

      const result = await calculateRotationHandler(
        team,
        createTestEnemy(),
        [attack],
        [],
      );

      const critRateScenario = result.sensitivityAnalysis.scenarios.find(
        (scenario) => scenario.id === `substat:${EchoSubstatOption.CRIT_RATE}`,
      );
      const resonanceSkillScenario = result.sensitivityAnalysis.scenarios.find(
        (scenario) =>
          scenario.id === `substat:${EchoSubstatOption.DAMAGE_BONUS_RESONANCE_SKILL}`,
      );
      const basicAttackScenario = result.sensitivityAnalysis.scenarios.find(
        (scenario) =>
          scenario.id === `substat:${EchoSubstatOption.DAMAGE_BONUS_BASIC_ATTACK}`,
      );

      expect(critRateScenario?.description).toContain(
        String(ECHO_SUBSTAT_VALUES[EchoSubstatOption.CRIT_RATE][2]),
      );
      expect(basicAttackScenario?.totalDamageDelta).toBeGreaterThan(0);
      expect(resonanceSkillScenario?.totalDamageDelta).toBe(0);
      expect(critRateScenario?.totalDamageDelta).toBe(
        (critRateScenario?.perturbedTotalDamage ?? 0) - result.totalDamage,
      );
    });

    it('treats crit damage sensitivity rolls as percentage rolls, not flat values', async () => {
      const team: Team = [
        createTestCharacter(SENSITIVITY_CHARACTER_ID),
        createTestCharacter(1304),
        createTestCharacter(1505),
      ];
      const attack: AttackInstance = {
        instanceId: 'attack-1',
        id: SENSITIVITY_ATTACK_ID,
        characterId: SENSITIVITY_CHARACTER_ID,
      };

      const result = await calculateRotationHandler(
        team,
        createTestEnemy(),
        [attack],
        [],
      );

      const critDamageScenario = result.sensitivityAnalysis.scenarios.find(
        (scenario) => scenario.id === `substat:${EchoSubstatOption.CRIT_DMG}`,
      );

      expect(critDamageScenario).toBeDefined();
      expect(critDamageScenario?.totalDamageDelta).toBeGreaterThan(0);
      expect(critDamageScenario?.relativeDelta).toBeLessThan(1);
    });
  });

  describe('error handling', () => {
    it('throws an error when an invalid character entity ID is provided', async () => {
      const INVALID_CHARACTER_ID = 99_999;

      // Set up mock to throw error for invalid ID
      mockgetEntityById.mockImplementation((data) => {
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

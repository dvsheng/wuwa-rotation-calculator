import { describe, expect, it } from 'vitest';

import {
  AttackScalingProperty,
  Attribute,
  CharacterStat,
  EnemyStat,
  Tag,
} from '@/types';
import type { Character, Enemy, EnemyStats, Modifier, Team } from '@/types';

import { calculateRotationDamage } from './calculate-rotation-damage';
import type { Rotation } from './types';

/**
 * Creates a minimal character for testing.
 */
const createTestCharacter = (
  _id: number,
  overrides: Partial<Character> = {},
): Character => ({
  level: 90,
  stats: {
    [CharacterStat.ATTACK_FLAT]: [{ tags: [Tag.ALL], value: 1000 }],
    [CharacterStat.ATTACK_SCALING_BONUS]: [],
    [CharacterStat.ATTACK_FLAT_BONUS]: [],
    [CharacterStat.DEFENSE_FLAT]: [],
    [CharacterStat.DEFENSE_SCALING_BONUS]: [],
    [CharacterStat.DEFENSE_FLAT_BONUS]: [],
    [CharacterStat.HP_FLAT]: [],
    [CharacterStat.HP_SCALING_BONUS]: [],
    [CharacterStat.HP_FLAT_BONUS]: [],
    [CharacterStat.CRITICAL_RATE]: [{ tags: [Tag.ALL], value: 0.5 }], // 50% base crit rate
    [CharacterStat.CRITICAL_DAMAGE]: [{ tags: [Tag.ALL], value: 1 }], // 100% base crit dmg
    [CharacterStat.DEFENSE_IGNORE]: [],
    [CharacterStat.RESISTANCE_PENETRATION]: [],
    [CharacterStat.DAMAGE_BONUS]: [],
    [CharacterStat.DAMAGE_AMPLIFICATION]: [],
    [CharacterStat.DAMAGE_MULTIPLIER_BONUS]: [],
    [CharacterStat.FINAL_DAMAGE_BONUS]: [],
    [CharacterStat.OFF_TUNE_BUILDUP_RATE]: [],
    [CharacterStat.TUNE_BREAK_BOOST]: [],
    [CharacterStat.TUNE_STRAIN_DAMAGE_BONUS]: [],
    [CharacterStat.ENERGY_REGEN]: [{ tags: [Tag.ALL], value: 1 }],
    [CharacterStat.HEALING_BONUS]: [],
  },
  ...overrides,
});

const createTestEnemy = (): Enemy => ({
  level: 90,
  stats: {
    baseResistance: [
      { value: 0.1, tags: [Attribute.GLACIO] },
      { value: 0.1, tags: [Attribute.FUSION] },
      { value: 0.1, tags: [Attribute.AERO] },
      { value: 0.1, tags: [Attribute.ELECTRO] },
      { value: 0.1, tags: [Attribute.HAVOC] },
      { value: 0.1, tags: [Attribute.SPECTRO] },
      { value: 0.1, tags: [Attribute.PHYSICAL] },
    ],
    defenseReduction: [],
    resistanceReduction: [],
    glacioChafe: [],
    spectroFrazzle: [],
    fusionBurst: [],
    havocBane: [],
    aeroErosion: [],
    electroFlare: [],
    tuneStrainStacks: [],
  },
});

/** Minimal meta type used to verify T passthrough at the core level. */
type TestMeta = { label: string };

const emptyStatsMeta = Object.fromEntries(
  Object.values(CharacterStat).map((s) => [s, []]),
) as Record<CharacterStat, Array<never>>;

const createTestCharacterWithMeta = (
  attackFlatLabel = 'base-atk',
): Character<TestMeta> => ({
  level: 90,
  stats: {
    ...emptyStatsMeta,
    [CharacterStat.ATTACK_FLAT]: [
      { tags: [Tag.ALL], value: 1000, label: attackFlatLabel },
    ],
    [CharacterStat.CRITICAL_RATE]: [
      { tags: [Tag.ALL], value: 0.5, label: 'crit-rate' },
    ],
    [CharacterStat.CRITICAL_DAMAGE]: [{ tags: [Tag.ALL], value: 1, label: 'crit-dmg' }],
    [CharacterStat.ENERGY_REGEN]: [
      { tags: [Tag.ALL], value: 1, label: 'energy-regen' },
    ],
  },
});

const createTestEnemyWithMeta = (): Enemy<TestMeta> => ({
  level: 90,
  stats: {
    baseResistance: [
      { value: 0.1, tags: [Attribute.ELECTRO], label: 'electro-res' },
      { value: 0.1, tags: [Attribute.GLACIO], label: 'glacio-res' },
    ],
    defenseReduction: [],
    resistanceReduction: [],
    glacioChafe: [],
    spectroFrazzle: [],
    fusionBurst: [],
    havocBane: [],
    aeroErosion: [],
    electroFlare: [],
    tuneStrainStacks: [],
  } as unknown as EnemyStats<TestMeta>,
});

describe('calculateRotationDamage', () => {
  describe('runtime-resolvable modifiers', () => {
    it('should account for other modifiers when resolving runtime-resolvable stats', () => {
      // This test demonstrates the bug where runtime-resolvable modifiers (like crit damage
      // based on crit rate) don't take into account other modifiers that affect the source stat.
      //
      // Example: Augusta S6 Crown of Wills grants:
      // - 20% crit rate per stack (max 4 stacks = 80% crit rate)
      // - For every 1% crit rate over 150%, gain 2% crit damage (up to 50% bonus at 175% crit rate)
      //
      // The bug: The crit damage calculation uses the BASE crit rate (50% in this test),
      // not the crit rate AFTER applying the +80% from stacks (130% total).
      //
      // Expected behavior:
      // - Character has 50% base crit rate
      // - Modifier adds 80% crit rate → 130% total crit rate
      // - Runtime-resolvable should calculate: (130% - 150%) * 2 = -40% → 0% (below minimum)
      //
      // Buggy behavior:
      // - Runtime-resolvable calculates using BASE 50% crit rate: (50% - 150%) * 2 = -200% → 0%
      //
      // To make the test more obvious, let's use a higher base crit rate:
      // - Character has 100% base crit rate
      // - Modifier adds 80% crit rate → 180% total crit rate
      // - CORRECT: (180% - 150%) * 2 = 60%, capped at 50% → +50% crit damage
      // - BUGGY: (100% - 150%) * 2 = -100% → 0% (below minimum) → +0% crit damage

      const team: Team = [
        createTestCharacter(1, {
          stats: {
            ...createTestCharacter(1).stats,
            [CharacterStat.CRITICAL_RATE]: [{ tags: [Tag.ALL], value: 1 }], // 100% base crit rate
          },
        }),
        createTestCharacter(2),
        createTestCharacter(3),
      ];

      const enemy = createTestEnemy();

      // Create a modifier that:
      // 1. Adds 80% crit rate
      // 2. Adds crit damage based on crit rate (runtime-resolvable)
      const modifier: Modifier = {
        targets: [0], // Apply to character 0
        modifiedStats: {
          [CharacterStat.CRITICAL_RATE]: [
            {
              tags: [Tag.ALL],
              value: 0.8, // +80% crit rate
            },
          ],
          [CharacterStat.CRITICAL_DAMAGE]: [
            {
              tags: [Tag.ALL],
              value: {
                type: 'product',
                operands: [
                  {
                    type: 'clamp',
                    operand: {
                      type: 'sum',
                      operands: [
                        {
                          type: 'statParameterizedNumber',
                          stat: CharacterStat.CRITICAL_RATE,
                          characterIndex: 0,
                        },
                        -1.5,
                      ],
                    },
                    minimum: 0,
                    maximum: 0.25,
                  },
                  2,
                ],
              },
            },
          ],
        },
      };

      const rotation: Rotation = {
        team,
        enemy,
        duration: 10,
        attacks: [
          {
            attack: {
              characterIndex: 0,
              damageInstances: [
                {
                  scalingStat: AttackScalingProperty.ATK,
                  motionValue: 1,
                  tags: [Tag.BASIC_ATTACK, Tag.ELECTRO],
                },
              ],
            },
            modifiers: [modifier],
          },
        ],
      };

      const result = calculateRotationDamage(rotation);
      // Crit damage should include:
      // - 100% base
      // - Runtime-resolvable: (180% - 150%) * 2 = 60%, capped at 50%
      // Total: 150%
      expect(result.damageDetails[0].character.criticalDamage).toBe(1.5);
    });
  });

  describe('metadata (T) passthrough', () => {
    const baseRotation = {
      duration: 10,
      attacks: [
        {
          attack: {
            characterIndex: 0,
            damageInstances: [
              {
                scalingStat: AttackScalingProperty.ATK,
                motionValue: 1,
                tags: [Tag.BASIC_ATTACK, Tag.ELECTRO],
              },
            ],
          },
          modifiers: [] as Array<Modifier<TestMeta>>,
        },
      ],
    };

    it('preserves base stat meta in teamDetails', () => {
      const team: Team<TestMeta> = [
        createTestCharacterWithMeta('base-atk-char0'),
        createTestCharacterWithMeta(),
        createTestCharacterWithMeta(),
      ];

      const result = calculateRotationDamage<TestMeta>({
        ...baseRotation,
        team,
        enemy: createTestEnemyWithMeta(),
      });

      const attackFlatStats =
        result.damageDetails[0].teamDetails[0][CharacterStat.ATTACK_FLAT];
      expect(attackFlatStats).toHaveLength(1);
      expect(attackFlatStats[0].label).toBe('base-atk-char0');
    });

    it('preserves modifier stat meta in teamDetails after applyModifiers', () => {
      const modifier: Modifier<TestMeta> = {
        targets: [0],
        modifiedStats: {
          [CharacterStat.DAMAGE_BONUS]: [
            { tags: [Tag.ELECTRO], value: 0.5, label: 'crown-of-wills' },
          ],
        },
      };

      const result = calculateRotationDamage<TestMeta>({
        ...baseRotation,
        team: [
          createTestCharacterWithMeta(),
          createTestCharacterWithMeta(),
          createTestCharacterWithMeta(),
        ],
        enemy: createTestEnemyWithMeta(),
        attacks: [{ ...baseRotation.attacks[0], modifiers: [modifier] }],
      });

      const damageBonusStats =
        result.damageDetails[0].teamDetails[0][CharacterStat.DAMAGE_BONUS];
      expect(damageBonusStats).toHaveLength(1);
      expect(damageBonusStats[0].label).toBe('crown-of-wills');
    });

    it('preserves enemy stat meta in enemyDetails', () => {
      const result = calculateRotationDamage<TestMeta>({
        ...baseRotation,
        team: [
          createTestCharacterWithMeta(),
          createTestCharacterWithMeta(),
          createTestCharacterWithMeta(),
        ],
        enemy: createTestEnemyWithMeta(),
      });

      const baseResistance =
        result.damageDetails[0].enemyDetails[EnemyStat.BASE_RESISTANCE];
      const electroEntry = baseResistance.find((s) =>
        s.tags.includes(Attribute.ELECTRO),
      );
      expect(electroEntry?.label).toBe('electro-res');
    });

    it('strips meta values that do not pass tag filtering but keeps those that do', () => {
      const team: Team<TestMeta> = [
        {
          ...createTestCharacterWithMeta(),
          stats: {
            ...createTestCharacterWithMeta().stats,
            [CharacterStat.DAMAGE_BONUS]: [
              { tags: [Tag.ELECTRO], value: 0.3, label: 'electro-bonus' },
              { tags: [Tag.GLACIO], value: 0.3, label: 'glacio-bonus' },
            ],
          },
        },
        createTestCharacterWithMeta(),
        createTestCharacterWithMeta(),
      ];

      const result = calculateRotationDamage<TestMeta>({
        ...baseRotation,
        team,
        enemy: createTestEnemyWithMeta(),
      });

      // Attack has [BASIC_ATTACK, ELECTRO] tags → only ELECTRO damage bonus passes filter
      const damageBonusStats =
        result.damageDetails[0].teamDetails[0][CharacterStat.DAMAGE_BONUS];
      expect(damageBonusStats.map((s) => s.label)).toContain('electro-bonus');
      expect(damageBonusStats.map((s) => s.label)).not.toContain('glacio-bonus');
    });
  });

  describe('flat scaling strategy', () => {
    it('returns motion value total without regular damage formula multipliers', () => {
      const team: Team = [
        createTestCharacter(1),
        createTestCharacter(2),
        createTestCharacter(3),
      ];
      const enemy = createTestEnemy();

      const largeOffensiveModifier: Modifier = {
        targets: [0],
        modifiedStats: {
          [CharacterStat.ATTACK_FLAT]: [{ tags: [Tag.ALL], value: 9999 }],
          [CharacterStat.DAMAGE_BONUS]: [{ tags: [Tag.ELECTRO], value: 5 }],
          [CharacterStat.DAMAGE_AMPLIFICATION]: [{ tags: [Tag.ELECTRO], value: 5 }],
          [CharacterStat.CRITICAL_DAMAGE]: [{ tags: [Tag.ALL], value: 10 }],
        },
      };

      const rotation: Rotation = {
        team,
        enemy,
        duration: 10,
        attacks: [
          {
            attack: {
              characterIndex: 0,
              damageInstances: [
                {
                  scalingStat: AttackScalingProperty.FIXED,
                  motionValue: 123.4,
                  tags: [Tag.ELECTRO, Tag.BASIC_ATTACK],
                },
                {
                  scalingStat: AttackScalingProperty.FIXED,
                  motionValue: 76.6,
                  tags: [Tag.ELECTRO, Tag.BASIC_ATTACK],
                },
              ],
            },
            modifiers: [largeOffensiveModifier],
          },
        ],
      };

      const result = calculateRotationDamage(rotation);

      expect(result.totalDamage).toBeCloseTo(200, 10);
      expect(
        result.damageDetails[0].damage + result.damageDetails[1].damage,
      ).toBeCloseTo(200, 10);
      expect(result.damageDetails[0].baseDamage).toBeCloseTo(123.4, 10);
      expect(result.damageDetails[1].baseDamage).toBeCloseTo(76.6, 10);
    });
  });
});

import { describe, expect, it } from 'vitest';

import {
  AttackScalingProperty,
  Attribute,
  CharacterStat,
  EnemyStat,
  Tag,
} from '@/types';

import { calculateRotationDamage } from './calculate-rotation-damage';
import type { Attack, Character, Enemy, Modifier, Rotation, Stat, Team } from './types';

type TestMeta = { label: string };

const createStat = <TMeta extends object = {}>(
  stat: CharacterStat | EnemyStat,
  value: number | Stat<TMeta>['value'],
  tags: Array<string>,
  meta?: TMeta,
): Stat<TMeta> => ({
  stat,
  value,
  tags,
  ...(meta ?? ({} as TMeta)),
});

const createTestCharacter = (
  stats: Array<Stat> = [],
  overrides: Partial<Character> = {},
): Character => ({
  level: 90,
  stats: [
    createStat(CharacterStat.ATTACK_FLAT, 1000, [Tag.ALL]),
    createStat(CharacterStat.CRITICAL_RATE, 0.5, [Tag.ALL]),
    createStat(CharacterStat.CRITICAL_DAMAGE, 1, [Tag.ALL]),
    createStat(CharacterStat.ENERGY_REGEN, 1, [Tag.ALL]),
    ...stats,
  ],
  ...overrides,
});

const createTestEnemy = (stats: Array<Stat> = []): Enemy => ({
  level: 90,
  stats: [
    createStat(EnemyStat.BASE_RESISTANCE, 0.1, [Attribute.GLACIO]),
    createStat(EnemyStat.BASE_RESISTANCE, 0.1, [Attribute.FUSION]),
    createStat(EnemyStat.BASE_RESISTANCE, 0.1, [Attribute.AERO]),
    createStat(EnemyStat.BASE_RESISTANCE, 0.1, [Attribute.ELECTRO]),
    createStat(EnemyStat.BASE_RESISTANCE, 0.1, [Attribute.HAVOC]),
    createStat(EnemyStat.BASE_RESISTANCE, 0.1, [Attribute.SPECTRO]),
    createStat(EnemyStat.BASE_RESISTANCE, 0.1, [Attribute.PHYSICAL]),
    ...stats,
  ],
});

const createTestCharacterWithMeta = (
  attackFlatLabel = 'base-atk',
): Character<TestMeta> => ({
  level: 90,
  stats: [
    createStat(CharacterStat.ATTACK_FLAT, 1000, [Tag.ALL], { label: attackFlatLabel }),
    createStat(CharacterStat.CRITICAL_RATE, 0.5, [Tag.ALL], {
      label: 'crit-rate',
    }),
    createStat(CharacterStat.CRITICAL_DAMAGE, 1, [Tag.ALL], {
      label: 'crit-dmg',
    }),
    createStat(CharacterStat.ENERGY_REGEN, 1, [Tag.ALL], {
      label: 'energy-regen',
    }),
  ],
});

const createTestEnemyWithMeta = (): Enemy<TestMeta> => ({
  level: 90,
  stats: [
    createStat(EnemyStat.BASE_RESISTANCE, 0.1, [Attribute.ELECTRO], {
      label: 'electro-res',
    }),
    createStat(EnemyStat.BASE_RESISTANCE, 0.1, [Attribute.GLACIO], {
      label: 'glacio-res',
    }),
  ],
});

const createTestAttack = (overrides: Partial<Attack> = {}): Attack => ({
  characterIndex: 0,
  scalingStat: AttackScalingProperty.ATK,
  motionValue: 1,
  tags: [Tag.BASIC_ATTACK, Tag.ELECTRO],
  ...overrides,
});

describe('calculateRotationDamage', () => {
  describe('runtime-resolvable modifiers', () => {
    it('accounts for other modifiers when resolving runtime-resolvable stats', () => {
      const team: Team = [
        createTestCharacter([createStat(CharacterStat.CRITICAL_RATE, 1, [Tag.ALL])]),
        createTestCharacter(),
        createTestCharacter(),
      ];
      const enemy = createTestEnemy();

      const critRateModifier: Modifier = {
        stat: CharacterStat.CRITICAL_RATE,
        value: 0.8,
        tags: [Tag.ALL],
        targets: [0],
      };
      const critDamageModifier: Modifier = {
        stat: CharacterStat.CRITICAL_DAMAGE,
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
        tags: [Tag.ALL],
        targets: [0],
      };

      const rotation: Rotation = {
        team,
        enemy,
        duration: 10,
        attacks: [
          {
            attack: createTestAttack(),
            modifiers: [critRateModifier, critDamageModifier],
          },
        ],
      };

      const result = calculateRotationDamage(rotation);

      expect(result.damageDetails[0].character.criticalDamage).toBe(1.5);
    });
  });

  describe('metadata (T) passthrough', () => {
    const baseRotation = {
      duration: 10,
      attacks: [
        {
          attack: createTestAttack(),
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
        stat: CharacterStat.DAMAGE_BONUS,
        value: 0.5,
        tags: [Tag.ELECTRO],
        label: 'crown-of-wills',
        targets: [0],
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
      const electroEntry = baseResistance.find((entry) =>
        entry.tags.includes(Attribute.ELECTRO),
      );
      expect(electroEntry?.label).toBe('electro-res');
    });

    it('strips meta values that do not pass tag filtering but keeps those that do', () => {
      const team: Team<TestMeta> = [
        {
          ...createTestCharacterWithMeta(),
          stats: [
            ...createTestCharacterWithMeta().stats,
            createStat(CharacterStat.DAMAGE_BONUS, 0.3, [Tag.ELECTRO], {
              label: 'electro-bonus',
            }),
            createStat(CharacterStat.DAMAGE_BONUS, 0.3, [Tag.GLACIO], {
              label: 'glacio-bonus',
            }),
          ],
        },
        createTestCharacterWithMeta(),
        createTestCharacterWithMeta(),
      ];

      const result = calculateRotationDamage<TestMeta>({
        ...baseRotation,
        team,
        enemy: createTestEnemyWithMeta(),
      });

      const damageBonusStats =
        result.damageDetails[0].teamDetails[0][CharacterStat.DAMAGE_BONUS];
      expect(damageBonusStats.map((entry) => entry.label)).toContain('electro-bonus');
      expect(damageBonusStats.map((entry) => entry.label)).not.toContain(
        'glacio-bonus',
      );
    });
  });

  describe('fixed scaling strategy', () => {
    it('returns motion value total without regular damage formula multipliers', () => {
      const team: Team = [
        createTestCharacter(),
        createTestCharacter(),
        createTestCharacter(),
      ];
      const enemy = createTestEnemy();

      const modifiers: Array<Modifier> = [
        {
          stat: CharacterStat.ATTACK_FLAT,
          value: 9999,
          tags: [Tag.ALL],
          targets: [0],
        },
        {
          stat: CharacterStat.DAMAGE_BONUS,
          value: 5,
          tags: [Tag.ELECTRO],
          targets: [0],
        },
        {
          stat: CharacterStat.DAMAGE_AMPLIFICATION,
          value: 5,
          tags: [Tag.ELECTRO],
          targets: [0],
        },
        {
          stat: CharacterStat.CRITICAL_DAMAGE,
          value: 10,
          tags: [Tag.ALL],
          targets: [0],
        },
      ];

      const rotation: Rotation = {
        team,
        enemy,
        duration: 10,
        attacks: [
          {
            attack: createTestAttack({
              scalingStat: AttackScalingProperty.FIXED,
              motionValue: 123.4,
            }),
            modifiers,
          },
          {
            attack: createTestAttack({
              scalingStat: AttackScalingProperty.FIXED,
              motionValue: 76.6,
            }),
            modifiers,
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

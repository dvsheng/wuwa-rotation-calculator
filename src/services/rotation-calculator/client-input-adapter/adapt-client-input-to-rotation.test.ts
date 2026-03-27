import { describe, expect, it } from 'vitest';

import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';
import { CapabilityType } from '@/services/game-data';
import type {
  Attack,
  Modifier as GameDataModifier,
  PermanentStat,
} from '@/services/game-data';
import {
  AttackScalingProperty,
  Attribute,
  CharacterStat,
  DamageType,
  Tag,
} from '@/types';

import {
  normalizeEchoSubstatValue,
  toRotationAttacks,
  toRotationModifier,
  toRotationPermanentStat,
} from './adapt-client-input-to-rotation';
import type { ResolveUserParameterizedType } from './resolve-user-parameterized-values';

type GameDataStatReference = {
  type: 'statParameterizedNumber';
  stat: typeof CharacterStat.ENERGY_REGEN;
  resolveWith: 'self';
};

const statReference = (): GameDataStatReference => ({
  type: 'statParameterizedNumber',
  stat: CharacterStat.ENERGY_REGEN,
  resolveWith: 'self',
});

const createMockModifier = (
  id: number,
  characterId: number,
  target: 'self' | 'team' | 'activeCharacter' | 'enemy',
  statList: Array<{
    stat: CharacterStat;
    value: number | GameDataStatReference;
    tags: Array<string>;
  }>,
): ModifierInstance & ResolveUserParameterizedType<GameDataModifier> =>
  ({
    instanceId: `modifier-${id}`,
    id,
    characterId,
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    name: `Modifier ${id}`,
    description: 'Test modifier description',
    originType: 'Echo',
    parentName: 'Test Skill',
    skillId: 1,
    entityId: 1,
    capabilityJson: {
      type: CapabilityType.MODIFIER,
      modifiedStats: statList.map((stat) => ({ ...stat, target })),
    },
  }) as any;

const createMockAttack = (
  id: number,
  characterId: number,
): AttackInstance & ResolveUserParameterizedType<Attack> =>
  ({
    instanceId: `attack-${id}`,
    id,
    characterId,
    name: `Attack ${id}`,
    description: 'Test attack description',
    originType: 'Echo',
    parentName: 'Test Skill',
    skillId: 1,
    entityId: 1,
    capabilityJson: {
      type: CapabilityType.ATTACK,
      damageInstances: [
        {
          motionValue: 1,
          tags: [Tag.BASIC_ATTACK],
          damageType: DamageType.BASIC_ATTACK,
          attribute: Attribute.ELECTRO,
          scalingStat: AttackScalingProperty.ATK,
        },
      ],
    },
  }) as any;

const createMockPermanentStat = (
  value: unknown,
  stat: CharacterStat = CharacterStat.ATTACK_FLAT,
  tags: Array<string> = [Tag.ALL],
): ResolveUserParameterizedType<PermanentStat> =>
  ({
    id: 1,
    name: 'Test Stat',
    description: undefined,
    originType: 'Base Stats',
    skillId: 1,
    entityId: 1,
    capabilityJson: {
      type: CapabilityType.PERMANENT_STAT,
      stat,
      tags,
      value,
    },
  }) as any;

const characterIdToSlotNumberMap = {
  32_132: 0,
  1234: 1,
  5678: 2,
} as Record<number, 0 | 1 | 2>;

describe('toRotationPermanentStat', () => {
  it('maps literal number values unchanged', () => {
    const stat = createMockPermanentStat(500);

    const result = toRotationPermanentStat(stat as any, 0);

    expect(result.stat).toBe(CharacterStat.ATTACK_FLAT);
    expect(result.tags).toEqual([Tag.ALL]);
    expect(result.value).toBe(500);
    expect(result.name).toBe(stat.name);
    expect(result.description).toBe('');
  });

  it('maps self stat references to the provided character index', () => {
    const stat = createMockPermanentStat(statReference(), CharacterStat.DAMAGE_BONUS, [
      Tag.ELECTRO,
    ]);

    const result = toRotationPermanentStat(stat as any, 2);

    expect(typeof result.value).toBe('object');
    if (typeof result.value === 'number') {
      throw new TypeError('expected statParameterizedNumber');
    }
    expect(result.value.type).toBe('statParameterizedNumber');
    if (result.value.type !== 'statParameterizedNumber') {
      throw new TypeError('expected statParameterizedNumber');
    }
    expect(result.value.stat).toBe(CharacterStat.ENERGY_REGEN);
    expect(result.value.characterIndex).toBe(2);
  });

  it('recursively maps nested stat references while preserving tree shape', () => {
    const stat = createMockPermanentStat(
      {
        type: 'sum',
        operands: [
          0.5,
          {
            type: 'product',
            operands: [
              statReference(),
              {
                type: 'sum',
                operands: [
                  1.5,
                  {
                    type: 'statParameterizedNumber',
                    stat: CharacterStat.ENERGY_REGEN,
                    resolveWith: 'enemy',
                  },
                ],
              },
            ],
          },
        ],
      } as const,
      CharacterStat.DAMAGE_BONUS,
      [Tag.ELECTRO],
    );

    const result = toRotationPermanentStat(stat as any, 2);

    expect(typeof result.value).toBe('object');
    if (typeof result.value === 'number') {
      throw new TypeError('expected sum node');
    }
    expect(result.value.type).toBe('sum');
    if (result.value.type !== 'sum') {
      throw new TypeError('expected sum node');
    }

    const nestedProduct = result.value.operands[1];
    expect(typeof nestedProduct).toBe('object');
    if (typeof nestedProduct === 'number' || nestedProduct.type !== 'product') {
      throw new TypeError('expected product node');
    }

    const selfReference = nestedProduct.operands[0];
    expect(typeof selfReference).toBe('object');
    if (
      typeof selfReference === 'number' ||
      selfReference.type !== 'statParameterizedNumber'
    ) {
      throw new TypeError('expected statParameterizedNumber');
    }
    expect(selfReference.characterIndex).toBe(2);

    const enemySum = nestedProduct.operands[1];
    expect(typeof enemySum).toBe('object');
    if (typeof enemySum === 'number' || enemySum.type !== 'sum') {
      throw new TypeError('expected sum node');
    }

    expect(typeof enemySum.operands[1]).toBe('object');
    if (
      typeof enemySum.operands[1] === 'number' ||
      enemySum.operands[1].type !== 'statParameterizedNumber'
    ) {
      throw new TypeError('expected statParameterizedNumber');
    }
    expect(enemySum.operands[1].characterIndex).toBeUndefined();
  });
});

describe('toRotationModifier', () => {
  it('maps self target modifiers to the source character slot', () => {
    const modifier = createMockModifier(45_667, 32_132, 'self', [
      {
        stat: CharacterStat.DAMAGE_BONUS,
        value: statReference(),
        tags: [Tag.ELECTRO],
      },
    ]);

    const [result] = toRotationModifier(
      modifier as any,
      32_132,
      characterIdToSlotNumberMap,
    );

    expect(result.targets).toEqual([0]);
    expect(result.stat).toBe(CharacterStat.DAMAGE_BONUS);
    expect(result.tags).toEqual([Tag.ELECTRO]);
    expect(result.name).toBe(modifier.name);
    expect(result.description).toBe(modifier.description);
    expect(typeof result.value).toBe('object');
    if (typeof result.value === 'number') {
      throw new TypeError('expected statParameterizedNumber');
    }
    expect(result.value.type).toBe('statParameterizedNumber');
    if (result.value.type !== 'statParameterizedNumber') {
      throw new TypeError('expected statParameterizedNumber');
    }
    expect(result.value.stat).toBe(CharacterStat.ENERGY_REGEN);
    expect(result.value.characterIndex).toBe(0);
  });

  it('maps self target modifiers to other source slots correctly', () => {
    const modifier = createMockModifier(45_667, 1234, 'self', [
      {
        stat: CharacterStat.DAMAGE_BONUS,
        value: statReference(),
        tags: [Tag.GLACIO],
      },
    ]);

    const [result] = toRotationModifier(
      modifier as any,
      1234,
      characterIdToSlotNumberMap,
    );

    expect(result.targets).toEqual([1]);
    if (typeof result.value === 'number') {
      throw new TypeError('expected statParameterizedNumber');
    }
    if (result.value.type !== 'statParameterizedNumber') {
      throw new TypeError('expected statParameterizedNumber');
    }
    expect(result.value.characterIndex).toBe(1);
  });

  it('maps team target modifiers to all character slots', () => {
    const modifier = createMockModifier(45_667, 32_132, 'team', [
      {
        stat: CharacterStat.DAMAGE_AMPLIFICATION,
        value: 0.15,
        tags: [Tag.ALL],
      },
    ]);

    const [result] = toRotationModifier(
      modifier as any,
      32_132,
      characterIdToSlotNumberMap,
    );

    expect(result.targets).toEqual([0, 1, 2]);
    expect(result.stat).toBe(CharacterStat.DAMAGE_AMPLIFICATION);
  });

  it('maps activeCharacter target modifiers to the attacking character slot', () => {
    const modifier = createMockModifier(45_667, 32_132, 'activeCharacter', [
      {
        stat: CharacterStat.DAMAGE_BONUS,
        value: 0.25,
        tags: [Tag.RESONANCE_SKILL],
      },
    ]);

    const [result] = toRotationModifier(
      modifier as any,
      1234,
      characterIdToSlotNumberMap,
    );

    expect(result.targets).toEqual([1]);
  });

  it('maps enemy target modifiers to enemy', () => {
    const modifier = createMockModifier(45_667, 32_132, 'enemy', [
      {
        stat: CharacterStat.DAMAGE_BONUS,
        value: 0.1,
        tags: [Tag.ALL],
      },
    ]);

    const [result] = toRotationModifier(
      modifier as any,
      32_132,
      characterIdToSlotNumberMap,
    );

    expect(result.targets).toEqual(['enemy']);
  });

  it('handles multiple stats while only remapping statParameterizedNumber values', () => {
    const modifier = createMockModifier(45_667, 1234, 'self', [
      {
        stat: CharacterStat.DAMAGE_BONUS,
        value: statReference(),
        tags: [Tag.ELECTRO],
      },
      {
        stat: CharacterStat.CRITICAL_RATE,
        value: 0.05,
        tags: [Tag.ALL],
      },
    ]);

    const result = toRotationModifier(
      modifier as any,
      1234,
      characterIdToSlotNumberMap,
    );

    expect(result).toHaveLength(2);
    expect(result.map((entry) => entry.targets)).toEqual([[1], [1]]);

    const damageBonus = result.find(
      (entry) => entry.stat === CharacterStat.DAMAGE_BONUS,
    );
    expect(damageBonus).toBeDefined();
    if (!damageBonus || typeof damageBonus.value === 'number') {
      throw new TypeError('expected statParameterizedNumber');
    }
    if (damageBonus.value.type !== 'statParameterizedNumber') {
      throw new TypeError('expected statParameterizedNumber');
    }
    expect(damageBonus.value.characterIndex).toBe(1);

    const critRate = result.find((entry) => entry.stat === CharacterStat.CRITICAL_RATE);
    expect(critRate?.value).toBe(0.05);
  });
});

describe('toRotationAttacks', () => {
  it('appends attack metadata tags used by stat filtering', () => {
    const attack = createMockAttack(15_678, 32_132);

    const result = toRotationAttacks(
      { ...attack, modifiers: [] } as any,
      characterIdToSlotNumberMap,
      4,
    );

    expect(result).toHaveLength(1);
    expect(result[0].characterIndex).toBe(0);
    expect(result[0].attackIndex).toBe(4);
    expect(result[0].tags).toEqual(
      expect.arrayContaining([
        Tag.BASIC_ATTACK,
        'Attack 15678',
        Attribute.ELECTRO,
        DamageType.BASIC_ATTACK,
      ]),
    );
  });
});

describe('normalizeEchoSubstatValue', () => {
  it('preserves flat echo substats as whole numbers', () => {
    expect(normalizeEchoSubstatValue('atk_flat', 50)).toBe(50);
  });

  it('converts crit damage substats from percent values to decimals', () => {
    expect(normalizeEchoSubstatValue('crit_dmg', 15)).toBe(0.15);
  });

  it('converts energy regen substats from percent values to decimals', () => {
    expect(normalizeEchoSubstatValue('energy_regen', 10)).toBe(0.1);
  });
});

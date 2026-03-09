import { describe, expect, it } from 'vitest';

import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';
import type {
  Attack,
  Modifier as GameDataModifier,
  GameDataNumberNode,
} from '@/services/game-data';
import { CapabilityType } from '@/services/game-data';
import {
  AttackScalingProperty,
  Attribute,
  CharacterStat,
  DamageType,
  Tag,
} from '@/types';

import {
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
): ModifierInstance & ResolveUserParameterizedType<GameDataModifier> => ({
  instanceId: `modifier-${id}`,
  id,
  characterId,
  x: 0,
  y: 0,
  w: 1,
  h: 1,
  description: 'Test modifier description',
  modifiedStats: statList.map((s) => ({ ...s, target })),
  name: `Modifier ${id}`,
  originType: 'Echo',
  capabilityType: CapabilityType.MODIFIER,
});

const createMockAttack = (
  id: number,
  characterId: number,
): AttackInstance & ResolveUserParameterizedType<Attack> => ({
  instanceId: `attack-${id}`,
  id,
  characterId,
  description: 'Test attack description',
  damageInstances: [
    {
      motionValue: 1,
      tags: [Tag.BASIC_ATTACK],
      damageType: DamageType.BASIC_ATTACK,
      attribute: Attribute.PHYSICAL,
      scalingStat: AttackScalingProperty.ATK,
    },
  ],
  name: `Attack ${id}`,
  originType: 'Echo',
  capabilityType: CapabilityType.ATTACK,
});

const characterIdToSlotNumberMap = {
  32_132: 0,
  1234: 1,
  5678: 2,
} as Record<number, 0 | 1 | 2>;

const permanentStatBase = {
  id: 1,
  name: 'Test Stat',
  originType: 'Base Stats' as const,
  capabilityType: CapabilityType.PERMANENT_STAT,
};

describe('toRotationPermanentStat', () => {
  it('maps literal number values unchanged', () => {
    const stat = {
      ...permanentStatBase,
      stat: CharacterStat.ATTACK_FLAT,
      tags: [Tag.ALL],
      value: 500,
    };

    const result = toRotationPermanentStat(stat, 0);

    expect(result.stat).toBe(stat.stat);
    expect(result.tags).toEqual(stat.tags);
    expect(result.value).toBe(stat.value);
    expect(result.name).toBe(stat.name);
    expect(result.description).toBe('');
  });

  it('maps self stat references to the provided character index', () => {
    const stat = {
      ...permanentStatBase,
      stat: CharacterStat.DAMAGE_BONUS,
      tags: [Tag.ELECTRO],
      value: statReference(),
    };

    const result = toRotationPermanentStat(stat, 2);

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
    const stat = {
      ...permanentStatBase,
      stat: CharacterStat.DAMAGE_BONUS,
      tags: [Tag.ELECTRO],
      value: {
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
      } satisfies GameDataNumberNode<number>,
    };

    const result = toRotationPermanentStat(stat, 2);

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
    const attack = createMockAttack(15_678, 32_132);

    const [result] = toRotationModifier(modifier, attack, characterIdToSlotNumberMap);

    expect(result.targets).toEqual([0]);
    const damageBonus = result.modifiedStats[CharacterStat.DAMAGE_BONUS]![0];
    expect(typeof damageBonus.value).toBe('object');
    if (typeof damageBonus.value === 'number') {
      throw new TypeError('expected statParameterizedNumber');
    }
    expect(damageBonus.value.type).toBe('statParameterizedNumber');
    if (damageBonus.value.type !== 'statParameterizedNumber') {
      throw new TypeError('expected statParameterizedNumber');
    }
    expect(damageBonus.value.stat).toBe(CharacterStat.ENERGY_REGEN);
    expect(damageBonus.value.characterIndex).toBe(0);
  });

  it('maps self target modifiers to other source slots correctly', () => {
    const modifier = createMockModifier(45_667, 1234, 'self', [
      {
        stat: CharacterStat.DAMAGE_BONUS,
        value: statReference(),
        tags: [Tag.GLACIO],
      },
    ]);
    const attack = createMockAttack(15_678, 1234);

    const [result] = toRotationModifier(modifier, attack, characterIdToSlotNumberMap);

    expect(result.targets).toEqual([1]);
    const damageBonus = result.modifiedStats[CharacterStat.DAMAGE_BONUS]![0];
    if (typeof damageBonus.value === 'number') {
      throw new TypeError('expected statParameterizedNumber');
    }
    if (damageBonus.value.type !== 'statParameterizedNumber') {
      throw new TypeError('expected statParameterizedNumber');
    }
    expect(damageBonus.value.characterIndex).toBe(1);
  });

  it('maps team target modifiers to all character slots', () => {
    const modifier = createMockModifier(45_667, 32_132, 'team', [
      {
        stat: CharacterStat.DAMAGE_AMPLIFICATION,
        value: 0.15,
        tags: [Tag.ALL],
      },
    ]);
    const attack = createMockAttack(15_678, 32_132);

    const [result] = toRotationModifier(modifier, attack, characterIdToSlotNumberMap);

    expect(result.targets).toEqual([0, 1, 2]);
    expect(result.modifiedStats[CharacterStat.DAMAGE_AMPLIFICATION]).toBeDefined();
  });

  it('maps activeCharacter target modifiers to the attacking character slot', () => {
    const modifier = createMockModifier(45_667, 32_132, 'activeCharacter', [
      {
        stat: CharacterStat.DAMAGE_BONUS,
        value: 0.25,
        tags: [Tag.RESONANCE_SKILL],
      },
    ]);
    const attack = createMockAttack(15_678, 1234);

    const [result] = toRotationModifier(modifier, attack, characterIdToSlotNumberMap);

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
    const attack = createMockAttack(15_678, 32_132);

    const [result] = toRotationModifier(modifier, attack, characterIdToSlotNumberMap);

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
    const attack = createMockAttack(15_678, 1234);

    const [result] = toRotationModifier(modifier, attack, characterIdToSlotNumberMap);

    expect(result.targets).toEqual([1]);

    const damageBonus = result.modifiedStats[CharacterStat.DAMAGE_BONUS]![0];
    if (typeof damageBonus.value === 'number') {
      throw new TypeError('expected statParameterizedNumber');
    }
    if (damageBonus.value.type !== 'statParameterizedNumber') {
      throw new TypeError('expected statParameterizedNumber');
    }
    expect(damageBonus.value.characterIndex).toBe(1);

    const critRate = result.modifiedStats[CharacterStat.CRITICAL_RATE]![0];
    expect(critRate.value).toBe(0.05);
  });
});

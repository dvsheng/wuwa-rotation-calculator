import { describe, expect, it } from 'vitest';

import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';
import type {
  Attack,
  Modifier as GameDataModifier,
  GameDataRotationRuntimeResolvableNumber,
} from '@/services/game-data';
import { AbilityAttribute, Attribute, CharacterStat, Tag } from '@/types';
import type { CharacterSlotNumber } from '@/types';

import {
  toRotationModifier,
  toRotationPermanentStat,
} from './adapt-client-input-to-rotation';
import type { ResolveUserParameterizedType } from './resolve-user-parameterized-values';

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

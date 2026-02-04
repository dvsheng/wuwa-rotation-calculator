import { intersection } from 'es-toolkit/array';
import { mapValues } from 'es-toolkit/object';

import { AbilityAttribute, Tag } from '@/types';
import type { CharacterStats, EnemyStats, TaggedStatValue } from '@/types';

export const isAbilityAttribute = (key: string): key is AbilityAttribute => {
  return Object.values(AbilityAttribute).includes(key as AbilityAttribute);
};

export const calculateStatTotal = (
  flat: number,
  scalingBonus: number,
  flatBonus: number,
) => {
  return flat * (1 + scalingBonus) + flatBonus;
};

export const getCalculateStatValueFunction =
  (tags: Array<string>) => (statValues: Array<TaggedStatValue> | undefined) => {
    if (!statValues) return 0;
    return statValues.reduce((sum, statValue) => {
      const isApplicable =
        statValue.tags.includes(Tag.ALL) ||
        intersection(statValue.tags, tags).length > 0;
      if (!isApplicable) return sum;
      const value = typeof statValue.value === 'number' ? statValue.value : 0;
      return sum + value;
    }, 0);
  };

export const getCalculateAbilityAttributeValueFunction =
  (tags: Array<string>) => (stats: CharacterStats, attribute: AbilityAttribute) => {
    const resolveStatValue = getCalculateStatValueFunction(tags);
    switch (attribute) {
      case AbilityAttribute.ATK: {
        return calculateStatTotal(
          resolveStatValue(stats.attackFlat),
          resolveStatValue(stats.attackScalingBonus),
          resolveStatValue(stats.attackFlatBonus),
        );
      }
      case AbilityAttribute.DEF: {
        return calculateStatTotal(
          resolveStatValue(stats.defenseFlat),
          resolveStatValue(stats.defenseScalingBonus),
          resolveStatValue(stats.defenseFlatBonus),
        );
      }
      case AbilityAttribute.HP: {
        return calculateStatTotal(
          resolveStatValue(stats.hpFlat),
          resolveStatValue(stats.hpScalingBonus),
          resolveStatValue(stats.hpFlatBonus),
        );
      }
    }
  };

export const getCalculateCharacterStatsForTag =
  (tags: Array<string>) =>
  (stats: CharacterStats): Record<keyof CharacterStats | AbilityAttribute, number> => {
    const resolveStatValue = getCalculateStatValueFunction(tags);
    const resolveAbilityAttribute = getCalculateAbilityAttributeValueFunction(tags);
    const baseStats = mapValues(stats, (statValues) => resolveStatValue(statValues));
    const abilityAttributes = Object.fromEntries(
      Object.values(AbilityAttribute).map((attribute) => [
        attribute,
        resolveAbilityAttribute(stats, attribute),
      ]),
    ) as Record<AbilityAttribute, number>;
    return {
      ...baseStats,
      ...abilityAttributes,
    };
  };

export const getCalculateEnemyStatsForTag =
  (tags: Array<string>) =>
  (stats: EnemyStats): Record<keyof EnemyStats, number> => {
    const resolveStatValue = getCalculateStatValueFunction(tags);
    return mapValues(stats, (statValues) => resolveStatValue(statValues));
  };

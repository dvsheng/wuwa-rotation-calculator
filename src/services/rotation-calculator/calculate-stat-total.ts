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

export const getCalculateStatValueFn =
  (tags: Array<string>) => (statValues: Array<TaggedStatValue> | undefined) => {
    if (!statValues) return 0;
    // 1. Convert target tags to a Set once for O(1) lookups
    const tagSet = new Set(tags);
    return statValues.reduce((sum, statValue) => {
      // 2. Check if statValue has Tag.ALL OR any overlapping tag
      const isApplicable =
        statValue.tags.includes(Tag.ALL) ||
        statValue.tags.some((tag) => tagSet.has(tag));

      if (!isApplicable) return sum;

      // 3. Sum only the numeric values
      const value = typeof statValue.value === 'number' ? statValue.value : 0;
      return sum + value;
    }, 0);
  };

export const getCalculateAbilityAttributeValueFn =
  (tags: Array<string>) => (stats: CharacterStats, attribute: AbilityAttribute) => {
    const resolveStatValue = getCalculateStatValueFn(tags);
    switch (attribute) {
      case AbilityAttribute.ATK:
        return calculateStatTotal(
          resolveStatValue(stats.attackFlat),
          resolveStatValue(stats.attackScalingBonus),
          resolveStatValue(stats.attackFlatBonus),
        );
      case AbilityAttribute.DEF:
        return calculateStatTotal(
          resolveStatValue(stats.defenseFlat),
          resolveStatValue(stats.defenseScalingBonus),
          resolveStatValue(stats.defenseFlatBonus),
        );
      case AbilityAttribute.HP:
        return calculateStatTotal(
          resolveStatValue(stats.hpFlat),
          resolveStatValue(stats.hpScalingBonus),
          resolveStatValue(stats.hpFlatBonus),
        );
    }
  };

export const getCalculateCharacterStatsForTag =
  (tags: Array<string>) =>
  (stats: CharacterStats): Record<keyof CharacterStats | AbilityAttribute, number> => {
    const resolveStatValue = getCalculateStatValueFn(tags);
    const resolveAbilityAttribute = getCalculateAbilityAttributeValueFn(tags);

    // 1. Resolve all base character stats (the raw arrays)
    const baseStats = Object.fromEntries(
      Object.entries(stats).map(([key, statValues]) => [
        key,
        resolveStatValue(statValues),
      ]),
    ) as Record<keyof CharacterStats, number>;
    const abilityAttributes = Object.fromEntries(
      Object.values(AbilityAttribute).map((attr) => [
        attr,
        resolveAbilityAttribute(stats, attr),
      ]),
    ) as Record<AbilityAttribute, number>;

    // 3. Merge them into a single record
    return {
      ...baseStats,
      ...abilityAttributes,
    };
  };

export const getCalculateEnemyStatsForTag =
  (tags: Array<string>) =>
  (stats: EnemyStats): Record<keyof EnemyStats, number> => {
    const resolveStatValue = getCalculateStatValueFn(tags);
    return Object.fromEntries(
      Object.entries(stats).map(([key, statValues]) => [
        key,
        resolveStatValue(statValues),
      ]),
    ) as Record<keyof EnemyStats, number>;
  };

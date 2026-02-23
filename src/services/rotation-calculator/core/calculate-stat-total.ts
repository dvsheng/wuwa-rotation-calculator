import { sumBy } from 'es-toolkit/math';

import { AbilityAttribute } from '@/types';
import type { CharacterStats } from '@/types';

export const isAbilityAttribute = (key: string): key is AbilityAttribute => {
  return Object.values(AbilityAttribute).includes(key as AbilityAttribute);
};

const calculateAbilityAttributeTotal = (
  flat: number,
  scalingBonus: number,
  flatBonus: number,
) => {
  return flat * (1 + scalingBonus) + flatBonus;
};

export const sumStatValues = (statValues: Array<{ value: number }>) => {
  return sumBy(statValues, (statValue) => statValue.value);
};

export const calculateAbilityAttributeValue = (
  stats: CharacterStats<number>,
  attribute: AbilityAttribute,
) => {
  switch (attribute) {
    case AbilityAttribute.ATK: {
      return calculateAbilityAttributeTotal(
        sumStatValues(stats.attackFlat),
        sumStatValues(stats.attackScalingBonus),
        sumStatValues(stats.attackFlatBonus),
      );
    }
    case AbilityAttribute.DEF: {
      return calculateAbilityAttributeTotal(
        sumStatValues(stats.defenseFlat),
        sumStatValues(stats.defenseScalingBonus),
        sumStatValues(stats.defenseFlatBonus),
      );
    }
    case AbilityAttribute.HP: {
      return calculateAbilityAttributeTotal(
        sumStatValues(stats.hpFlat),
        sumStatValues(stats.hpScalingBonus),
        sumStatValues(stats.hpFlatBonus),
      );
    }
    default: {
      return 0;
    }
  }
};

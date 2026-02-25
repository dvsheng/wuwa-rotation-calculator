import { sumBy } from 'es-toolkit/math';

import { AttackScalingProperty } from '@/types';
import type { CharacterStats } from '@/types';

export const isAttackScalingProperty = (key: string): key is AttackScalingProperty => {
  return Object.values(AttackScalingProperty).includes(key as AttackScalingProperty);
};

const calculateAttackScalingPropertyTotal = (
  flat: number,
  scalingBonus: number,
  flatBonus: number,
) => {
  return flat * (1 + scalingBonus) + flatBonus;
};

export const sumStatValues = (statValues: Array<{ value: number }>) => {
  return sumBy(statValues, (statValue) => statValue.value);
};

export const calculateAttackScalingPropertyValue = (
  stats: CharacterStats<number>,
  attribute: AttackScalingProperty,
) => {
  switch (attribute) {
    case AttackScalingProperty.ATK: {
      return calculateAttackScalingPropertyTotal(
        sumStatValues(stats.attackFlat),
        sumStatValues(stats.attackScalingBonus),
        sumStatValues(stats.attackFlatBonus),
      );
    }
    case AttackScalingProperty.DEF: {
      return calculateAttackScalingPropertyTotal(
        sumStatValues(stats.defenseFlat),
        sumStatValues(stats.defenseScalingBonus),
        sumStatValues(stats.defenseFlatBonus),
      );
    }
    case AttackScalingProperty.HP: {
      return calculateAttackScalingPropertyTotal(
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

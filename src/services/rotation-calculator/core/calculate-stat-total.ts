import { sumBy } from 'es-toolkit/math';

import { AttackScalingProperty } from '@/types';
import type { CharacterStat } from '@/types';

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
  stats: Record<CharacterStat, number>,
  attribute: AttackScalingProperty,
) => {
  switch (attribute) {
    case AttackScalingProperty.ATK: {
      return calculateAttackScalingPropertyTotal(
        stats.attackFlat,
        stats.attackScalingBonus,
        stats.attackFlatBonus,
      );
    }
    case AttackScalingProperty.DEF: {
      return calculateAttackScalingPropertyTotal(
        stats.defenseFlat,
        stats.defenseScalingBonus,
        stats.defenseFlatBonus,
      );
    }
    case AttackScalingProperty.HP: {
      return calculateAttackScalingPropertyTotal(
        stats.hpFlat,
        stats.hpScalingBonus,
        stats.hpFlatBonus,
      );
    }
    default: {
      return 0;
    }
  }
};

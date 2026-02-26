import { AttackScalingProperty } from '@/types';

import { AttackScalingType } from './types';

export const getAttackScalingType = (
  property: AttackScalingProperty,
): AttackScalingType => {
  switch (property) {
    case AttackScalingProperty.ATK:
    case AttackScalingProperty.HP:
    case AttackScalingProperty.DEF: {
      return AttackScalingType.REGULAR;
    }
    case AttackScalingProperty.FIXED: {
      return AttackScalingType.FIXED;
    }
    default: {
      return AttackScalingType.NEGATIVE_STATUS;
    }
  }
};

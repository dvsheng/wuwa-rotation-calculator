import type { AttackScalingProperty } from '@/types';

import { AttackScalingType } from './types';

export const getAttackScalingType = (
  property: AttackScalingProperty,
): AttackScalingType => {
  switch (property) {
    case 'hp':
    case 'atk':
    case 'def': {
      return AttackScalingType.REGULAR;
    }
    case 'flat': {
      return AttackScalingType.FLAT;
    }
    default: {
      return AttackScalingType.NEGATIVE_STATUS;
    }
  }
};

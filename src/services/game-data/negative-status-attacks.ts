import type { Attribute } from '@/types';
import { Attribute as AttributeEnum, NegativeStatus } from '@/types';

import { OriginType } from './types';
import type { Attack } from './types';

export const NEGATIVE_STATUS_ATTACK_IDS = {
  [NegativeStatus.AERO_EROSION]: -101,
  [NegativeStatus.SPECTRO_FRAZZLE]: -102,
} as const;

const ATTRIBUTE_TO_NEGATIVE_STATUS_ATTACK: Partial<
  Record<Attribute, keyof typeof NEGATIVE_STATUS_ATTACK_IDS>
> = {
  [AttributeEnum.AERO]: NegativeStatus.AERO_EROSION,
  [AttributeEnum.SPECTRO]: NegativeStatus.SPECTRO_FRAZZLE,
};

const NEGATIVE_STATUS_ATTACK_LABELS = {
  [NegativeStatus.AERO_EROSION]: 'Aero Erosion',
  [NegativeStatus.SPECTRO_FRAZZLE]: 'Spectro Frazzle',
} as const;

export const createNegativeStatusAttacks = (attribute?: Attribute): Array<Attack> => {
  if (!attribute) return [];
  const negativeStatus = ATTRIBUTE_TO_NEGATIVE_STATUS_ATTACK[attribute];
  if (!negativeStatus) return [];

  return [
    {
      id: NEGATIVE_STATUS_ATTACK_IDS[negativeStatus],
      name: NEGATIVE_STATUS_ATTACK_LABELS[negativeStatus],
      description: `${NEGATIVE_STATUS_ATTACK_LABELS[negativeStatus]} damage instance`,
      originType: OriginType.INHERENT_SKILL,
      parentName: 'Negative Status',
      scalingStat: negativeStatus,
      attribute,
      motionValues: [0],
      tags: [negativeStatus, attribute],
    },
  ];
};

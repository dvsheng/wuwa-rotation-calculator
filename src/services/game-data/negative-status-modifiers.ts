import type {
  Attribute,
  EnemyStat,
  NegativeStatus as NegativeStatusType,
  UserParameterizedNumber,
} from '@/types';
import { Attribute as AttributeEnum, NegativeStatus, Tag } from '@/types';

import { OriginType, Target } from './types';
import type { Modifier } from './types';

export const SPECIAL_MODIFIER_CHARACTER_ID = -1;

export const NEGATIVE_STATUS_MODIFIER_IDS = {
  [NegativeStatus.FUSION_BURST]: -1,
  [NegativeStatus.GLACIO_CHAFE]: -2,
  [NegativeStatus.AERO_EROSION]: -3,
  [NegativeStatus.ELECTRO_FLARE]: -4,
  [NegativeStatus.SPECTRO_FRAZZLE]: -5,
  [NegativeStatus.HAVOC_BANE]: -6,
} as const satisfies Record<NegativeStatusType, number>;

export const NEGATIVE_STATUS_MODIFIER_ID_SET: ReadonlySet<number> = new Set(
  Object.values(NEGATIVE_STATUS_MODIFIER_IDS),
);

const NEGATIVE_STATUS_LABELS = {
  [NegativeStatus.FUSION_BURST]: 'Fusion Burst',
  [NegativeStatus.GLACIO_CHAFE]: 'Glacio Chafe',
  [NegativeStatus.AERO_EROSION]: 'Aero Erosion',
  [NegativeStatus.ELECTRO_FLARE]: 'Electro Flare',
  [NegativeStatus.SPECTRO_FRAZZLE]: 'Spectro Frazzle',
  [NegativeStatus.HAVOC_BANE]: 'Havoc Bane',
} as const;

const ATTRIBUTE_TO_NEGATIVE_STATUS: Partial<Record<Attribute, NegativeStatusType>> = {
  [AttributeEnum.FUSION]: NegativeStatus.FUSION_BURST,
  [AttributeEnum.GLACIO]: NegativeStatus.GLACIO_CHAFE,
  [AttributeEnum.AERO]: NegativeStatus.AERO_EROSION,
  [AttributeEnum.ELECTRO]: NegativeStatus.ELECTRO_FLARE,
  [AttributeEnum.SPECTRO]: NegativeStatus.SPECTRO_FRAZZLE,
  [AttributeEnum.HAVOC]: NegativeStatus.HAVOC_BANE,
};

const createNegativeStatusValue = (): UserParameterizedNumber => ({
  minimum: 0,
  maximum: 13,
  parameterConfigs: {
    '0': {
      scale: 1,
      minimum: 0,
      maximum: 13,
    },
  },
});

export const createNegativeStatusModifiers = (
  attribute?: Attribute,
): Array<Modifier> => {
  const status = attribute ? ATTRIBUTE_TO_NEGATIVE_STATUS[attribute] : undefined;
  if (!status) return [];

  const id = NEGATIVE_STATUS_MODIFIER_IDS[status];
  const label = NEGATIVE_STATUS_LABELS[status];

  return [
    {
      id,
      name: label,
      description: `Stacks of the ${label} negative status`,
      originType: OriginType.INHERENT_SKILL,
      parentName: 'Negative Status',
      target: Target.ENEMY,
      modifiedStats: [
        {
          stat: status as EnemyStat,
          tags: [Tag.ALL],
          value: createNegativeStatusValue(),
        },
      ],
    },
  ];
};

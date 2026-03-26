import { EchoMainStatOption } from '@/schemas/echo';
import type { EchoMainStatOptionType } from '@/schemas/echo';
import { AttackScalingProperty, Attribute } from '@/types';
import type {
  AttackScalingProperty as AttackScalingPropertyType,
  Attribute as AttributeType,
} from '@/types';

import {
  filterAndResolveCapabilities,
  listEntityCapabilities,
} from './list-entity-capabilities.function';
import { isAttack } from './types';
import type { Attack, CharacterDerivedAttributes } from './types';

const ATTRIBUTE_MAIN_STAT_BY_ATTRIBUTE: Partial<
  Record<AttributeType, EchoMainStatOptionType>
> = {
  [Attribute.AERO]: EchoMainStatOption.DAMAGE_BONUS_AERO,
  [Attribute.ELECTRO]: EchoMainStatOption.DAMAGE_BONUS_ELECTRO,
  [Attribute.FUSION]: EchoMainStatOption.DAMAGE_BONUS_FUSION,
  [Attribute.GLACIO]: EchoMainStatOption.DAMAGE_BONUS_GLACIO,
  [Attribute.HAVOC]: EchoMainStatOption.DAMAGE_BONUS_HAVOC,
  [Attribute.SPECTRO]: EchoMainStatOption.DAMAGE_BONUS_SPECTRO,
};

const normalizeScalingProperty = (
  property: AttackScalingPropertyType,
): CharacterDerivedAttributes['preferredScalingStat'] | undefined => {
  switch (property) {
    case AttackScalingProperty.ATK:
    case AttackScalingProperty.TUNE_RUPTURE_ATK: {
      return 'atk';
    }
    case AttackScalingProperty.DEF:
    case AttackScalingProperty.TUNE_RUPTURE_DEF: {
      return 'def';
    }
    case AttackScalingProperty.HP:
    case AttackScalingProperty.TUNE_RUPTURE_HP: {
      return 'hp';
    }
    default: {
      return undefined;
    }
  }
};

const getScalingMainStat = (
  scalingStat: CharacterDerivedAttributes['preferredScalingStat'],
): EchoMainStatOptionType => {
  switch (scalingStat) {
    case 'def': {
      return EchoMainStatOption.DEF_PERCENT;
    }
    case 'hp': {
      return EchoMainStatOption.HP_PERCENT;
    }
    default: {
      return EchoMainStatOption.ATK_PERCENT;
    }
  }
};

const addWeight = <TKey extends string>(
  weights: Map<TKey, number>,
  key: TKey,
  weight: number,
) => {
  weights.set(key, (weights.get(key) ?? 0) + weight);
};

export const deriveCharacterAttributes = (
  attacks: Array<Attack>,
): CharacterDerivedAttributes => {
  const scalingWeights = new Map<
    CharacterDerivedAttributes['preferredScalingStat'],
    number
  >();
  const attributeWeights = new Map<AttributeType, number>();

  for (const attack of attacks) {
    for (const instance of attack.capabilityJson.damageInstances) {
      const scalingStat = normalizeScalingProperty(instance.scalingStat);
      if (scalingStat) {
        addWeight(scalingWeights, scalingStat, 1);
      }
      if (instance.attribute in ATTRIBUTE_MAIN_STAT_BY_ATTRIBUTE) {
        addWeight(attributeWeights, instance.attribute, 1);
      }
    }
  }

  const hpWeight = scalingWeights.get('hp') ?? 0;
  const defenseWeight = scalingWeights.get('def') ?? 0;
  const atkWeight = scalingWeights.get('atk') ?? 0;

  const preferredScalingStat =
    hpWeight > 0 || defenseWeight > 0
      ? hpWeight >= defenseWeight
        ? 'hp'
        : 'def'
      : atkWeight > 0
        ? 'atk'
        : 'atk';

  const dominantAttribute = [...attributeWeights.entries()].toSorted(
    (left, right) => right[1] - left[1],
  )[0]?.[0];

  return {
    preferredScalingStat,
    dominantAttribute,
    preferredThreeCostScalingMainStat: getScalingMainStat(preferredScalingStat),
    preferredThreeCostAttributeMainStat:
      ATTRIBUTE_MAIN_STAT_BY_ATTRIBUTE[dominantAttribute],
  };
};

export const getDerivedCharacterAttributesById = async (id: number) => {
  const capabilities = filterAndResolveCapabilities(
    await listEntityCapabilities({
      data: {
        id,
      },
    }),
    { sequence: 0 },
  );
  const attacks = capabilities.filter((capability) => isAttack(capability));
  return deriveCharacterAttributes(attacks);
};

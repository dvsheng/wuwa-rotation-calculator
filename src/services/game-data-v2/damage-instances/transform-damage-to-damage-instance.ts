import { compact, minBy } from 'es-toolkit';

import {
  CalculateType,
  DAMAGE_INSTANCE_TYPE_TO_DAMAGE_TYPE_MAP,
  DEFAULT_SKILL_LEVEL,
  ELEMENT_ID_TO_ATTRIBUTE_MAP,
  RELATED_PROPERTY_TO_SCALING_PROPERTY,
} from '../attacks/constants';
import { DAMAGE_SUBTYPE_TO_TAG_MAP } from '../buffs/constants';
import type { Damage } from '../repostiory';

import type { DamageInstance } from './types';

// Try to transform a damage row from the repository to a DamageInstanc
// return undefined if unable to
export const tryTransformToDamageInstance = (
  damage: Damage,
  dedupedIds: Array<number> = [],
): DamageInstance | undefined => {
  const {
    id,
    rateLv,
    element,
    type,
    calculateType,
    relatedProperty,
    weaknessLvl,
    energy,
    elementPower,
  } = damage;
  const attribute = ELEMENT_ID_TO_ATTRIBUTE_MAP[element];
  const damageType = DAMAGE_INSTANCE_TYPE_TO_DAMAGE_TYPE_MAP[type];
  const motionValue = getDefaultSkillLevelValue(rateLv);
  const scalingAttribute = RELATED_PROPERTY_TO_SCALING_PROPERTY[relatedProperty];
  if (
    !attribute ||
    !damageType ||
    !motionValue ||
    !scalingAttribute ||
    calculateType !== CalculateType.DAMAGE
  )
    return;
  const subtypes = compact(
    damage.subType.map((typeId) => DAMAGE_SUBTYPE_TO_TAG_MAP[String(typeId)]),
  );
  return {
    id,
    dedupedIds,
    motionValue,
    attribute,
    scalingAttribute,
    motionValuePerStack: getMotionValuePerStack(damage),
    type: damageType,
    subtypes,
    offTuneBuildup: weaknessLvl.at(0) ?? 0,
    energy: energy.at(0) ?? 0,
    concertoRegen: elementPower.at(0) ?? 0,
  };
};

export const dedupeDamageInstances = (
  damageArray: Array<Damage>,
): Array<Damage & { dedupedIds: Array<number> }> => {
  const damageGroups = Object.groupBy(damageArray, ({ id, ...rest }) =>
    JSON.stringify(rest),
  );
  const dedupedDamageArray = compact(Object.values(damageGroups))
    .filter((group) => group.length > 0)
    .map((group) => ({
      // Cast is safe due to earlier filter to remove empty arrays
      ...(minBy(group, (damage) => damage.id) as Damage),
      dedupedIds: group.map((damage) => damage.id),
    }));
  return dedupedDamageArray;
};

export const transformDamageToDamageInstances = (
  damageRows: Array<Damage>,
): Array<DamageInstance> => {
  return compact(
    dedupeDamageInstances(damageRows).map((rawDamage) => {
      return tryTransformToDamageInstance(rawDamage, rawDamage.dedupedIds);
    }),
  );
};

const getMotionValuePerStack = ({ formulaParam5 }: Damage): number | undefined => {
  const motionValue = getDefaultSkillLevelValue(formulaParam5);
  if (motionValue === 0) return undefined;
  return motionValue;
};

const getDefaultSkillLevelValue = (
  valuePerLevel: Array<number>,
): number | undefined => {
  return valuePerLevel.at(DEFAULT_SKILL_LEVEL - 1) ?? valuePerLevel.at(-1);
};

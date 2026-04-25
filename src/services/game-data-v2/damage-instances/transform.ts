import { compact } from 'es-toolkit';

import { DAMAGE_SUBTYPE_TO_TAG_MAP } from '../buffs/constants';
import {
  CalculateType,
  DAMAGE_INSTANCE_TYPE_TO_DAMAGE_TYPE_MAP,
  DEFAULT_SKILL_LEVEL,
  ELEMENT_ID_TO_ATTRIBUTE_MAP,
  RELATED_PROPERTY_TO_SCALING_PROPERTY,
} from '../constants';
import type { Damage } from '../repostiory';

import type { DamageInstanceContext } from './fetch-context';
import type { DamageInstanceData } from './types';

const EMPTY_CONTEXT: DamageInstanceContext = { damageById: new Map() };

export const tryTransformToDamageInstance = (
  damage: Damage,
  context: DamageInstanceContext = EMPTY_CONTEXT,
): DamageInstanceData | undefined => {
  if (damage.condition) {
    return tryTransformConditionalDamage(damage, context);
  }

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

export const transformDamageToDamageInstances = (
  damageRows: Array<Damage>,
): Array<DamageInstanceData> => {
  return compact(
    damageRows.map((rawDamage) => tryTransformToDamageInstance(rawDamage)),
  );
};

const tryTransformConditionalDamage = (
  damage: Damage,
  context: DamageInstanceContext,
): DamageInstanceData | undefined => {
  const parsed = parseCondition(damage.condition, damage.constVariables);
  if (!parsed) return undefined;

  const { noTagId, hasTagId, requiredTag } = parsed;
  const baseDamageRow = context.damageById.get(noTagId);
  if (!baseDamageRow) return undefined;

  const base = tryTransformToDamageInstance(baseDamageRow);
  if (!base) return undefined;

  const altDamageRow = context.damageById.get(hasTagId);
  const altMotionValue = altDamageRow
    ? getDefaultSkillLevelValue(altDamageRow.rateLv)
    : undefined;

  const alternativeMotionValue =
    altMotionValue === undefined
      ? undefined
      : {
          requiredTag,
          motionValue: altMotionValue,
          motionValuePerStack:
            getDefaultSkillLevelValue(altDamageRow!.formulaParam5) ?? 0,
        };

  return {
    ...base,
    id: damage.id,
    ...(alternativeMotionValue ? { alternativeMotionValue } : {}),
  };
};

type ParsedCondition = {
  hasTagId: number;
  noTagId: number;
  requiredTag: string;
};

const parseCondition = (
  condition: string,
  constVariables: unknown,
): ParsedCondition | undefined => {
  const lines = condition.split('\n');

  let hasTagLine: string | undefined;
  let noTagLine: string | undefined;
  for (const line of lines) {
    if (line.includes('NotHasAnyTag')) {
      noTagLine = line;
    } else if (line.includes('HasAnyTag')) {
      hasTagLine = line;
    }
  }

  if (!hasTagLine || !noTagLine) return undefined;

  const hasTagMatch = hasTagLine.match(/HasAnyTag (\w+).*ExecDamage (\d+)/);
  const noTagMatch = noTagLine.match(/ExecDamage (\d+)/);

  if (!hasTagMatch || !noTagMatch) return undefined;

  const variableKey = hasTagMatch[1];
  const hasTagId = Number.parseInt(hasTagMatch[2], 10);
  const noTagId = Number.parseInt(noTagMatch[1], 10);

  const variables = getConstVariables(constVariables);
  const constVariable = variables.find((v) => v.Key === variableKey);
  if (!constVariable) return undefined;

  return { hasTagId, noTagId, requiredTag: constVariable.Value };
};

type ConstVariable = { Key: string; Value: string };

const getConstVariables = (constVariables: unknown): Array<ConstVariable> => {
  if (!Array.isArray(constVariables)) return [];
  return constVariables.filter(
    (v): v is ConstVariable =>
      typeof v === 'object' && v !== null && 'Key' in v && 'Value' in v,
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

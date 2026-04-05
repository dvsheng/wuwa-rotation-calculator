import { sortBy } from 'es-toolkit';

import type { DamageInstance } from '../damage-instances/types';
import type { SkillAttribute } from '../repostiory';

import { DEFAULT_SKILL_LEVEL } from './constants';
import type { Attack } from './types';

type ParsedSkillAttributeValue = {
  hitCount: number;
  motionValue: number;
};

export const inferAttacksFromSkillAttributes = <T extends DamageInstance>(
  damageInstances: Array<T>,
  skillAttributes: Array<SkillAttribute>,
): Array<Attack> => {
  const sortedDamageInstances = sortBy(damageInstances, ['motionValue', 'id']);
  const remainingDamageInstances = new Map(
    sortedDamageInstances.map((damageInstance) => [damageInstance.id, damageInstance]),
  );
  const inferredAttacks = skillAttributes.flatMap((skillAttribute) => {
    const parsedValues = parseSkillAttributeValues(skillAttribute.values);

    if (parsedValues.length === 0) return [];

    const matchedInstances = parsedValues.flatMap((parsedValue) => {
      const matchedDamageInstance = [...remainingDamageInstances.values()].find(
        (damageInstance) => damageInstance.motionValue === parsedValue.motionValue,
      );
      if (!matchedDamageInstance) return [];

      remainingDamageInstances.delete(matchedDamageInstance.id);
      return [
        {
          ...matchedDamageInstance,
          hitCount: parsedValue.hitCount,
        },
      ];
    });
    if (matchedInstances.length === 0) return [];
    return [
      {
        id: String(skillAttribute.id),
        origin: 'system' as const,
        instances: matchedInstances,
      },
    ];
  });

  return inferredAttacks;
};

function parseSkillAttributeValues(
  values: Array<string>,
): Array<ParsedSkillAttributeValue> {
  const levelValue = values.at(DEFAULT_SKILL_LEVEL - 1) ?? values.at(-1);
  if (!levelValue) return [];

  return [...levelValue.matchAll(/(\d+(?:\.\d+)?)%(?:\*(\d+))?/g)].map((match) => ({
    motionValue: Math.round(Number.parseFloat(match[1]) * 100),
    hitCount: match[2] ? Number.parseInt(match[2], 10) : 1,
  }));
}

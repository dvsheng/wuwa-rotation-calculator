import { applyModifiers } from './apply-modifiers';
import { calculateAttackDamage } from './calculate-attack-damage';
import { resolveStatValuesInRotation } from './resolve-stat-value';
import type { Rotation, RotationResult } from './types';

export const calculateRotationDamage = (rotation: Rotation): RotationResult => {
  const resolvedRotation = resolveStatValuesInRotation(rotation);
  return resolvedRotation.damageInstances.reduce(
    (reducer, { instance, modifiers }) => {
      const [team, enemy] = applyModifiers(
        rotation.team,
        rotation.enemy,
        modifiers,
        instance.originCharacterName,
      );
      const instanceDamage = calculateAttackDamage(instance, {
        team,
        enemy,
      });
      const { totalDamage, damageInstances } = reducer;
      return {
        totalDamage: totalDamage + instanceDamage,
        damageInstances: [...damageInstances, instanceDamage],
      };
    },
    { totalDamage: 0, damageInstances: new Array<number>() } as RotationResult,
  );
};

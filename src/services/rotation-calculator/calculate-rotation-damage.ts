import type { CharacterDamageInstance, Enemy, Team } from '@/types';

import { applyModifiers } from './apply-modifiers';
import { calculateAttackDamage } from './calculate-attack-damage';
import type { CalculateDamageProperties } from './damage-calculator/types';
import type { Rotation, RotationResult } from './types';

export const calculateRotationDamage = (rotation: Rotation): RotationResult => {
  return rotation.damageInstances.reduce(
    (reducer, { instance, modifiers }) => {
      const [team, enemy] = applyModifiers(rotation.team, rotation.enemy, modifiers);
      const instanceDamage = calculateAttackDamage(instance, {
        team,
        enemy,
      });
      const { totalDamage, damageInstances, damageDetails } = reducer;
      return {
        totalDamage: totalDamage + instanceDamage.result,
        damageInstances: [...damageInstances, instanceDamage.result],
        damageDetails: [
          ...damageDetails,
          {
            team,
            enemy,
            instance,
            resolvedStats: instanceDamage.inputs,
          },
        ],
      };
    },
    {
      totalDamage: 0,
      damageInstances: new Array<number>(),
      damageDetails: new Array<{
        team: Team;
        enemy: Enemy;
        instance: CharacterDamageInstance;
        resolvedStats: CalculateDamageProperties;
      }>(),
    },
  );
};

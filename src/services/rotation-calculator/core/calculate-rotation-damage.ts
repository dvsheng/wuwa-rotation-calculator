import { applyModifiers } from './apply-modifiers';
import { calculateAttackDamage } from './calculate-attack-damage';
import { getStatFilterer } from './filter-stats';
import type { Rotation, RotationResult } from './types';

export const calculateRotationDamage = (rotation: Rotation): RotationResult => {
  return rotation.damageInstances.reduce(
    (reducer, { instance, modifiers }) => {
      const [teamWithModifiers, enemyWithModifiers] = applyModifiers(
        rotation.team,
        rotation.enemy,
        modifiers,
      );
      const filterStats = getStatFilterer(instance.scalingStat, instance.tags);
      const { filteredTeam, filteredEnemy } = filterStats(
        teamWithModifiers,
        enemyWithModifiers,
      );
      const instanceDamage = calculateAttackDamage(instance, {
        team: filteredTeam,
        enemy: filteredEnemy,
      });
      const { totalDamage, damageInstances, damageDetails } = reducer;
      return {
        totalDamage: totalDamage + instanceDamage.result,
        damageInstances: [...damageInstances, instanceDamage.result],
        damageDetails: [
          ...damageDetails,
          {
            team: filteredTeam,
            enemy: filteredEnemy,
            instance,
            resolvedStats: instanceDamage.inputs,
          },
        ],
      };
    },
    {
      totalDamage: 0,
      damageInstances: new Array<number>(),
      damageDetails: new Array<RotationResult['damageDetails'][number]>(),
    },
  );
};

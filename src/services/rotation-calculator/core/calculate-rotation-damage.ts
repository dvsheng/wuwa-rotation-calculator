import { applyModifiers } from './apply-modifiers';
import { calculateAttackDamage } from './calculate-attack-damage';
import { createStatFilteringStrategy } from './filter-stats';
import type { Rotation, RotationResult } from './types';

export const calculateRotationDamage = (rotation: Rotation): RotationResult => {
  return rotation.damageInstances.reduce(
    (reducer, { instance, modifiers }) => {
      const [teamWithModifiers, enemyWithModifiers] = applyModifiers(
        rotation.team,
        rotation.enemy,
        modifiers,
      );
      const filteringStrategy = createStatFilteringStrategy(
        instance.scalingStat,
        instance.tags,
      );
      const teamWithRelevantStats = teamWithModifiers.map((character) =>
        filteringStrategy.filterCharacterStats(character),
      );
      const enemyWithRelevantStats =
        filteringStrategy.filterEnemyStats(enemyWithModifiers);
      const instanceDamage = calculateAttackDamage(instance, {
        team: teamWithRelevantStats,
        enemy: enemyWithRelevantStats,
      });
      const { totalDamage, damageInstances, damageDetails } = reducer;
      return {
        totalDamage: totalDamage + instanceDamage.result,
        damageInstances: [...damageInstances, instanceDamage.result],
        damageDetails: [
          ...damageDetails,
          {
            team: teamWithRelevantStats,
            enemy: enemyWithRelevantStats,
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

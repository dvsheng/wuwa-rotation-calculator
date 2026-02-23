import { isNegativeStatusAbilityAttribute } from '@/types';
import type { Character, Enemy } from '@/types';

import { applyModifiers } from './apply-modifiers';
import { calculateAttackDamage } from './calculate-attack-damage';
import {
  filterCharacterStatsByNegativeStatus,
  filterCharacterStatsByTags,
  filterEnemyStatsByNegativeStatus,
  filterEnemyStatsByTags,
} from './filter-stats';
import type { Rotation, RotationResult } from './types';

export const calculateRotationDamage = (rotation: Rotation): RotationResult => {
  return rotation.damageInstances.reduce(
    (reducer, { instance, modifiers }) => {
      const [teamWithModifiers, enemyWithModifiers] = applyModifiers(
        rotation.team,
        rotation.enemy,
        modifiers,
      );
      const scalingStat = instance.scalingStat;
      const filterCharacterStats = isNegativeStatusAbilityAttribute(scalingStat)
        ? (character: Character) =>
            filterCharacterStatsByNegativeStatus(character, scalingStat)
        : (character: Character) =>
            filterCharacterStatsByTags(character, instance.tags);
      const teamWithRelevantStats = teamWithModifiers.map((character) =>
        filterCharacterStats(character),
      );

      const filterEnemyStats = isNegativeStatusAbilityAttribute(scalingStat)
        ? (enemy: Enemy) => filterEnemyStatsByNegativeStatus(enemy, scalingStat)
        : (enemy: Enemy) => filterEnemyStatsByTags(enemy, instance.tags);
      const enemyWithRelevantStats = filterEnemyStats(enemyWithModifiers);
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

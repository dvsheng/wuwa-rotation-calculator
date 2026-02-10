import type { CharacterDamageInstance, Enemy, Team } from '@/types';

import { applyModifiers } from './apply-modifiers';
import { calculateAttackDamage } from './calculate-attack-damage';
import type { CalculateDamageProperties } from './damage-calculator/types';
import {
  filterCharacterStatsByTags,
  filterEnemyStatsByTags,
} from './filter-stats-by-tags';
import type { Rotation, RotationResult } from './types';

export const calculateRotationDamage = (rotation: Rotation): RotationResult => {
  return rotation.damageInstances.reduce(
    (reducer, { instance, modifiers }) => {
      const [teamWithModifiers, enemyWithModifiers] = applyModifiers(
        rotation.team,
        rotation.enemy,
        modifiers,
      );
      const teamWithRelevantStats = teamWithModifiers.map((character) =>
        filterCharacterStatsByTags(character, instance.tags),
      );
      const enemyWithRelevantStats = filterEnemyStatsByTags(
        enemyWithModifiers,
        instance.tags,
      );
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
      damageDetails: new Array<{
        team: Team;
        enemy: Enemy;
        instance: CharacterDamageInstance;
        resolvedStats: CalculateDamageProperties;
      }>(),
    },
  );
};

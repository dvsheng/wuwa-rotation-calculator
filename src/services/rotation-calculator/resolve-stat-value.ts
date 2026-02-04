import { mapValues } from 'es-toolkit/object';

import { Tag } from '@/types';
import type { Enemy, StatValue, TaggedStatValue, Team } from '@/types';
import { calculateParameterizedNumberValue } from '@/services/rotation-calculator/calculate-parameterized-number';

import {
  getCalculateCharacterStatsForTag,
  getCalculateEnemyStatsForTag,
} from './calculate-stat-total';
import type { Rotation } from './types';

export const getStatValueResolver =
  (team: Team, enemy: Enemy) =>
  (statValue: StatValue): number => {
    if (typeof statValue === 'number') {
      return statValue;
    }
    const { resolveWith } = statValue;
    const character = team.find((c) => c.id === resolveWith);
    if (!character) return 0;
    const characterStats = getCalculateCharacterStatsForTag([Tag.ALL])(character.stats);
    const enemyStats = getCalculateEnemyStatsForTag([Tag.ALL])(enemy.stats);
    return calculateParameterizedNumberValue(statValue, {
      ...characterStats,
      ...enemyStats,
    });
  };

export const resolveStatValuesInRotation = (rotation: Rotation): Rotation => {
  const resolveStatValue = getStatValueResolver(rotation.team, rotation.enemy);
  return {
    ...rotation,
    damageInstances: rotation.damageInstances.map((instance) => {
      return {
        ...instance,
        modifiers: instance.modifiers.map((modifier) => {
          return {
            ...modifier,
            modifiedStats: mapValues(
              modifier.modifiedStats as Record<string, Array<TaggedStatValue>>,
              (stats) =>
                stats.map((stat) => {
                  if (typeof stat.value === 'number') {
                    return stat;
                  }
                  return {
                    ...stat,
                    value: resolveStatValue(stat.value),
                  };
                }),
            ),
          };
        }),
      };
    }),
  };
};

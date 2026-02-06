import { mapValues } from 'es-toolkit/object';

import { calculateParameterizedNumberValue } from '@/services/rotation-calculator/calculate-parameterized-number';
import { Tag } from '@/types';
import type { Enemy, StatValue, Team } from '@/types';

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
    const character = team[resolveWith];
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
    duration: rotation.duration,
    team: rotation.team.map((character) => {
      return {
        ...character,
        stats: mapValues(character.stats, (statValues) => {
          return statValues.map((statValue) => {
            return {
              ...statValue,
              value: resolveStatValue(statValue.value),
            };
          });
        }),
      };
    }) as Team,
    enemy: {
      ...rotation.enemy,
      stats: mapValues(rotation.enemy.stats, (statValues) => {
        return statValues.map((statValue) => {
          return {
            ...statValue,
            value: resolveStatValue(statValue.value),
          };
        });
      }),
    },
    damageInstances: rotation.damageInstances.map((instance) => {
      return {
        ...instance,
        modifiers: instance.modifiers.map((modifier) => {
          return {
            ...modifier,
            modifiedStats: mapValues(modifier.modifiedStats, (stats) => {
              if (!stats) return stats;
              return stats.map((stat) => {
                return {
                  ...stat,
                  value: resolveStatValue(stat.value),
                };
              });
            }),
          };
        }),
      };
    }),
  };
};

import { Tag } from '@/types';
import type { Enemy, StatValue, Team } from '@/types';
import { calculateParameterizedNumberValue } from '@/utils/math-utils';

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
            value: Object.fromEntries(
              Object.entries(modifier.modifiedStats).map(([key, values]) => {
                const resolvedValues = values.map((value) => {
                  if (typeof value.value === 'number') {
                    return value;
                  }
                  return {
                    ...value,
                    value: resolveStatValue(value.value),
                  };
                });
                return [key, resolvedValues];
              }),
            ),
          };
        }),
      };
    }),
  };
};

import { mapValues, mergeWith } from 'es-toolkit/object';

import { CharacterStat, EnemyStat } from '@/types';

import { applyModifiers } from './apply-modifiers';
import { calculateAttackDamage } from './calculate-attack-damage';
import { getStatFilterer } from './filter-stats';
import { resolveStats } from './resolve-runtime-number';
import type { CharacterStats, EnemyStats, Rotation, RotationResult } from './types';

export const calculateRotationDamage = <
  TStatMeta extends object = {},
  TAttackMeta extends object = {},
>(
  rotation: Rotation<TStatMeta, TAttackMeta>,
): RotationResult<TStatMeta, TAttackMeta> => {
  return rotation.attacks.reduce(
    (reducer, { attack, modifiers }, index) => {
      const [teamWithModifiers, enemyWithModifiers] = applyModifiers(
        rotation.team,
        rotation.enemy,
        modifiers,
      );
      const filterStats = getStatFilterer(attack.scalingStat, attack.tags);
      const { filteredTeam, filteredEnemy } = filterStats(
        teamWithModifiers,
        enemyWithModifiers,
      );

      const teamStatsGroupedByStat = filteredTeam.map((character) =>
        mergeWith(
          Object.groupBy(character.stats, (stat) => stat.stat),
          createEmptyCharacterStats(),
          (argument1, argument2) => [...(argument1 ?? []), ...argument2],
        ),
      ) as Array<CharacterStats<TStatMeta>>;
      const enemyStatsGroupedByStat = mergeWith(
        Object.groupBy(filteredEnemy.stats, (stat) => stat.stat),
        createEmptyEnemyStats(),
        (argument1, argument2) => [...(argument1 ?? []), ...argument2],
      ) as EnemyStats<TStatMeta>;

      const { team: teamStats, enemy: enemyStats } = resolveStats(
        teamStatsGroupedByStat.map((character) =>
          mapValues(character, (stats) => stats.map((stat) => stat.value)),
        ),
        mapValues(enemyStatsGroupedByStat, (stats) => stats.map((stat) => stat.value)),
      );
      const { result, inputs } = calculateAttackDamage(
        attack,
        {
          ...teamStats[attack.characterIndex],
          level: filteredTeam[attack.characterIndex].level,
        },
        { ...enemyStats, level: filteredEnemy.level },
      );
      return {
        totalDamage: reducer.totalDamage + result,
        damageDetails: [
          ...reducer.damageDetails,
          {
            ...inputs,
            ...attack,
            index,
            damage: result,
            teamDetails: teamStatsGroupedByStat,
            enemyDetails: enemyStatsGroupedByStat,
          },
        ],
      };
    },
    {
      totalDamage: 0,
      damageDetails: new Array<
        RotationResult<TStatMeta, TAttackMeta>['damageDetails'][number]
      >(),
    },
  );
};

const createEmptyCharacterStats = (): CharacterStats =>
  Object.fromEntries(
    Object.values(CharacterStat).map((stat) => [stat, []]),
  ) as unknown as CharacterStats;

const createEmptyEnemyStats = (): EnemyStats =>
  Object.fromEntries(
    Object.values(EnemyStat).map((stat) => [stat, []]),
  ) as unknown as EnemyStats;

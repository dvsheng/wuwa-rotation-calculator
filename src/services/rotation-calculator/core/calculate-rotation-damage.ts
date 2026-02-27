import { applyModifiers } from './apply-modifiers';
import { calculateAttackDamage } from './calculate-attack-damage';
import { getStatFilterer } from './filter-stats';
import { resolveStats } from './resolve-runtime-stat-values';
import type { Rotation, RotationResult } from './types';

export const calculateRotationDamage = (rotation: Rotation): RotationResult => {
  const flattenedDamageInstances = rotation.attacks.flatMap(
    ({ attack, modifiers }, attackIndex) => {
      return attack.damageInstances.map((instance) => ({
        instance: {
          ...instance,
          characterIndex: attack.characterIndex,
        },
        modifiers,
        attackIndex,
      }));
    },
  );
  return flattenedDamageInstances.reduce(
    (reducer, { instance, modifiers, attackIndex }) => {
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
      const { team: resolvedTeam, enemy: resolvedEnemy } = resolveStats(
        filteredTeam,
        filteredEnemy,
      );
      const { result, inputs } = calculateAttackDamage(
        instance,
        instance.characterIndex,
        resolvedTeam,
        resolvedEnemy,
      );
      return {
        totalDamage: reducer.totalDamage + result,
        damageDetails: [
          ...reducer.damageDetails,
          {
            ...inputs,
            attackIndex,
            damage: result,
          },
        ],
      };
    },
    {
      totalDamage: 0,
      damageDetails: new Array<RotationResult['damageDetails'][number]>(),
    },
  );
};

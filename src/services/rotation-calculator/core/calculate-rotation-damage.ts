import { mapValues } from 'es-toolkit/object';

import { applyModifiers } from './apply-modifiers';
import { calculateAttackDamage } from './calculate-attack-damage';
import { getStatFilterer } from './filter-stats';
import { resolveStats } from './resolve-runtime-number';
import type { Rotation, RotationResult } from './types';

export const calculateRotationDamage = (rotation: Rotation): RotationResult => {
  const flattenedDamageInstances = rotation.attacks.flatMap(
    ({ attack, modifiers, storedAttackIndex }, attackIndex) => {
      const effectiveAttackIndex = storedAttackIndex ?? attackIndex;
      return attack.damageInstances.map((instance) => ({
        instance: {
          ...instance,
          characterIndex: attack.characterIndex,
        },
        modifiers,
        attackIndex: effectiveAttackIndex,
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
      const { team: teamStats, enemy: enemyStats } = resolveStats(
        filteredTeam.map((character) =>
          mapValues(character.stats, (values) => values.map((value) => value.value)),
        ),
        mapValues(filteredEnemy.stats, (values) => values.map((value) => value.value)),
      );
      const { result, inputs } = calculateAttackDamage(
        instance,
        {
          ...teamStats[instance.characterIndex],
          level: filteredTeam[instance.characterIndex].level,
        },
        { ...enemyStats, level: filteredEnemy.level },
      );
      return {
        totalDamage: reducer.totalDamage + result,
        damageDetails: [
          ...reducer.damageDetails,
          {
            ...inputs,
            attackIndex,
            characterIndex: instance.characterIndex,
            scalingStat: instance.scalingStat,
            motionValue: instance.motionValue,
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

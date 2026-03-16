import type { RotationResultMergedDamageDetail } from '@/hooks/useRotationCalculation';

import type { AttackGroup } from './AttackBreakdownRowDropdown';

export const buildAttackGroups = (
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>,
): Array<AttackGroup> => {
  const groupMap = new Map<number, AttackGroup>();
  const hitCountPerAttack = new Map<number, number>();

  for (const damageInstance of mergedDamageDetails) {
    const characterName = damageInstance.characterName;
    const hitIndex = hitCountPerAttack.get(damageInstance.attackIndex) ?? 0;
    hitCountPerAttack.set(damageInstance.attackIndex, hitIndex + 1);

    const existingGroup = groupMap.get(damageInstance.attackIndex);
    if (existingGroup) {
      existingGroup.hits.push({
        hitIndex,
        detail: damageInstance,
        damage: damageInstance.damage,
      });
      existingGroup.totalDamage += damageInstance.damage;
      continue;
    }

    groupMap.set(damageInstance.attackIndex, {
      attackIndex: damageInstance.attackIndex,
      attack: damageInstance,
      characterName,
      hits: [{ hitIndex, detail: damageInstance, damage: damageInstance.damage }],
      totalDamage: damageInstance.damage,
    });
  }

  return [...groupMap.values()];
};

export const useAttackBreakdown = (
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>,
) => ({
  attackGroups: buildAttackGroups(mergedDamageDetails),
});

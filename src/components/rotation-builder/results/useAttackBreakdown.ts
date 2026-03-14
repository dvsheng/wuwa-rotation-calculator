import type { RotationResultMergedDamageDetail } from '@/hooks/useRotationCalculation';

import type { AttackGroup } from './AttackBreakdownRowDropdown';

export const buildAttackGroups = (
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>,
): Array<AttackGroup> => {
  const groupMap = new Map<number, AttackGroup>();
  const hitCountPerAttack = new Map<number, number>();

  for (const { detail, attack } of mergedDamageDetails) {
    const characterName = attack?.characterName ?? '';
    const hitIndex = hitCountPerAttack.get(detail.attackIndex) ?? 0;
    hitCountPerAttack.set(detail.attackIndex, hitIndex + 1);

    const existingGroup = groupMap.get(detail.attackIndex);
    if (existingGroup) {
      existingGroup.hits.push({ hitIndex, detail, damage: detail.damage });
      existingGroup.totalDamage += detail.damage;
      continue;
    }

    groupMap.set(detail.attackIndex, {
      attackIndex: detail.attackIndex,
      attack,
      characterName,
      hits: [{ hitIndex, detail, damage: detail.damage }],
      totalDamage: detail.damage,
    });
  }

  return [...groupMap.values()];
};

export const useAttackBreakdown = (
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>,
) => ({
  attackGroups: buildAttackGroups(mergedDamageDetails),
});

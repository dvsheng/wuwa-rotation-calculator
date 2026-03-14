import { sumBy } from 'es-toolkit/math';

import type { RotationResultMergedDamageDetail } from '@/hooks/useRotationCalculation';

import type { CharacterBreakdownRow } from './character-breakdown.types';
import type { DistributionChartDatum } from './result-breakdown.types';
import { getChartColor } from './result-chart.utilities';

export const buildCharacterRows = ({
  mergedDamageDetails,
  totalDamage,
}: {
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>;
  totalDamage: number;
}): Array<CharacterBreakdownRow> => {
  const hitCountPerAttack = new Map<number, number>();
  const enriched = mergedDamageDetails.map(({ detail, attack }) => {
    const hitIndex = hitCountPerAttack.get(detail.attackIndex) ?? 0;
    hitCountPerAttack.set(detail.attackIndex, hitIndex + 1);
    return {
      detail,
      attack,
      characterName: attack?.characterName ?? '',
      damageType: attack?.damageInstances[hitIndex]?.damageType ?? 'unknown',
    };
  });

  const byCharacter = Object.groupBy(enriched, (item) => item.characterName);
  return Object.entries(byCharacter)
    .filter(([characterName]) => characterName !== '')
    .map(([characterName, items]) => {
      const iconUrl = items?.find((item) => item.attack?.characterIconUrl)?.attack
        ?.characterIconUrl;
      const characterItems = items ?? [];
      const characterTotalDamage = sumBy(characterItems, (item) => item.detail.damage);
      const byType = Object.groupBy(characterItems, (item) => item.damageType);
      const damageTypes = Object.entries(byType)
        .map(([damageType, typeItems]) => {
          const damage = sumBy(typeItems ?? [], (item) => item.detail.damage);
          return {
            damageType,
            damage,
            pctOfCharacter:
              characterTotalDamage > 0 ? (damage / characterTotalDamage) * 100 : 0,
          };
        })
        .toSorted((left, right) => right.damage - left.damage);

      return {
        characterName,
        iconUrl,
        totalDamage: characterTotalDamage,
        pctOfTotal: totalDamage > 0 ? (characterTotalDamage / totalDamage) * 100 : 0,
        damageTypes,
      };
    })
    .toSorted((left, right) => right.totalDamage - left.totalDamage);
};

export const useCharacterBreakdown = ({
  mergedDamageDetails,
  totalDamage,
}: {
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>;
  totalDamage: number;
}) => {
  const rows = buildCharacterRows({ mergedDamageDetails, totalDamage });
  const chartData: Array<DistributionChartDatum> = rows.map((row, index) => ({
    id: row.characterName,
    label: row.characterName,
    value: row.totalDamage,
    percentage: row.pctOfTotal,
    fill: getChartColor(index),
  }));

  return { rows, chartData };
};

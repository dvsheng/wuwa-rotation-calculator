import { sumBy } from 'es-toolkit/math';

import type { RotationResultMergedDamageDetail } from '@/hooks/useRotationCalculation';

import { toDisplayName } from './character-breakdown.types';
import type { DistributionChartDatum } from './result-breakdown.types';
import { getChartColor } from './result-chart.utilities';

export const useDamageTypeBreakdown = (
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>,
) => {
  const totalDamage = sumBy(mergedDamageDetails, ({ detail }) => detail.damage);

  const hitCountPerAttack = new Map<number, number>();
  const enriched = mergedDamageDetails.map(({ detail, attack }) => {
    const hitIndex = hitCountPerAttack.get(detail.attackIndex) ?? 0;
    hitCountPerAttack.set(detail.attackIndex, hitIndex + 1);
    return {
      detail,
      damageType: attack?.damageInstances[hitIndex]?.damageType ?? 'unknown',
    };
  });

  const byType = Object.groupBy(enriched, (item) => item.damageType);

  const TOP_N = 4;

  const sorted = Object.entries(byType)
    .map(([damageType, items]) => {
      const damage = sumBy(items ?? [], (item) => item.detail.damage);
      return { damageType, damage };
    })
    .toSorted((a, b) => b.damage - a.damage);

  const top = sorted.slice(0, TOP_N);
  const rest = sorted.slice(TOP_N);
  const otherDamage = sumBy(rest, (r) => r.damage);

  const rows = [
    ...top,
    ...(otherDamage > 0 ? [{ damageType: 'other', damage: otherDamage }] : []),
  ].map((row) => ({
    ...row,
    pctOfTotal: totalDamage > 0 ? (row.damage / totalDamage) * 100 : 0,
  }));

  const chartData: Array<DistributionChartDatum> = rows.map((row, index) => ({
    id: row.damageType,
    label: row.damageType === 'other' ? 'Other' : toDisplayName(row.damageType),
    value: row.damage,
    percentage: row.pctOfTotal,
    fill: getChartColor(index),
  }));

  return { chartData };
};

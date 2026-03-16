import { drop, filter, groupBy, mapValues, pipe, sortBy, sumBy, take } from 'remeda';

import type { RotationResultMergedDamageDetail } from '@/hooks/useRotationCalculation';

// TODO: FilterConfig + GroupConfig
export interface GetRotationResultBreakdownProperties {
  data: Array<RotationResultMergedDamageDetail>;
  characterIndex?: number;
  damageType?: string;
  groupKey: 'damageType' | 'originType' | 'characterId' | 'characterName' | 'name';
  bucketBelow?: number;
}

export const getRotationResultBreakdown = ({
  data,
  groupKey,
  characterIndex,
  damageType,
  bucketBelow,
}: GetRotationResultBreakdownProperties) => {
  const filtered = pipe(
    data,
    filter((di) => {
      if (characterIndex !== undefined && di.characterIndex !== characterIndex) {
        return false;
      }
      if (damageType !== undefined && di.damageType !== damageType) {
        return false;
      }
      return true;
    }),
  );

  const totalDamage = sumBy(filtered, (d) => d.damage);
  const grouped = pipe(
    filtered,
    groupBy((item) => item[groupKey]),
    mapValues((items) => sumBy(items, (item) => item.damage)),
    Object.entries,
    sortBy([(x) => x[1], 'desc']),
  );

  const cutoff =
    bucketBelow === undefined ? grouped.length : Math.max(0, bucketBelow - 1);
  const top = take(grouped, cutoff);
  const rest = drop(grouped, cutoff);
  const otherDamage = sumBy(rest, (x) => x[1]);
  const rows = otherDamage > 0 ? [...top, ['Other', otherDamage] as const] : top;

  return rows.map(([groupValue, damage]) => ({
    groupValue,
    damage,
    percentage: totalDamage === 0 ? 0 : (damage / totalDamage) * 100,
  }));
};

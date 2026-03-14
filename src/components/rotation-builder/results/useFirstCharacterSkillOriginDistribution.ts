import { sumBy } from 'es-toolkit/math';

import type { RotationResultMergedDamageDetail } from '@/hooks/useRotationCalculation';
import { OriginType } from '@/services/game-data';

import type {
  DistributionChartDatum,
  SkillOriginDistributionRow,
} from './result-breakdown.types';
import { getChartColor } from './result-chart.utilities';

const SKILL_ORIGIN_BUCKETS = {
  resonanceSkill: {
    id: 'resonanceSkill',
    label: 'Resonance Skill',
  },
  forteCircuit: {
    id: 'forteCircuit',
    label: 'Forte Circuit',
  },
  resonanceLiberation: {
    id: 'resonanceLiberation',
    label: 'Resonance Liberation',
  },
  basicAttack: {
    id: 'basicAttack',
    label: 'Basic Attack',
  },
  intro: {
    id: 'intro',
    label: 'Intro',
  },
  other: {
    id: 'other',
    label: 'Other',
  },
} as const;

const SKILL_ORIGIN_BUCKET_BY_ORIGIN_TYPE = {
  [OriginType.RESONANCE_SKILL]: SKILL_ORIGIN_BUCKETS.resonanceSkill,
  [OriginType.FORTE_CIRCUIT]: SKILL_ORIGIN_BUCKETS.forteCircuit,
  [OriginType.RESONANCE_LIBERATION]: SKILL_ORIGIN_BUCKETS.resonanceLiberation,
  [OriginType.NORMAL_ATTACK]: SKILL_ORIGIN_BUCKETS.basicAttack,
  [OriginType.INTRO_SKILL]: SKILL_ORIGIN_BUCKETS.intro,
} as const;

type SkillOriginBucketId = keyof typeof SKILL_ORIGIN_BUCKETS;

const getSkillOriginBucket = (originType: string | undefined) => {
  if (!originType || !(originType in SKILL_ORIGIN_BUCKET_BY_ORIGIN_TYPE)) {
    return SKILL_ORIGIN_BUCKETS.other;
  }

  return SKILL_ORIGIN_BUCKET_BY_ORIGIN_TYPE[
    originType as keyof typeof SKILL_ORIGIN_BUCKET_BY_ORIGIN_TYPE
  ];
};

export const buildFirstCharacterSkillOriginDistribution = (
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>,
): {
  characterName: string | undefined;
  rows: Array<SkillOriginDistributionRow>;
  chartData: Array<DistributionChartDatum>;
} => {
  const firstCharacterDetails = mergedDamageDetails.filter(
    ({ detail }) => detail.characterIndex === 0,
  );
  const characterName = firstCharacterDetails[0]?.attack?.characterName;
  const totalDamage = sumBy(firstCharacterDetails, ({ detail }) => detail.damage);
  const byOriginType = Object.groupBy(
    firstCharacterDetails,
    ({ attack }) => getSkillOriginBucket(attack?.originType).id,
  );

  const rows = Object.entries(byOriginType)
    .map(([originType, items]) => {
      const damage = sumBy(items, ({ detail }) => detail.damage);
      return {
        originType,
        damage,
        pctOfCharacter: totalDamage > 0 ? (damage / totalDamage) * 100 : 0,
      };
    })
    .toSorted((left, right) => right.damage - left.damage);

  const chartData: Array<DistributionChartDatum> = rows.map((row, index) => ({
    id: row.originType,
    label: SKILL_ORIGIN_BUCKETS[row.originType as SkillOriginBucketId].label,
    value: row.damage,
    percentage: row.pctOfCharacter,
    fill: getChartColor(index),
  }));

  return { characterName, rows, chartData };
};

export const useFirstCharacterSkillOriginDistribution = (
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>,
) => buildFirstCharacterSkillOriginDistribution(mergedDamageDetails);

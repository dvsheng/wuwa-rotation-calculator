import {
  arrange,
  desc,
  filter,
  groupBy,
  map,
  sum,
  summarize,
  tidy,
} from '@tidyjs/tidy';
import type { PropsWithChildren } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Grid, Stack } from '@/components/ui/layout';
import { useCharacterByTeamSlotNumber } from '@/hooks/useCharacter';
import type {
  RotationCalculationResult,
  RotationResultMergedDamageDetail,
} from '@/hooks/useRotationCalculation';
import { getChartColorByIndex } from '@/lib/utils';

import { CharacterDamageSummaryRow } from './CharacterDamageSummaryRow';
import { DistributionPieChart } from './DistributionPieChart';
import type { DistributionChartDatum } from './result-breakdown.types';
import { substatSensitivityChartData } from './sensitivity-pipelines';
import { SubstatSensitivityBarChart } from './SubstatSensitivityBarChart';

// ---------------------------------------------------------------------------
// Chart-specific pipeline: damageDistribution
// ---------------------------------------------------------------------------

type DamageRow = RotationResultMergedDamageDetail;

interface DamageDistributionRow {
  groupValue: string;
  damage: number;
  percentage: number;
}

const damageDistribution = <TKey extends keyof DamageRow & string>(
  data: Array<DamageRow>,
  groupKey: TKey,
  filterFunction?: (d: DamageRow) => boolean,
  topN?: number,
): Array<DamageDistributionRow> => {
  const filtered = filterFunction ? tidy(data, filter(filterFunction)) : data;

  const totalDamage =
    tidy(filtered, summarize({ damage: sum('damage') }))[0]?.damage ?? 0;

  const grouped = tidy(
    filtered,
    groupBy(groupKey, [summarize({ damage: sum('damage') })]),
    arrange([desc('damage')]),
    map((row: Record<string, unknown>) => ({
      groupValue: String(row[groupKey]),
      damage: row.damage as number,
    })),
  );

  const cutoff = topN ?? grouped.length;
  const top = grouped.slice(0, cutoff);
  const rest = grouped.slice(cutoff);
  const otherDamage = rest.reduce((accumulator, r) => accumulator + r.damage, 0);
  const rows =
    otherDamage > 0 ? [...top, { groupValue: 'Other', damage: otherDamage }] : top;

  return rows.map((row) => ({
    ...row,
    percentage: totalDamage === 0 ? 0 : (row.damage / totalDamage) * 100,
  }));
};

const toPieChartData = (
  data: Array<DamageDistributionRow>,
): Array<DistributionChartDatum> =>
  data.map((row, index) => ({
    id: row.groupValue,
    label: row.groupValue,
    value: row.damage,
    percentage: row.percentage,
    fill: getChartColorByIndex(index),
  }));

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RotationSummaryTabProperties {
  result: RotationCalculationResult;
}

const SummaryChartCard = ({
  title,
  description,
  children,
}: PropsWithChildren<{
  title: string;
  description: string;
}>) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>{children} </CardContent>
  </Card>
);

const isCharacterZero = (d: DamageRow) => d.characterIndex === 0;

export const RotationSummaryTab = ({ result }: RotationSummaryTabProperties) => {
  const substatChartData = substatSensitivityChartData(result.sensitivityAnalysis);
  const character = useCharacterByTeamSlotNumber(0);
  if (!character) {
    return;
  }
  const skillOriginData = toPieChartData(
    damageDistribution(result.mergedDamageDetails, 'originType', isCharacterZero, 5),
  );
  const damageTypeData = toPieChartData(
    damageDistribution(result.mergedDamageDetails, 'damageType', isCharacterZero, 4),
  );

  return (
    <Stack gap="component" className="min-h-0 flex-1 overflow-y-auto">
      <Grid gap="component" className="grid-cols-2">
        <SummaryChartCard
          title="Damage by Character"
          description="Share of total rotation damage contributed by each character."
        >
          <CharacterDamageSummaryRow
            mergedDamageDetails={result.mergedDamageDetails}
            totalDamage={result.totalDamage}
          />
        </SummaryChartCard>
        <SummaryChartCard
          title="Substat Value"
          description={`Estimated damage increase for ${character.name} by substat`}
        >
          <SubstatSensitivityBarChart data={substatChartData} />
        </SummaryChartCard>

        <SummaryChartCard
          title="Skill Origin Distribution"
          description={`${character.name}'s damage distribution by talent nodes.`}
        >
          <DistributionPieChart
            data={skillOriginData}
            emptyTitle="Skill Origin Distribution"
            emptyDescription="Team slot 1 has no recorded damage in this rotation."
          />
        </SummaryChartCard>

        <SummaryChartCard
          title="Damage by Type"
          description={`${character.name}'s damage distribution by damage type.`}
        >
          <DistributionPieChart
            data={damageTypeData}
            emptyTitle="Damage Type Breakdown"
            emptyDescription="No damage type data is available for this rotation."
          />
        </SummaryChartCard>
      </Grid>
    </Stack>
  );
};

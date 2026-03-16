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
import type { RotationCalculationResult } from '@/hooks/useRotationCalculation';
import { getChartColorByIndex } from '@/lib/utils';

import { CharacterDamageSummaryRow } from './CharacterDamageSummaryRow';
import { DistributionPieChart } from './DistributionPieChart';
import { getRotationResultBreakdown } from './get-rotation-result-breakdown';
import type { DistributionChartDatum } from './result-breakdown.types';
import { SubstatSensitivityBarChart } from './SubstatSensitivityBarChart';
import { useSensitivityAnalysisBreakdown } from './useSensitivityAnalysisBreakdown';

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

const toPieChartData = (
  data: ReturnType<typeof getRotationResultBreakdown>,
): Array<DistributionChartDatum> => {
  return data.map((row, index) => ({
    id: row.groupValue,
    label: row.groupValue,
    value: row.damage,
    percentage: row.percentage,
    fill: getChartColorByIndex(index),
  }));
};

export const RotationSummaryTab = ({ result }: RotationSummaryTabProperties) => {
  const { substatChartData } = useSensitivityAnalysisBreakdown(
    result.sensitivityAnalysis,
  );
  const character = useCharacterByTeamSlotNumber(0);
  if (!character) {
    return;
  }
  const skillOriginData = toPieChartData(
    getRotationResultBreakdown({
      data: result.mergedDamageDetails,
      groupKey: 'originType',
      characterIndex: 0,
      bucketBelow: 5,
    }),
  );
  const damageTypeData = toPieChartData(
    getRotationResultBreakdown({
      data: result.mergedDamageDetails,
      groupKey: 'damageType',
      characterIndex: 0,
      bucketBelow: 4,
    }),
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
          title="Skill Origin Distribution"
          description={
            character.name
              ? `${character.name}'s damage split by skill origin type.`
              : 'Team slot 1 damage split by skill origin type.'
          }
        >
          <DistributionPieChart
            data={skillOriginData}
            emptyTitle="Skill Origin Distribution"
            emptyDescription="Team slot 1 has no recorded damage in this rotation."
          />
        </SummaryChartCard>

        <SummaryChartCard
          title="Damage by Type"
          description="Total rotation damage split by damage type across all characters."
        >
          <DistributionPieChart
            data={damageTypeData}
            emptyTitle="Damage Type Breakdown"
            emptyDescription="No damage type data is available for this rotation."
          />
        </SummaryChartCard>

        <SummaryChartCard
          title="Substat Sensitivity"
          description="Damage delta for each +1 substat-roll scenario on the first character."
        >
          <SubstatSensitivityBarChart data={substatChartData} />
        </SummaryChartCard>
      </Grid>
    </Stack>
  );
};

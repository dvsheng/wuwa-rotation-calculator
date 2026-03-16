import type { PropsWithChildren } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Grid, Stack } from '@/components/ui/layout';
import type { RotationCalculationResult } from '@/hooks/useRotationCalculation';

import { CharacterDamageSummaryRow } from './CharacterDamageSummaryRow';
import { DistributionPieChart } from './DistributionPieChart';
import { SubstatSensitivityBarChart } from './SubstatSensitivityBarChart';
import { useDamageTypeBreakdown } from './useDamageTypeBreakdown';
import { useFirstCharacterSkillOriginDistribution } from './useFirstCharacterSkillOriginDistribution';
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

export const RotationSummaryTab = ({ result }: RotationSummaryTabProperties) => {
  const { substatChartData } = useSensitivityAnalysisBreakdown(
    result.sensitivityAnalysis,
  );
  const { characterName, chartData: originDistributionChartData } =
    useFirstCharacterSkillOriginDistribution(result.mergedDamageDetails);
  const { chartData: damageTypeChartData } = useDamageTypeBreakdown(
    result.mergedDamageDetails,
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
            characterName
              ? `${characterName}'s damage split by skill origin type.`
              : 'Team slot 1 damage split by skill origin type.'
          }
        >
          <DistributionPieChart
            data={originDistributionChartData}
            emptyTitle="Skill Origin Distribution"
            emptyDescription="Team slot 1 has no recorded damage in this rotation."
          />
        </SummaryChartCard>

        <SummaryChartCard
          title="Damage by Type"
          description="Total rotation damage split by damage type across all characters."
        >
          <DistributionPieChart
            data={damageTypeChartData}
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

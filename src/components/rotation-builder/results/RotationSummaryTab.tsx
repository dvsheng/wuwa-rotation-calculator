import type { PropsWithChildren } from 'react';

import { Grid, Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import type { RotationCalculationResult } from '@/hooks/useRotationCalculation';

import { DistributionPieChart } from './DistributionPieChart';
import { SubstatSensitivityBarChart } from './SubstatSensitivityBarChart';
import { useCharacterBreakdown } from './useCharacterBreakdown';
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
  <Stack gap="component" className="bg-card rounded-lg border p-4">
    <Stack gap="trim">
      <Text variant="title">{title}</Text>
      <Text variant="bodySm" tone="muted">
        {description}
      </Text>
    </Stack>
    {children}
  </Stack>
);

export const RotationSummaryTab = ({ result }: RotationSummaryTabProperties) => {
  const { chartData: characterChartData } = useCharacterBreakdown({
    mergedDamageDetails: result.mergedDamageDetails,
    totalDamage: result.totalDamage,
  });
  const { substatChartData } = useSensitivityAnalysisBreakdown(
    result.sensitivityAnalysis,
  );
  const { characterName, chartData: originDistributionChartData } =
    useFirstCharacterSkillOriginDistribution(result.mergedDamageDetails);

  return (
    <Stack gap="component" className="min-h-0 flex-1 overflow-y-auto">
      <Grid gap="component" className="grid-cols-2">
        <SummaryChartCard
          title="Damage by Character"
          description="Share of total rotation damage contributed by each character."
        >
          <DistributionPieChart
            data={characterChartData}
            emptyTitle="Character Breakdown"
            emptyDescription="No character damage data is available for this rotation."
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
      </Grid>

      <SummaryChartCard
        title="Substat Sensitivity"
        description="Damage delta for each +1 substat-roll scenario on the first character."
      >
        <SubstatSensitivityBarChart data={substatChartData} />
      </SummaryChartCard>
    </Stack>
  );
};

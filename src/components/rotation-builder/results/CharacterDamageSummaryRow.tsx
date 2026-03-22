import { CharacterIconDisplay } from '@/components/common/CharacterIcon';
import { Grid, Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import type { RotationResultMergedDamageDetail } from '@/hooks/useRotationCalculation';

import { characterBreakdown } from './result-pipelines';

interface CharacterDamageSummaryRowProperties {
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>;
  totalDamage: number;
}

export const CharacterDamageSummaryRow = ({
  mergedDamageDetails,
}: CharacterDamageSummaryRowProperties) => {
  const data = characterBreakdown(mergedDamageDetails);
  return (
    <Grid className="grid-cols-3">
      {data.map((row) => (
        <Stack key={row.characterName} align="center" justify="start" gap="component">
          <CharacterIconDisplay url={row.iconUrl} className="p-inset w-full" />
          <Text variant="label" className="truncate">
            {row.characterName}
          </Text>
          <Text as="p" variant="body" tabular={true} className="text-primary font-mono">
            {Math.round(row.totalDamage).toLocaleString()}
          </Text>
          <Text as="p" variant="bodySm" tabular={true} tone="muted">
            {row.pctOfTotal.toFixed(1)}% of team
          </Text>
        </Stack>
      ))}
    </Grid>
  );
};

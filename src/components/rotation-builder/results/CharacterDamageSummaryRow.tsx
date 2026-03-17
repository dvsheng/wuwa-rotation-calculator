import { CharacterIconDisplay } from '@/components/common/CharacterIcon';
import { Row, Stack } from '@/components/ui/layout';
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

  if (data.length === 0) {
    return (
      <Stack align="center" className="h-24 justify-center rounded-lg border">
        <Text variant="bodySm" tone="muted">
          No character damage data available.
        </Text>
      </Stack>
    );
  }

  return (
    <Row gap="component" justify="center" className="py-4">
      {data.map((row) => (
        <Stack
          key={row.characterName}
          align="center"
          gap="component"
          className="flex-1"
        >
          <CharacterIconDisplay url={row.iconUrl} className="size-28 shrink-0" />
          <Stack align="center" gap="trim">
            <Text variant="label" className="max-w-full truncate">
              {row.characterName}
            </Text>
            <Text
              as="p"
              variant="body"
              tabular={true}
              className="text-primary font-mono"
            >
              {Math.round(row.totalDamage).toLocaleString()}
            </Text>
            <Text
              as="p"
              variant="bodySm"
              tabular={true}
              tone="muted"
              className="font-mono"
            >
              {row.pctOfTotal.toFixed(1)}% of team
            </Text>
          </Stack>
        </Stack>
      ))}
    </Row>
  );
};

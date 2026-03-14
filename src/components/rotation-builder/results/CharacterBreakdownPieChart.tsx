import { CharacterIconDisplay } from '@/components/common/CharacterIcon';
import { Row, Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';

import type { CharacterBreakdownRow } from './character-breakdown.types';
import { toDisplayName } from './character-breakdown.types';
import { DistributionPieChart } from './DistributionPieChart';
import { getChartColor } from './result-chart.utilities';

export const CharacterBreakdownPieChart = ({
  selectedCharacter,
}: {
  selectedCharacter: CharacterBreakdownRow | undefined;
}) => {
  const selectedCharacterPieData =
    selectedCharacter?.damageTypes.map((entry, index) => ({
      id: entry.damageType,
      label: toDisplayName(entry.damageType),
      value: entry.damage,
      percentage: entry.pctOfCharacter,
      fill: getChartColor(index),
    })) ?? [];

  if (!selectedCharacter) {
    return (
      <Stack align="center" className="h-full justify-center">
        <Text variant="heading">Character Breakdown</Text>
        <Text variant="bodySm" tone="muted">
          Click the info icon to view a character&apos;s damage-type pie chart.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack className="h-full min-h-0">
      <Row align="center" gap="tight">
        <CharacterIconDisplay url={selectedCharacter.iconUrl} size="small" />
        <Text variant="heading">{selectedCharacter.characterName}</Text>
      </Row>
      <DistributionPieChart
        data={selectedCharacterPieData}
        emptyTitle="Character Breakdown"
        emptyDescription="Click the info icon to view a character's damage-type pie chart."
      />
    </Stack>
  );
};

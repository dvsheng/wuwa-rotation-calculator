import { Pie, PieChart } from 'recharts';

import { CharacterIconDisplay } from '@/components/common/CharacterIcon';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Row, Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';

import { toDisplayName } from './character-breakdown.types';
import type { CharacterBreakdownRow } from './character-breakdown.types';

interface CharacterBreakdownPieChartProperties {
  selectedCharacter: CharacterBreakdownRow | undefined;
}

const chartColorByIndex = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export const CharacterBreakdownPieChart = ({
  selectedCharacter,
}: CharacterBreakdownPieChartProperties) => {
  const selectedCharacterPieData =
    selectedCharacter?.damageTypes.map((entry, index) => ({
      ...entry,
      label: toDisplayName(entry.damageType),
      fill: chartColorByIndex[index % chartColorByIndex.length],
    })) ?? [];
  const selectedCharacterChartConfig = Object.fromEntries(
    selectedCharacterPieData.map((entry) => [
      entry.damageType,
      {
        label: entry.label,
        color: entry.fill,
      },
    ]),
  ) satisfies ChartConfig;

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
      <ChartContainer
        config={selectedCharacterChartConfig}
        className="flex aspect-square w-full items-center justify-center"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                hideIndicator
                formatter={(value, _name, item) => {
                  const payload = item.payload as {
                    label: string;
                    pctOfCharacter: number;
                  };
                  return (
                    <Row justify="between" fullWidth>
                      <Text as="span" variant="caption" tone="muted">
                        {payload.label}
                      </Text>
                      <Text
                        as="span"
                        variant="caption"
                        tone="muted"
                        tabular={true}
                        className="font-mono"
                      >
                        {Math.round(Number(value)).toLocaleString()} (
                        {payload.pctOfCharacter.toFixed(1)}%)
                      </Text>
                    </Row>
                  );
                }}
              />
            }
          />
          <Pie
            data={selectedCharacterPieData}
            dataKey="damage"
            nameKey="label"
            strokeWidth={2}
          />
        </PieChart>
      </ChartContainer>
    </Stack>
  );
};

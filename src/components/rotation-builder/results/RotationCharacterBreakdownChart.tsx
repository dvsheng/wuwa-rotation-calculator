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

import type { AttackGroup } from './RotationAttackDataTable';

const chartConfig = {
  damage: {
    label: 'Damage',
  },
} satisfies ChartConfig;

interface CharacterDamageBreakdownEntry {
  character: string;
  damage: number;
  pct: number;
  fill: string;
  iconUrl?: string;
}

interface RotationCharacterBreakdownChartProperties {
  attackGroups: Array<AttackGroup>;
  totalDamage: number;
}

const chartColorByIndex = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const buildCharacterDamageBreakdown = ({
  attackGroups,
  totalDamage,
}: RotationCharacterBreakdownChartProperties): Array<CharacterDamageBreakdownEntry> => {
  const damageByCharacter = new Map<string, { damage: number; iconUrl?: string }>();

  for (const group of attackGroups) {
    const existing = damageByCharacter.get(group.characterName);
    if (existing) {
      existing.damage += group.totalDamage;
      if (!existing.iconUrl && group.attack?.characterIconUrl) {
        existing.iconUrl = group.attack.characterIconUrl;
      }
      continue;
    }

    damageByCharacter.set(group.characterName, {
      damage: group.totalDamage,
      iconUrl: group.attack?.characterIconUrl,
    });
  }

  return [...damageByCharacter.entries()]
    .toSorted(([, itemA], [, itemB]) => itemB.damage - itemA.damage)
    .map(([character, item], index) => ({
      character,
      damage: item.damage,
      pct: totalDamage > 0 ? (item.damage / totalDamage) * 100 : 0,
      fill: chartColorByIndex[index % chartColorByIndex.length],
      iconUrl: item.iconUrl,
    }));
};

export const RotationCharacterBreakdownChart = ({
  attackGroups,
  totalDamage,
}: RotationCharacterBreakdownChartProperties) => {
  const data = buildCharacterDamageBreakdown({ attackGroups, totalDamage });

  if (data.length === 0) {
    return (
      <Stack className="h-full w-full items-center justify-center">
        <Text variant="heading">No Chart Data</Text>
        <Text variant="small">
          Run a calculation with damage instances to display a breakdown.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack>
      <ChartContainer
        config={chartConfig}
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
                  const payload = item.payload as CharacterDamageBreakdownEntry;
                  return (
                    <Row justify="between" gap="compact" className="w-full">
                      <CharacterIconDisplay url={payload.iconUrl} />
                      <Text as="span" variant="caption" className="truncate">
                        {payload.character}
                      </Text>
                      <Text
                        as="span"
                        variant="caption"
                        className="font-mono tabular-nums"
                      >
                        {Math.round(Number(value)).toLocaleString()} (
                        {payload.pct.toFixed(1)}%)
                      </Text>
                    </Row>
                  );
                }}
              />
            }
          />
          <Pie data={data} dataKey="damage" nameKey="character" strokeWidth={2} />
        </PieChart>
      </ChartContainer>

      <Stack className="min-h-0 overflow-y-auto pt-2">
        {data.map((entry) => (
          <Row key={entry.character} justify="between" className="py-1">
            <Row align="center" gap="tight" className="min-w-0">
              <CharacterIconDisplay url={entry.iconUrl} size="small" />
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-xs"
                style={{ backgroundColor: entry.fill }}
              />
              <Text as="span" variant="small" className="truncate">
                {entry.character}
              </Text>
            </Row>
            <Text as="span" variant="small" className="font-mono tabular-nums">
              {Math.round(entry.damage).toLocaleString()} ({entry.pct.toFixed(1)}%)
            </Text>
          </Row>
        ))}
      </Stack>
    </Stack>
  );
};

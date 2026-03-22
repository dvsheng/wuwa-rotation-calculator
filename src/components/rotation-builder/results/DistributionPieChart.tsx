import { Pie, PieChart } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Row, Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';

import type { DistributionChartDatum } from './result-breakdown.types';

interface DistributionPieChartProperties {
  data: Array<DistributionChartDatum>;
  emptyTitle: string;
  emptyDescription: string;
}

const RADIAN = Math.PI / 180;
const PIE_CHART_LABEL_OFFSET = 18;

const renderPieChartLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  payload,
}: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  payload?: DistributionChartDatum;
}) => {
  if (
    cx === undefined ||
    cy === undefined ||
    midAngle === undefined ||
    outerRadius === undefined ||
    !payload
  ) {
    return;
  }

  const radius = outerRadius + PIE_CHART_LABEL_OFFSET;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const anchor = x > cx ? 'start' : 'end';

  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor={anchor}
      dominantBaseline="central"
      className="fill-foreground text-xs"
    >
      {payload.label}: {Math.round(payload.value).toLocaleString()} (
      {payload.percentage.toFixed(1)}%)
    </text>
  );
};

export const DistributionPieChart = ({
  data,
  emptyTitle,
  emptyDescription,
}: DistributionPieChartProperties) => {
  const chartConfig = Object.fromEntries(
    data.map((entry) => [
      entry.id,
      {
        label: entry.label,
        color: entry.fill,
      },
    ]),
  );

  if (data.length === 0) {
    return (
      <Stack align="center" className="h-72 justify-center rounded-lg border">
        <Text variant="heading">{emptyTitle}</Text>
        <Text variant="bodySm" tone="muted">
          {emptyDescription}
        </Text>
      </Stack>
    );
  }

  return (
    <ChartContainer config={chartConfig}>
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              hideIndicator
              formatter={(value, _name, item) => {
                const payload = item.payload as DistributionChartDatum;
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
                      {payload.percentage.toFixed(1)}%)
                    </Text>
                  </Row>
                );
              }}
            />
          }
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="id"
          strokeWidth={2}
          labelLine={true}
          label={renderPieChartLabel}
        />
      </PieChart>
    </ChartContainer>
  );
};

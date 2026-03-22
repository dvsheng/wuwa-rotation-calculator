import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';

import type { SensitivityChartDatum } from './result-breakdown.types';
import { formatPercentDelta } from './result-chart.utilities';

interface SubstatSensitivityBarChartProperties {
  data: Array<SensitivityChartDatum>;
}

export const SubstatSensitivityBarChart = ({
  data,
}: SubstatSensitivityBarChartProperties) => {
  if (data.length === 0) {
    return (
      <Stack align="center" className="min-h-72 justify-center rounded-lg border">
        <Text variant="heading">Substat Sensitivity</Text>
        <Text variant="bodySm" tone="muted">
          No substat sensitivity scenarios are available for this rotation.
        </Text>
      </Stack>
    );
  }
  const trimmedData = data.slice(0, 6);
  return (
    <ChartContainer
      config={{
        value: {
          label: '% Damage Increase',
          color: 'var(--chart-1)',
        },
      }}
    >
      <BarChart data={trimmedData} layout="vertical">
        <CartesianGrid horizontal={false} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatPercentDelta(Number(value))}
        />
        <YAxis type="category" dataKey="shortLabel" tickLine={false} axisLine={false} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(_, payload) => payload[0]?.payload.label}
              formatter={(value, _name, item) => {
                const payload = item.payload as SensitivityChartDatum;
                return (
                  <Stack gap="trim">
                    <Text variant="caption" tone="muted">
                      {payload.description}
                    </Text>
                    <Text variant="caption" tabular={true} className="font-mono">
                      {formatPercentDelta(Number(value))}
                    </Text>
                  </Stack>
                );
              }}
            />
          }
        />
        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
};

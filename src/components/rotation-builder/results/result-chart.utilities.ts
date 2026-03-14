export const chartColorByIndex = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const;

export const getChartColor = (index: number) =>
  chartColorByIndex[index % chartColorByIndex.length];

export const formatSignedDamage = (value: number) => {
  const rounded = Math.round(value);
  return `${rounded >= 0 ? '+' : ''}${rounded.toLocaleString()}`;
};

export const formatPercentDelta = (value: number) => {
  const percentValue = value * 100;
  return `${percentValue >= 0 ? '+' : ''}${percentValue.toFixed(2)}%`;
};

export const truncateChartLabel = (value: string, maximumLength = 20) =>
  value.length > maximumLength
    ? `${value.slice(0, Math.max(0, maximumLength - 1))}...`
    : value;

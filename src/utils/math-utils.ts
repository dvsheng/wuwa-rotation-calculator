import type {
  LinearParameterizedNumber,
  LinearScalingParameterConfig,
} from '@/types/parameterized-number';

export const calculateParameterizedNumberValue = <T extends string>(
  parameterizedNumber: LinearParameterizedNumber<T>,
  parameters: Partial<Record<T, number>>,
): number => {
  const { parameterConfigs, offset = 0, minimum, maximum } = parameterizedNumber;

  const total = (
    Object.entries(parameterConfigs) as Array<[T, LinearScalingParameterConfig]>
  ).reduce((sum, [key, parameterConfig]) => {
    if (!parameters[key]) return 0;
    const parameterMinimum = parameterConfig.minimum ?? 0;
    const parameterMaximum = parameterConfig.maximum ?? Infinity;
    const statValue = Math.max(
      Math.min(parameters[key], parameterMaximum) - parameterMinimum,
      0,
    );
    const parameterContribution = parameterConfig.scale * statValue;
    return sum + parameterContribution;
  }, offset);
  if (minimum !== undefined && total < minimum) return minimum;
  if (maximum !== undefined && total > maximum) return maximum;
  return total;
};

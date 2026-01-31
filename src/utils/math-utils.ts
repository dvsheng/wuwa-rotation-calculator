import { clamp } from 'es-toolkit/math';

import type { LinearParameterizedNumber, LinearScalingParameterConfig } from '@/types';

export const calculateParameterizedNumberValue = <T extends string>(
  parameterizedNumber: LinearParameterizedNumber<T>,
  parameters: Partial<Record<T, number>>,
): number => {
  const {
    parameterConfigs,
    offset = 0,
    minimum = 0,
    maximum = Infinity,
  } = parameterizedNumber;

  const total = (
    Object.entries(parameterConfigs) as Array<[T, LinearScalingParameterConfig]>
  ).reduce((sum, [key, parameterConfig]) => {
    if (!parameters[key]) return 0;
    const parameterMinimum = parameterConfig.minimum ?? 0;
    const parameterMaximum = parameterConfig.maximum ?? Infinity;
    const statValue = Math.max(
      clamp(parameters[key], parameterMaximum) - parameterMinimum,
      0,
    );
    const parameterContribution = parameterConfig.scale * statValue;
    return sum + parameterContribution;
  }, offset);
  return clamp(total, minimum, maximum);
};

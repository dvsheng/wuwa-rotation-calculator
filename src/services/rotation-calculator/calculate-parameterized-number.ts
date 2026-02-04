import { clamp } from 'es-toolkit/math';

import type {
  ConditionalBonus,
  LinearParameterizedNumber,
  LinearScalingParameterConfig,
} from '@/types';

/**
 * Evaluates a single conditional bonus.
 */
const evaluateConditional = <T extends string>(
  conditional: ConditionalBonus<T>,
  parameters: Partial<Record<T, number>>,
): number => {
  const parameterValue = parameters[conditional.parameter] ?? 0;
  const { operator, threshold, valueIfTrue, valueIfFalse = 0 } = conditional;

  let conditionMet = false;
  switch (operator) {
    case '>=': {
      conditionMet = parameterValue >= threshold;
      break;
    }
    case '>': {
      conditionMet = parameterValue > threshold;
      break;
    }
    case '<=': {
      conditionMet = parameterValue <= threshold;
      break;
    }
    case '<': {
      conditionMet = parameterValue < threshold;
      break;
    }
    case '==': {
      conditionMet = parameterValue === threshold;
      break;
    }
  }

  return conditionMet ? valueIfTrue : valueIfFalse;
};

export const calculateParameterizedNumberValue = <T extends string>(
  parameterizedNumber: LinearParameterizedNumber<T>,
  parameters: Partial<Record<T, number>>,
): number => {
  const {
    parameterConfigs,
    offset = 0,
    minimum = 0,
    maximum = Infinity,
    conditionals = [],
  } = parameterizedNumber;

  // Calculate linear scaling contributions
  const linearTotal = (
    Object.entries(parameterConfigs) as Array<[T, LinearScalingParameterConfig]>
  ).reduce((sum, [key, parameterConfig]) => {
    if (!parameters[key]) return sum;
    const parameterMinimum = parameterConfig.minimum ?? 0;
    const parameterMaximum = parameterConfig.maximum ?? Infinity;
    const statValue = Math.max(
      clamp(parameters[key], parameterMaximum) - parameterMinimum,
      0,
    );
    const parameterContribution = parameterConfig.scale * statValue;
    return sum + parameterContribution;
  }, offset);

  // Calculate conditional contributions
  const conditionalTotal = conditionals.reduce(
    (sum, conditional) => sum + evaluateConditional(conditional, parameters),
    0,
  );

  return clamp(linearTotal + conditionalTotal, minimum, maximum);
};

import { clamp } from 'es-toolkit/math';

import type { LinearParameterizedNumber, LinearScalingParameterConfig } from '@/types';

/**
 * Evaluates a single conditional bonus.
 */
const evaluateConditional = (
  parameter: LinearScalingParameterConfig,
  parameterValue: number,
): number => {
  if (!parameter.conditionalConfiguration) return 0;
  const {
    operator,
    threshold,
    valueIfTrue,
    valueIfFalse = 0,
  } = parameter.conditionalConfiguration;

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
  } = parameterizedNumber;

  // Calculate linear scaling contributions
  const linearTotal = (
    Object.entries(parameterConfigs) as Array<[T, LinearScalingParameterConfig]>
  ).reduce((sum, [key, parameterConfig]) => {
    if (!parameters[key]) return sum;
    const parameterMinimum = parameterConfig.minimum ?? 0;
    const parameterMaximum = parameterConfig.maximum ?? Infinity;
    const parameterValue = Math.max(
      clamp(parameters[key], parameterMaximum) - parameterMinimum,
      0,
    );
    const parameterContribution = parameterConfig.scale * parameterValue;
    const conditionalContribution = parameterConfig.conditionalConfiguration
      ? evaluateConditional(parameterConfig, parameters[key])
      : 0;
    return sum + parameterContribution + conditionalContribution;
  }, offset);

  return clamp(linearTotal, minimum, maximum);
};

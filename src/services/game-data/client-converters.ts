import { isUserParameterizedNumber } from '@/types/parameterized-number';

import type { Attack, EnrichedAttack, EnrichedBuff, Modifier } from './common-types';

/**
 * Converts a game-data Attack into a client-facing enriched Attack structure.
 */
export const toClientAttack = (
  attack: Attack,
  parentName: string,
  name: string,
): EnrichedAttack => {
  const parameters = attack.motionValues.filter(isUserParameterizedNumber).map((v) => ({
    minimum: v.minimum ?? 0,
    maximum: v.maximum ?? 100,
  }));

  return {
    id: attack.id,
    name,
    parentName,
    description: attack.description,
    parameters: parameters.length > 0 ? parameters : undefined,
  };
};

/**
 * Converts a game-data Modifier into a client-facing enriched Buff structure.
 */
export const toClientBuff = (
  modifier: Modifier,
  parentName: string,
  source: EnrichedBuff['source'],
  name: string,
): EnrichedBuff => {
  const parameters = modifier.modifiedStats
    .map((s) => s.value)
    .filter(isUserParameterizedNumber)
    .map((v) => ({
      minimum: v.minimum ?? 0,
      maximum: v.maximum ?? 100,
    }));

  return {
    id: modifier.id,
    name,
    parentName,
    description: modifier.description,
    source,
    parameters: parameters.length > 0 ? parameters : undefined,
  };
};

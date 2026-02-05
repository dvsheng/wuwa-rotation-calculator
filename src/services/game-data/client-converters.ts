import { isUserParameterizedNumber } from '@/types';

import type { Attack, ClientCapability, Modifier, Target } from './common-types';

/**
 * Converts a game-data Attack into a client-facing enriched Attack structure.
 */
export const toClientAttack = (
  attack: Attack,
  parentName: string,
  name: string,
): ClientCapability => {
  const parameters = attack.motionValues
    .filter((v) => isUserParameterizedNumber(v))
    .map((v) => ({
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
  name: string,
): ClientCapability & { target: Target } => {
  const parameters = modifier.modifiedStats
    .map((s) => s.value)
    .filter((v) => isUserParameterizedNumber(v))
    .map((v) => ({
      minimum: v.minimum ?? 0,
      maximum: v.maximum ?? 100,
    }));

  return {
    id: modifier.id,
    name,
    target: modifier.target,
    parentName,
    description: modifier.description,
    parameters: parameters.length > 0 ? parameters : undefined,
  };
};

import { isUserParameterizedNumber } from '@/types';

import type {
  Attack,
  AttackOriginType,
  ClientAttack,
  ClientModifier,
  Modifier,
} from './common-types';

/**
 * Converts a game-data Attack into a client-facing enriched Attack structure.
 */
export const toClientAttack = (attack: Attack): ClientAttack => {
  const parameters = attack.motionValues
    .filter((v) => isUserParameterizedNumber(v))
    .map((v) => ({
      minimum: v.minimum ?? 0,
      maximum: v.maximum ?? 100,
    }));

  return {
    id: attack.id,
    name: attack.name,
    parentName: attack.parentName ?? '',
    originType: attack.originType as AttackOriginType,
    description: attack.description,
    parameters: parameters.length > 0 ? parameters : undefined,
  };
};

/**
 * Converts a game-data Modifier into a client-facing enriched Buff structure.
 */
export const toClientBuff = (modifier: Modifier): ClientModifier => {
  const parameters = modifier.modifiedStats
    .map((s) => s.value)
    .filter((v) => isUserParameterizedNumber(v))
    .map((v) => ({
      minimum: v.minimum ?? 0,
      maximum: v.maximum ?? 100,
    }));

  return {
    id: modifier.id,
    name: modifier.name,
    target: modifier.target,
    parentName: modifier.parentName ?? '',
    originType: modifier.originType,
    description: modifier.description,
    parameters: parameters.length > 0 ? parameters : undefined,
  };
};

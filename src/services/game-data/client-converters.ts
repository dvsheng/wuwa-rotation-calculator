import type { Attack as ClientAttack, Buff as ClientBuff } from '@/schemas/rotation';
import { extractUserParameters } from '@/types/server/modifier';

import type { Attack, Modifiers } from './common-types';

/**
 * Converts a game-data Attack into a client-facing Attack structure.
 */
export const toClientAttack = (
  attack: Attack,
  parentName: string,
  name: string,
): Omit<ClientAttack, 'id' | 'characterName'> => {
  const parameters = attack.parameterizedMotionValues?.map((value) => ({
    maximum: value.maximum ?? 100,
    minimum: value.minimum ?? 0,
  }));
  return {
    name,
    parentName,
    description: attack.description,
    parameters,
    isParameterized: (parameters?.length ?? 0) > 0,
  };
};

/**
 * Converts a game-data Modifier into a client-facing Buff structure.
 */
export const toClientBuff = (
  modifier: Modifiers[number],
  parentName: string,
  source: NonNullable<ClientBuff['source']>,
  name: string,
): Omit<ClientBuff, 'id' | 'characterName'> => {
  const userParameters = extractUserParameters(modifier);
  const parameters = userParameters.map((p) => ({
    minimum: p.minimum ?? 0,
    maximum: p.maximum ?? 100,
  }));
  return {
    name,
    parentName,
    description: modifier.description,
    source,
    parameters,
  };
};

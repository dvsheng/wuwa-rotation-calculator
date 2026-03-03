import { uniqBy } from 'es-toolkit/array';

import type { ClientAttack, ClientModifier } from './get-entity-details.types';
import { isTuneBreakAttack } from './tune-break';
import type {
  Attack,
  AttackOriginType,
  GameDataUserParameterizedNumberNode,
  Modifier,
} from './types';

/**
 * Recursively collects all userParameterizedNumber nodes from a GameDataNumberNode tree.
 */
/**
 * Runtime type guard to check if a value is a RefineScalableNumber.
 */
export const isUserParameterizedNumber = (
  value: unknown,
): value is GameDataUserParameterizedNumberNode => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'userParameterizedNumber'
  );
};

export const collectUserParameters = (
  data: unknown,
): Array<GameDataUserParameterizedNumberNode> => {
  // Handle RefineScalableNumber - resolve to plain number
  if (isUserParameterizedNumber(data)) {
    return [data];
  }

  // Handle arrays recursively
  if (Array.isArray(data)) {
    return data.flatMap((item) => collectUserParameters(item));
  }

  // Handle objects recursively
  if (typeof data === 'object' && data !== null) {
    return Object.values(data).flatMap((value) => collectUserParameters(value));
  }
  return [];
};

const userParameterToParameter = (node: GameDataUserParameterizedNumberNode) => ({
  id: node.parameterId,
  minimum: node.minimum ?? 0,
  maximum: node.maximum ?? 100,
});

/**
 * Converts a game-data Attack into a client-facing enriched Attack structure.
 */
export const toClientAttack = (attack: Attack): ClientAttack => {
  const parameters = uniqBy(
    attack.damageInstances
      .flatMap((di) => collectUserParameters(di.motionValue))
      .map((instance) => userParameterToParameter(instance)),
    (parameter) => parameter.id,
  );

  return {
    id: attack.id,
    name: attack.name,
    parentName: attack.parentName ?? '',
    originType: attack.originType as AttackOriginType,
    isTuneBreakAttack: isTuneBreakAttack(attack),
    description: attack.description,
    parameters: parameters.length > 0 ? parameters : undefined,
    capabilityType: attack.capabilityType,
  };
};

/**
 * Converts a game-data Modifier into a client-facing enriched Buff structure.
 */
export const toClientBuff = (modifier: Modifier): ClientModifier => {
  const parameters = uniqBy(
    modifier.modifiedStats
      .flatMap((stat) => collectUserParameters(stat.value))
      .map((stat) => userParameterToParameter(stat)),
    (parameter) => parameter.id,
  );

  return {
    id: modifier.id,
    name: modifier.name,
    target: modifier.target,
    parentName: modifier.parentName ?? '',
    originType: modifier.originType,
    description: modifier.description,
    parameters: parameters.length > 0 ? parameters : undefined,
    capabilityType: modifier.capabilityType,
  };
};

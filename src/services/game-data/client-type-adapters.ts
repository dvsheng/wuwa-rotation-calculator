import { uniqBy } from 'es-toolkit/array';

import { isUserParameterizedNumber } from '@/types';

import type { ClientAttack, ClientModifier } from './get-entity-details.types';
import type { Attack, AttackOriginType, Modifier } from './types';

/**
 * Converts a game-data Attack into a client-facing enriched Attack structure.
 */
export const toClientAttack = (attack: Attack): ClientAttack => {
  const parameters = uniqBy(
    attack.damageInstances
      .map((di) => di.motionValue)
      .filter((v) => isUserParameterizedNumber(v))
      .flatMap((v) => Object.entries(v.parameterConfigs))
      .map(([id, config]) => ({
        minimum: config.minimum ?? 0,
        maximum: config.maximum ?? 100,
        id,
      })),
    (p) => p.id,
  );

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
  const parameters = uniqBy(
    Object.values(
      modifier.modifiedStats
        .map((s) => s.value)
        .filter((v) => isUserParameterizedNumber(v)),
    )
      .flatMap((v) => Object.entries(v.parameterConfigs))
      .map(([id, config]) => ({
        minimum: config.minimum ?? 0,
        maximum: config.maximum ?? 100,
        id,
      })),
    (p) => p.id,
  );

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

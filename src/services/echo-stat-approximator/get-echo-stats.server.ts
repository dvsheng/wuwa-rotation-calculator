import {
  filterAndResolveCapabilities,
  isAttack,
  listEntities,
} from '@/services/game-data';

import { deriveCharacterAttributes } from '../game-data/character-derived-attributes';
import { listEntityCapabilities } from '../game-data/list-entity-capabilities.function';

import { buildEchoPieces } from './build-echo-pieces';
import { identifyRuntimeStats } from './identify-runtime-stats';
import type { GetEchoStatsRequest, GetEchoStatsResponse } from './types';

/** Fetches a character, derives runtime stat targets, and returns approximated echo stats. */
export const getEchoStatsHandler = async (
  request: GetEchoStatsRequest,
): Promise<GetEchoStatsResponse> => {
  const capabilities = filterAndResolveCapabilities(
    await listEntityCapabilities({
      data: {
        id: request.characterId,
      },
    }),
    { sequence: 0 },
  );
  const entities = await listEntities({});
  const character = entities.find((entity) => entity.id === request.characterId);
  if (!character) throw new Error(`Character not found for ID ${request.characterId}`);
  const characterWithCapabilities = {
    ...character,
    capabilities,
  };
  const attacks = capabilities.filter((capability) => isAttack(capability));
  const derivedAttributes = deriveCharacterAttributes(attacks);
  const characterDetailsWithRuntimeStats = {
    ...characterWithCapabilities,
    derivedAttributes,
    runtimeStatTargets: identifyRuntimeStats(characterWithCapabilities),
  };

  return {
    echoes: buildEchoPieces(characterDetailsWithRuntimeStats),
  };
};

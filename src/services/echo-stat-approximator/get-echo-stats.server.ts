import { EntityType } from '@/services/game-data';
import { getEntityByIdHandler } from '@/services/game-data/get-entity-details.server';

import { buildEchoPieces } from './build-echo-pieces';
import { identifyRuntimeStats } from './identify-runtime-stats';
import type { GetEchoStatsRequest, GetEchoStatsResponse } from './types';

/** Fetches a character, derives runtime stat targets, and returns approximated echo stats. */
export const getEchoStatsHandler = async (
  request: GetEchoStatsRequest,
): Promise<GetEchoStatsResponse> => {
  const characterDetails = await getEntityByIdHandler({
    activatedSequence: 0,
    entityType: EntityType.CHARACTER,
    id: request.characterId,
  });
  const characterDetailsWithRuntimeStats = {
    ...characterDetails,
    runtimeStatTargets: identifyRuntimeStats(characterDetails),
  };

  return {
    echoes: buildEchoPieces(characterDetailsWithRuntimeStats),
  };
};

import type { EchoPiece } from '@/schemas/echo';
import type { CharacterEntity } from '@/services/game-data';
import type { CharacterStat } from '@/types';

export interface GetEchoStatsRequest {
  characterId: number;
}

export interface GetEchoStatsResponse {
  echoes: Array<EchoPiece>;
}

export interface RuntimeStatTarget {
  requiredTotal: number;
  stat: CharacterStat;
}

export type CharacterDetailsWithRuntimeStats = CharacterEntity & {
  runtimeStatTargets: Array<RuntimeStatTarget>;
};

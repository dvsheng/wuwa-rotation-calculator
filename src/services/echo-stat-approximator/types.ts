import type { EchoPiece } from '@/schemas/echo';
import type { BaseEntity } from '@/services/game-data';
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

export type CharacterDetailsWithRuntimeStats = BaseEntity & {
  runtimeStatTargets: Array<RuntimeStatTarget>;
};

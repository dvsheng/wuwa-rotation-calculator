import type { EnrichedAttack, EnrichedBuff } from '@/services/game-data/common-types';

export interface DetailedAttack extends EnrichedAttack {
  characterName: string;
  characterId: string;
}

export interface DetailedBuff extends EnrichedBuff {
  characterName: string;
  characterId: string;
}

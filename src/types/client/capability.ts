import type { ClientCapability } from '@/services/game-data/common-types';

export interface DetailedAttack extends ClientCapability {
  characterName: string;
  characterId: string;
}

export interface DetailedBuff extends ClientCapability {
  characterName: string;
  characterId: string;
}

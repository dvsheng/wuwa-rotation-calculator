import type { OriginType } from '@/services/game-data/types';

export interface MontageBullet {
  time: number;
  bulletId: string;
}

export interface MontageTag {
  name: string;
  time: number;
  duration?: number;
}

export interface MontageEvent {
  name: string;
  time: number;
}

export interface Montage {
  name: string;
  bullets: Array<MontageBullet>;
  cancelTime?: number;
  endTime?: number;
  tags: Array<MontageTag>;
  events: Array<MontageEvent>;
}

export interface CharacterMontageSkill {
  gameId: number;
  name: string;
  originType: OriginType;
}

export interface CharacterMontage {
  characterName: string;
  montageName: string;
  skillIds: Array<number>;
  skills: Array<CharacterMontageSkill>;
  montage: Montage;
}

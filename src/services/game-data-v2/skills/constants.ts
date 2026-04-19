import { OriginType, Sequence } from '@/services/game-data/types';

export const SKILL_TYPE_TO_ORIGIN_TYPE_MAP: Partial<Record<number, OriginType>> = {
  1: OriginType.NORMAL_ATTACK,
  2: OriginType.RESONANCE_SKILL,
  3: OriginType.RESONANCE_LIBERATION,
  4: OriginType.INHERENT_SKILL,
  5: OriginType.INTRO_SKILL,
  6: OriginType.FORTE_CIRCUIT,
  11: OriginType.OUTRO_SKILL,
  12: OriginType.TUNE_BREAK,
} as const;

export const CHAIN_TO_SEQUENCE_MAP: Partial<Record<number, Sequence>> = {
  1: Sequence.S1,
  2: Sequence.S2,
  3: Sequence.S3,
  4: Sequence.S4,
  5: Sequence.S5,
  6: Sequence.S6,
} as const;


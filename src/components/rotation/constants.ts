import type { AttackOriginType } from '@/services/game-data';
import { OriginType, Sequence } from '@/services/game-data';

export const ATTACK_SKILL_ORDER: Array<AttackOriginType> = [
  OriginType.NORMAL_ATTACK,
  OriginType.RESONANCE_SKILL,
  OriginType.RESONANCE_LIBERATION,
  OriginType.FORTE_CIRCUIT,
  OriginType.INTRO_SKILL,
  OriginType.OUTRO_SKILL,
  OriginType.TUNE_BREAK,
  OriginType.ECHO,
  OriginType.WEAPON,
];

const SEQUENCE_ORDER: Array<AttackOriginType> = [
  Sequence.S1,
  Sequence.S2,
  Sequence.S3,
  Sequence.S4,
  Sequence.S5,
  Sequence.S6,
];

const ATTACK_SKILL_ORDER_INDEX = new Map(
  ATTACK_SKILL_ORDER.map((skill, index) => [skill, index]),
);

const SEQUENCE_ORDER_INDEX = new Map(
  SEQUENCE_ORDER.map((skill, index) => [skill, index]),
);

export const sortAttackOrigins = (
  left: AttackOriginType,
  right: AttackOriginType,
): number => {
  return sortOriginsByAttackOrder(left, right);
};

export const sortOriginsByAttackOrder = (
  left: AttackOriginType,
  right: AttackOriginType,
): number => {
  const leftBaseIndex = ATTACK_SKILL_ORDER_INDEX.get(left);
  const rightBaseIndex = ATTACK_SKILL_ORDER_INDEX.get(right);

  if (leftBaseIndex !== undefined && rightBaseIndex !== undefined) {
    return leftBaseIndex - rightBaseIndex;
  }

  if (leftBaseIndex !== undefined) {
    return -1;
  }

  if (rightBaseIndex !== undefined) {
    return 1;
  }

  const leftSequenceIndex = SEQUENCE_ORDER_INDEX.get(left);
  const rightSequenceIndex = SEQUENCE_ORDER_INDEX.get(right);

  if (leftSequenceIndex !== undefined && rightSequenceIndex !== undefined) {
    return leftSequenceIndex - rightSequenceIndex;
  }

  if (leftSequenceIndex !== undefined) {
    return 1;
  }

  if (rightSequenceIndex !== undefined) {
    return -1;
  }

  return left.localeCompare(right);
};

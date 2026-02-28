import type { EnemyStat } from '@/types';
import { CharacterStat } from '@/types';

const RelevantCharacterStats = [
  CharacterStat.CRITICAL_DAMAGE,
  CharacterStat.CRITICAL_RATE,
  CharacterStat.DAMAGE_BONUS,
  CharacterStat.DAMAGE_MULTIPLIER_BONUS,
  CharacterStat.DEFENSE_IGNORE,
  CharacterStat.RESISTANCE_PENETRATION,
  CharacterStat.FINAL_DAMAGE_BONUS,
  CharacterStat.DAMAGE_AMPLIFICATION,
] as const;

type RelevantCharacterStats = (typeof RelevantCharacterStats)[number];

export interface CalculateDamageProperties {
  character: Record<RelevantCharacterStats | 'level', number>;
  enemy: Record<EnemyStat | 'level', number>;
  baseDamage: number;
}

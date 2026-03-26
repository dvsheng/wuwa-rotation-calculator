import type { CharacterStat, EnemyStat } from '@/types';

export interface CalculateDamageProperties {
  character: Record<CharacterStat | 'level', number>;
  enemy: Record<EnemyStat | 'level', number>;
  baseDamage: number;
}

import type { CharacterDamageInstance, Enemy, Modifier, Team } from '@/types/server';

export interface Rotation {
  team: Team;
  enemy: Enemy;
  duration: number;
  damageInstances: Array<{
    instance: CharacterDamageInstance;
    modifiers: Array<Modifier>;
  }>;
}

export interface RotationResult {
  totalDamage: number;
  damageInstances: Array<number>;
}

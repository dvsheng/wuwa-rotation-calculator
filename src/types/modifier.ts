import type { CharacterStat } from './character';
import type { EnemyStat } from './enemy';
import type { RotationRuntimeResolvableNumber } from './parameterized-number';
import type { TaggedStatValue } from './tag';

/**
 * Refers to a specific character slot index (0, 1, or 2) in the team.
 */
export type CharacterSlotNumber = 0 | 1 | 2;

/**
 * Represents a temporary or conditional modification to character stats.
 */
export interface Modifier<T = RotationRuntimeResolvableNumber | number> {
  /** Group or slots affected by this modifier. */
  targets: Array<CharacterSlotNumber | 'enemy'>;
  /** Collection of stats to modify. */
  modifiedStats: Partial<Record<CharacterStat | EnemyStat, Array<TaggedStatValue<T>>>>;
}

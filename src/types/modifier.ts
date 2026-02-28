import type { CharacterStat } from './character';
import type { EnemyStat } from './enemy';
import type { TaggedStatValue } from './tag';

/**
 * Represents a temporary or conditional modification to character stats.
 */
export interface Modifier {
  /** Group or slots affected by this modifier. */
  targets: Array<number | 'enemy'>;
  /** Collection of stats to modify. */
  modifiedStats: Partial<Record<CharacterStat | EnemyStat, Array<TaggedStatValue>>>;
}

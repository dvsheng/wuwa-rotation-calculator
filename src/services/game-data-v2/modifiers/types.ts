import type { Buff } from '../buffs';

/**
 * A collection of buffs that should have their lifecycle managed together
 */
export type Modifier = {
  buffs: Array<Buff>;
};

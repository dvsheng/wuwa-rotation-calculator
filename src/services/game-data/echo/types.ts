import type {
  Attack as ClientAttack,
  Buff as ClientModifier,
} from '@/schemas/rotation';

import type { Attack, BaseEntity, Modifiers, PermanentStats } from '../common-types';

/**
 * The core Weapon data structure used for damage calculations and rotation building.
 */
export interface Echo extends BaseEntity {
  echoSetIds: Array<string>;
  /**
   * The additional attack that an Echo adds while it is equipped in a Character's primary slot.
   */
  attack?: Attack;
  /**
   * Temporary or conditional buffs an Echo adds while it is equipped in a Character's primary slot.
   *
   */
  modifiers: Modifiers;
  /**
   * Permanent stat boosts an Echo adds while it is equipped in a Character's primary slot
   */
  stats: PermanentStats;
}

export interface GetClientEchoDetailsOutput {
  attack?: Omit<ClientAttack, 'id' | 'characterName'>;
  modifiers: Array<Omit<ClientModifier, 'id' | 'characterName'>>;
}

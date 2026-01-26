import type {
  Attack as ClientAttack,
  Buff as ClientModifier,
} from '@/schemas/rotation';

import type { BaseEntity, Capabilities } from '../common-types';

/**
 * The core Weapon data structure used for damage calculations and rotation building.
 */
export interface Echo extends BaseEntity {
  echoSetIds: Array<string>;
  capabilities: Capabilities;
}

export interface GetClientEchoDetailsOutput {
  attack?: Omit<ClientAttack, 'id' | 'characterName'>;
  modifiers: Array<Omit<ClientModifier, 'id' | 'characterName'>>;
}

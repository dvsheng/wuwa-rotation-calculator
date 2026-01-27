import type { BaseEntity, Capabilities } from '../common-types';

/**
 * The core Echo data structure used for damage calculations and rotation building.
 */
export interface Echo extends BaseEntity {
  echoSetIds: Array<string>;
  capabilities: Capabilities;
}

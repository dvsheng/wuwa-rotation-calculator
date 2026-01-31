import type { GetEntityDetailsOutput } from '../common-types';

/**
 * The core Echo data structure used for damage calculations and rotation building.
 */
export interface Echo extends GetEntityDetailsOutput {
  echoSetIds: Array<string>;
}

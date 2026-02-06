import type { GetClientEntityDetailsInput } from '@/schemas/game-data-service';

import type {
  BaseEntity,
  Capabilities,
  GetClientEntityDetailsOutput,
} from '../common-types';

/**
 * Representation of an Echo as stored in JSON files.
 */
export interface StoreEcho extends BaseEntity {
  /** IDs of the echo sets this echo belongs to */
  echoSetIds: Array<string>;
  /** Collection of attacks, modifiers, and stats for this echo */
  capabilities: Capabilities;
}

/**
 * Input for fetching client-facing echo details.
 */
export type GeEchoDetailsInput = GetClientEntityDetailsInput;

/**
 * Output format for client-facing echo details.
 */
export type GetClientEchoDetailsOutput = GetClientEntityDetailsOutput;

/**
 * Representation of an Echo returned through the internal echo details service.
 */
export type Echo = StoreEcho;

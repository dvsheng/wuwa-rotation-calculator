import type {
  AttackOriginType,
  BaseCapability,
  BaseEntity,
  OriginType,
  Target,
} from './types';

/**
 * Interfaces for client-facing entity details outputs.
 */
export interface Parameter {
  id: string;
  minimum: number;
  maximum: number;
}

export interface ClientCapability extends BaseCapability {
  name: string;
  parentName: string;
  parameters?: Array<Parameter>;
}

export interface ClientAttack extends ClientCapability {
  originType: AttackOriginType;
}

export interface ClientModifier extends ClientCapability {
  originType: OriginType;
  target: Target;
}

/**
 * Base output format for client-facing entity details.
 */
export interface GetClientEntityDetailsResponse {
  id: number;
  name: string;
  /** Icon URL for this entity */
  iconUrl?: string;
  /** Active attacks for the entity */
  attacks: Array<ClientAttack>;
  /** Active modifiers for the entity */
  modifiers: Array<ClientModifier>;
  /** Whether the entity has a tuneStrainDamageBonus permanent stat */
  hasTuneStrainDamageBonus?: boolean;
}

export type GetEntityDetailsResponse = BaseEntity;

export type { GetEntityDetailsRequest } from '@/schemas/game-data-service';

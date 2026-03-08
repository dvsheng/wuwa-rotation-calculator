import type { Attack, BaseEntity, Modifier } from './types';

/**
 * Interfaces for client-facing entity details outputs.
 */
export interface Parameter {
  id: string;
  minimum: number;
  maximum: number;
}

export interface ClientFields {
  parameters?: Array<Parameter>;
}

export type ClientAttack = Attack & ClientFields;

export type ClientModifier = Modifier & ClientFields;

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
}

export type GetEntityDetailsResponse = BaseEntity;

export type { GetEntityDetailsRequest } from '@/schemas/game-data-service';

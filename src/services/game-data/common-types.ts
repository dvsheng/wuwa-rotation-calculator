import z from 'zod';

import type { Capability } from '@/schemas/rotation';
import type {
  AbilityAttribute,
  Attribute,
  CharacterStat,
  EnemyStat,
  RotationRuntimeResolvableNumber,
  Tagged,
  UserParameterizedNumber,
} from '@/types';

/**
 * Base properties for any capability (Attack, Modifier, PermanentStat)
 */
export interface BaseCapability {
  /** Unique identifier for the capability */
  id: string;
  /** Description of the capability */
  description: string;
}

/**
 * Represents a statistical bonus or property.
 */
export interface Stat extends Tagged {
  /** The specific stat being modified */
  stat: CharacterStat | EnemyStat;
  /** The value of the stat, which can be a literal number or a resolvable parameter */
  value: number | RotationRuntimeResolvableNumber | UserParameterizedNumber;
  /** Tags associated with this stat for filtering and conditional logic */
  tags: Array<string>;
}

/**
 * Internal base for permanent stats.
 */
interface PermanentStatBase extends Stat, BaseCapability {}

/**
 * A permanent stat bonus, often from passive nodes, base stats, or equipment.
 */
export type PermanentStat<T = {}> = PermanentStatBase & T;

/**
 * Defines the potential targets for a modifier.
 */
export const Target = {
  /** Applies to all characters in the current team. */
  TEAM: 'team',
  /** Applies to the enemy target. */
  ENEMY: 'enemy',
  /** Applies only to the character currently on field. */
  ACTIVE_CHARACTER: 'activeCharacter',
  SELF: 'self',
} as const;

export type Target = (typeof Target)[keyof typeof Target];

/**
 * Internal base for modifiers.
 */
interface ModifierBase extends BaseCapability {
  /** The entity this modifier applies to (e.g., Self, Team, Enemy) */
  target: Target;
  /** The list of stats modified by this effect */
  modifiedStats: Array<Stat>;
}

/**
 * A temporary or conditional effect that modifies stats.
 */
export type Modifier<T = {}> = ModifierBase & T;

/**
 * Internal base for attacks.
 */
interface AttackBase extends BaseCapability {
  /** The stat used for damage scaling (e.g., ATK, DEF, HP) */
  scalingStat: AbilityAttribute;
  /** The elemental attribute of the damage */
  attribute: Attribute;
  /** The multipliers for each level of the attack */
  motionValues: Array<number | UserParameterizedNumber>;
  /** Tags identifying the type of attack (e.g., Basic Attack, Resonance Skill) */
  tags: Array<string>;
}

/**
 * An offensive capability that deals damage based on a character's permanent stats and active modifiers.
 */
export type Attack<T = {}> = AttackBase & T;

/**
 * Container for all types of capabilities associated with an entity.
 */
export interface Capabilities<T = {}> {
  /** List of offensive capabilities */
  attacks: Array<Attack<T>>;
  /** List of temporary/conditional stat modifiers */
  modifiers: Array<Modifier<T>>;
  /** List of permanent stat bonuses */
  permanentStats: Array<PermanentStat<T>>;
}

/**
 * Base properties for game entities like Characters, Weapons, or Echoes.
 */
export interface BaseEntity {
  /** Original game ID from Hakushin */
  id: string;
  /** Unique UUID for internal tracking and identification */
  uuid: string;
  /** Name of the entity */
  name: string;
}

/**
 * Base schema for fetching an entity by its ID.
 */
export const GetEntityDetailsInputSchema = z.object({
  /** The ID of the entity to fetch */
  id: z.string(),
});

/**
 * Base input for services that fetch client-facing entity details.
 */
export type GetClientEntityDetailsInput = z.infer<typeof GetEntityDetailsInputSchema>;

/**
 * Subset of capability data intended for client-side display.
 */
export type ClientCapability = Omit<Capability, 'characterId' | 'characterName'>;

export interface ClientModifier extends ClientCapability {
  target: Target;
}

/**
 * Base output format for client-facing entity details.
 */
export interface GetClientEntityDetailsOutput {
  /** Active attacks for the entity */
  attacks: Array<ClientCapability>;
  /** Active modifiers for the entity */
  modifiers: Array<ClientModifier>;
}

import { z } from 'zod';

import type { EchoMainStatOptionType } from '@/schemas/echo';
import {
  AttackScalingProperty,
  Attribute,
  CharacterStat,
  DamageType,
  EnemyStat,
  Tag,
} from '@/types';

import type { ResolveRefineScalableNumber } from './database-type-adapters';

const USER_PARAMETER_KEYS = ['0', '1', '2'] as const;

/**
 * Entity types supported in the database
 */
export const EntityType = {
  CHARACTER: 'character',
  WEAPON: 'weapon',
  ECHO: 'echo',
  ECHO_SET: 'echo_set',
} as const;

export type EntityType = (typeof EntityType)[keyof typeof EntityType];

/**
 * Capability type enum
 */
export const CapabilityType = {
  ATTACK: 'attack',
  MODIFIER: 'modifier',
  PERMANENT_STAT: 'permanent_stat',
} as const;

export type CapabilityType = (typeof CapabilityType)[keyof typeof CapabilityType];

/**
 * The Resonance Chain sequence at which a skill or bonus is unlocked.
 */
export const Sequence = {
  S1: 's1',
  S2: 's2',
  S3: 's3',
  S4: 's4',
  S5: 's5',
  S6: 's6',
} as const;

export type Sequence = (typeof Sequence)[keyof typeof Sequence];

/**
 * Valid weapon refinement levels (1 through 5).
 */
export const RefineLevel = ['1', '2', '3', '4', '5'] as const;

export type RefineLevel = (typeof RefineLevel)[number];

/**
 * Valid set piece counts for triggering echo set effects.
 */
export const SetEffectRequirement = {
  TWO: 2,
  THREE: 3,
  FIVE: 5,
} as const;

export type SetEffectRequirement =
  (typeof SetEffectRequirement)[keyof typeof SetEffectRequirement];

/**
 * The source of a capability.
 *
 * A capability either comes from a character's abilities
 * or from external sources like weapons or echoes.
 */
export const OriginType = {
  /** Capabilities from the character's unique mechanic */
  FORTE_CIRCUIT: 'Forte Circuit',
  /** Standard weapon attacks */
  NORMAL_ATTACK: 'Normal Attack',
  /** Character's E skill */
  RESONANCE_SKILL: 'Resonance Skill',
  /** Character's R ability */
  RESONANCE_LIBERATION: 'Resonance Liberation',
  /** Attack performed when switching the character in */
  INTRO_SKILL: 'Intro Skill',
  /** Buff/Effect triggered when switching the character out */
  OUTRO_SKILL: 'Outro Skill',
  /** Passive abilities unlocked at character breakpoints */
  INHERENT_SKILL: 'Inherent Skill',
  /** Base stats of the character */
  BASE_STATS: 'Base Stats',
  /** Specialized mechanics for certain characters */
  TUNE_BREAK: 'Tune Break',
  ...Sequence,
  WEAPON: 'Weapon',
  ECHO: 'Echo',
  ECHO_SET: 'Echo Set',
} as const;

export type OriginType = (typeof OriginType)[keyof typeof OriginType];

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
 * Base properties for any capability (Attack, Modifier, PermanentStat)
 */
export interface BaseCapability {
  /** Unique identifier for the capability */
  id: number;
  /** Name of the capability */
  name: string;
  /** Where this capability originates from in an entity */
  originType: OriginType;
  /** The name of the parent skill or node (e.g., "Ground State Calibration"). */
  parentName?: string;
  /** Description of the capability */
  description?: string;
  /** Icon URL for this capability (coalesced from skill icon then entity icon) */
  iconUrl?: string;
  skillDescription?: string;
  skillId: number;
  entityId: number;
}

export interface Skill {
  id: number;
  gameId?: number;
  entityId: number;
  name: string;
  description?: string;
  iconUrl?: string;
  originType: OriginType;
}

// ============================================================================
// Tier 1 — Refine-scalable numbers
// Resolved at game-data fetch time using the weapon's refinement level.
// ============================================================================

/**
 * A number that scales linearly with weapon refinement level.
 * Resolves to: base + (refineLevel - 1) * increment
 */
export const RefineScalableNumberSchema = z
  .object({
    base: z.number(),
    increment: z.number(),
  })
  .strict();

export type RefineScalableNumber = z.infer<typeof RefineScalableNumberSchema>;

export const BaseNumberSchema = z.union([z.number(), RefineScalableNumberSchema]);

export type BaseNumber = z.infer<typeof BaseNumberSchema>;

// ============================================================================
// Tier 2 — User-parameterized numbers (DatabaseUserNumber)
// Wraps Tier 1. Resolved after the user provides parameter values via the UI.
// The minimum/maximum bounds are Tier 1 numbers (refine-scalable supported)
// and are enforced when user parameter values are resolved.
// ============================================================================

export const UserParameterizedNumberSchema = z
  .object({
    type: z.literal('userParameterizedNumber'),
    parameterId: z.enum(USER_PARAMETER_KEYS),
    scale: z.number().optional(),
    minimum: BaseNumberSchema.optional(),
    maximum: BaseNumberSchema.optional(),
  })
  .strict();

export type UserParameterizedNumber = z.infer<typeof UserParameterizedNumberSchema>;

/** A Tier-1-or-Tier-2 number: static, refine-scalable, or user-parameterized. */
export const UserResolvableNumberSchema = z.union([
  BaseNumberSchema,
  UserParameterizedNumberSchema,
]);

export type UserResolvableNumber = z.infer<typeof UserResolvableNumberSchema>;

// ============================================================================
// Tier 3 — Full expression tree (DatabaseNumberNode)
// Resolved during rotation calculation using the topological stat resolver.
// DatabaseUserNumber is used in "constant" positions (CLAMP bounds, CONDITIONAL
// threshold) so those scalars can themselves be user-parameterized.
// ============================================================================

export const StatParameterizedNumberSchema = z.object({
  type: z.literal('statParameterizedNumber'),
  stat: z.enum({ ...CharacterStat, ...EnemyStat }),
  resolveWith: z.enum(['self', 'enemy']),
});

export type StatParameterizedNumber = z.infer<typeof StatParameterizedNumberSchema>;

/**
 * Full expression tree at the game-data layer.
 * All refine-scalable numbers are plain numbers; user params and stat refs
 * are still present and resolved in subsequent pipeline steps.
 */
export type NumberNode =
  | StatParameterizedNumber
  | UserResolvableNumber
  | { type: 'sum'; operands: Array<NumberNode> }
  | { type: 'product'; operands: Array<NumberNode> }
  | {
      type: 'clamp';
      operand: NumberNode;
      minimum: NumberNode;
      maximum: NumberNode;
    }
  | {
      type: 'conditional';
      operator: '>' | '>=' | '<' | '<=';
      operand: NumberNode;
      threshold: NumberNode;
      valueIfTrue: NumberNode;
      valueIfFalse: NumberNode;
    };

export const NumberNodeSchema: z.ZodType<NumberNode> = z.lazy(() =>
  z.union([
    // Tier 2 leaf must come before the object-discriminated variants to allow
    // z.union to match plain numbers and refine-scalable numbers first.
    UserResolvableNumberSchema,
    StatParameterizedNumberSchema,
    z.object({ type: z.literal('sum'), operands: z.array(NumberNodeSchema) }),
    z.object({
      type: z.literal('product'),
      operands: z.array(NumberNodeSchema),
    }),
    z.object({
      type: z.literal('clamp'),
      operand: NumberNodeSchema,
      minimum: NumberNodeSchema,
      maximum: NumberNodeSchema,
    }),
    z.object({
      type: z.literal('conditional'),
      operand: NumberNodeSchema,
      operator: z.enum(['>', '>=', '<', '<=']),
      threshold: NumberNodeSchema,
      valueIfTrue: NumberNodeSchema,
      valueIfFalse: NumberNodeSchema,
    }),
  ]),
);

// ============================================================================
// Capability Schemas
// ============================================================================

export const AttackDamageInstanceSchema = z.object({
  // motionValue is Tier 2 only — attack coefficients are never stat-dependent.
  motionValue: UserResolvableNumberSchema,
  /** The elemental attribute of this damage instance. Always required. */
  attribute: z.enum(Attribute),
  /** The damage type for this instance (e.g. basicAttack, resonanceSkill). */
  damageType: z.enum(DamageType),
  tags: z.array(z.enum(Tag)),
  scalingStat: z.enum(AttackScalingProperty),
});

export type AttackDamageInstance = z.infer<typeof AttackDamageInstanceSchema>;

const BaseAttackDataSchema = z
  .object({
    damageInstances: z.array(AttackDamageInstanceSchema),
  })
  .strict();

export const AttackDataSchema = BaseAttackDataSchema.extend({
  type: z.literal(CapabilityType.ATTACK),
  alternativeDefinitions: z
    .partialRecord(
      z.enum(Sequence),
      BaseAttackDataSchema.partial()
        .extend({
          description: z.string().optional(),
        })
        .strict(),
    )
    .optional(),
}).strict();

export type AttackData = z.infer<typeof AttackDataSchema>;

const StatSchema = z.object({
  stat: z.enum({ ...CharacterStat, ...EnemyStat }),
  tags: z.array(z.string()),
  value: NumberNodeSchema,
});

export const PermanentStatDataSchema = StatSchema.extend({
  type: z.literal(CapabilityType.PERMANENT_STAT),
}).strict();

export type PermanentStatData = z.infer<typeof PermanentStatDataSchema>;

const BaseModifierDataSchema = z
  .object({
    modifiedStats: z.array(
      StatSchema.extend({
        target: z.enum(Target),
      }),
    ),
  })
  .strict();

export const ModifierDataSchema = BaseModifierDataSchema.extend({
  type: z.literal(CapabilityType.MODIFIER),
  alternativeDefinitions: z
    .partialRecord(
      z.enum(Sequence),
      BaseModifierDataSchema.partial()
        .extend({
          description: z.string().optional(),
        })
        .strict(),
    )
    .optional(),
}).strict();

export type ModifierData = z.infer<typeof ModifierDataSchema>;

export const CapabilityDataSchema = z.discriminatedUnion('type', [
  AttackDataSchema,
  PermanentStatDataSchema,
  ModifierDataSchema,
]);

export type CapabilityData = z.infer<typeof CapabilityDataSchema>;

/**
 * A temporary or conditional effect that modifies stats.
 */
export type Modifier<T = {}> = BaseCapability & {
  capabilityJson: ModifierData;
} & T;

/**
 * An offensive capability that deals damage based on a character's permanent stats and active modifiers.
 */
export type Attack<T = {}> = BaseCapability & { capabilityJson: AttackData } & T;

export type PermanentStat<T = {}> = BaseCapability & {
  capabilityJson: PermanentStatData;
} & T;

export type Capability<T = {}> = Attack<T> | Modifier<T> | PermanentStat<T>;

export interface CharacterDerivedAttributes {
  preferredScalingStat: 'atk' | 'def' | 'hp';
  dominantAttribute?: Attribute;
  preferredThreeCostScalingMainStat: EchoMainStatOptionType;
  preferredThreeCostAttributeMainStat?: EchoMainStatOptionType;
}

/**
 * Base properties for game entities like Characters, Weapons, or Echoes.
 */
export interface BaseEntity<T = {}> {
  /** Internal ID for the entity */
  id: number;
  /** Original game ID from Hakushin */
  gameId?: number;
  /** Name of the entity */
  name: string;
  /** Icon URL for this entity */
  iconUrl?: string;
  capabilities: Array<Capability<T>>;
}

export interface CharacterEntity<T = {}> extends BaseEntity<T> {
  derivedAttributes: CharacterDerivedAttributes;
}

export const isAttack = (capability: Capability): capability is Attack => {
  return capability.capabilityJson.type === CapabilityType.ATTACK;
};

export const isModifier = (capability: Capability): capability is Modifier => {
  return capability.capabilityJson.type === CapabilityType.MODIFIER;
};

export const isPermanentStat = (
  capability: Capability,
): capability is PermanentStat => {
  return capability.capabilityJson.type === CapabilityType.PERMANENT_STAT;
};

export const isStatParameterizedNumber = (
  value: unknown,
): value is StatParameterizedNumber =>
  typeof value === 'object' &&
  value !== null &&
  'type' in value &&
  (value as Record<string, unknown>).type === 'statParameterizedNumber' &&
  'resolveWith' in value;

export const isUserParameterizedNumber = (
  value: unknown,
): value is UserParameterizedNumber =>
  typeof value === 'object' &&
  value !== null &&
  'type' in value &&
  (value as Record<string, unknown>).type === 'userParameterizedNumber';

export const isRefineScalableNumber = (value: unknown): value is RefineScalableNumber =>
  typeof value === 'object' &&
  value !== null &&
  'base' in value &&
  'increment' in value;

export const isResolvedUserParameterizedNumber = (
  value: unknown,
): value is ResolveRefineScalableNumber<UserParameterizedNumber> =>
  isUserParameterizedNumber(value) && !isRefineScalableNumber(value);

import { z } from 'zod';

import { CapabilityType, Sequence, Target } from '@/services/game-data';
import {
  AttackScalingProperty,
  Attribute,
  CharacterStat,
  DamageType,
  EnemyStat,
  Tag,
} from '@/types';

// ============================================================================
// Tier 1 — Refine-scalable numbers
// Resolved at game-data fetch time using the weapon's refinement level.
// ============================================================================

/**
 * A number that scales linearly with weapon refinement level.
 * Resolves to: base + (refineLevel - 1) * increment
 */
export const DatabaseRefineScalableNumberSchema = z
  .object({
    base: z.number(),
    increment: z.number(),
  })
  .strict();

export type DatabaseRefineScalableNumber = z.infer<
  typeof DatabaseRefineScalableNumberSchema
>;

/** A plain number or a refine-scalable number (Tier 1). */
export const DatabaseLeafNumberSchema = z.union([
  z.number(),
  DatabaseRefineScalableNumberSchema,
]);

export type DatabaseLeafNumber = z.infer<typeof DatabaseLeafNumberSchema>;

// Keep DatabaseStaticNumber as an alias so existing references still compile.
export const DatabaseStaticNumberSchema = DatabaseLeafNumberSchema;
export type DatabaseStaticNumber = DatabaseLeafNumber;

// ============================================================================
// Tier 2 — User-parameterized numbers (DatabaseUserNumber)
// Wraps Tier 1. Resolved after the user provides parameter values via the UI.
// The minimum/maximum bounds are Tier 1 numbers (refine-scalable supported)
// and are enforced when user parameter values are resolved.
// ============================================================================

const USER_PARAMETER_KEYS = ['0', '1', '2'] as const;

export const DatabaseUserParameterizedNumberNodeSchema = z
  .object({
    type: z.literal('userParameterizedNumber'),
    parameterId: z.enum(USER_PARAMETER_KEYS),
    scale: z.number().optional(),
    minimum: DatabaseLeafNumberSchema.optional(),
    maximum: DatabaseLeafNumberSchema.optional(),
  })
  .strict();

export type DatabaseUserParameterizedNumberNode = z.infer<
  typeof DatabaseUserParameterizedNumberNodeSchema
>;

/** A Tier-1-or-Tier-2 number: static, refine-scalable, or user-parameterized. */
export const DatabaseUserNumberSchema = z.union([
  DatabaseLeafNumberSchema,
  DatabaseUserParameterizedNumberNodeSchema,
]);

export type DatabaseUserNumber = z.infer<typeof DatabaseUserNumberSchema>;

// ============================================================================
// Tier 3 — Full expression tree (DatabaseNumberNode)
// Resolved during rotation calculation using the topological stat resolver.
// DatabaseUserNumber is used in "constant" positions (CLAMP bounds, CONDITIONAL
// threshold) so those scalars can themselves be user-parameterized.
// ============================================================================

/**
 * Manual TypeScript type for the recursive DatabaseNumberNode tree.
 * z.lazy requires the TypeScript type to exist before the schema is declared.
 */
export type DatabaseNumberNode =
  | DatabaseUserNumber
  | { type: 'sum'; operands: Array<DatabaseNumberNode> }
  | { type: 'product'; operands: Array<DatabaseNumberNode> }
  | {
      type: 'clamp';
      operand: DatabaseNumberNode;
      minimum: DatabaseUserNumber;
      maximum: DatabaseUserNumber;
    }
  | {
      type: 'conditional';
      operand: DatabaseNumberNode;
      operator: '>' | '>=' | '<' | '<=';
      threshold: DatabaseUserNumber;
      valueIfTrue: DatabaseNumberNode;
      valueIfFalse: DatabaseNumberNode;
    }
  | {
      type: 'statParameterizedNumber';
      stat: CharacterStat | EnemyStat;
      resolveWith: 'self' | 'enemy';
    };

export const DatabaseNumberNodeSchema: z.ZodType<DatabaseNumberNode> = z.lazy(() =>
  z.union([
    // Tier 2 leaf must come before the object-discriminated variants to allow
    // z.union to match plain numbers and refine-scalable numbers first.
    DatabaseUserNumberSchema,
    z.object({ type: z.literal('sum'), operands: z.array(DatabaseNumberNodeSchema) }),
    z.object({
      type: z.literal('product'),
      operands: z.array(DatabaseNumberNodeSchema),
    }),
    z.object({
      type: z.literal('clamp'),
      operand: DatabaseNumberNodeSchema,
      minimum: DatabaseUserNumberSchema,
      maximum: DatabaseUserNumberSchema,
    }),
    z.object({
      type: z.literal('conditional'),
      operand: DatabaseNumberNodeSchema,
      operator: z.enum(['>', '>=', '<', '<=']),
      threshold: DatabaseUserNumberSchema,
      valueIfTrue: DatabaseNumberNodeSchema,
      valueIfFalse: DatabaseNumberNodeSchema,
    }),
    z.object({
      type: z.literal('statParameterizedNumber'),
      stat: z.enum({ ...CharacterStat, ...EnemyStat }),
      resolveWith: z.enum(['self', 'enemy']),
    }),
  ]),
);

// ============================================================================
// Capability Schemas
// ============================================================================

const DatabaseAttackDamageInstanceSchema = z.object({
  // motionValue is Tier 2 only — attack coefficients are never stat-dependent.
  motionValue: DatabaseUserNumberSchema,
  /** The elemental attribute of this damage instance. Always required. */
  attribute: z.enum(Attribute),
  /** The damage type for this instance (e.g. basicAttack, resonanceSkill). */
  damageType: z.enum(DamageType),
  tags: z.array(z.enum(Tag)),
  scalingStat: z.enum(AttackScalingProperty),
});

const DatabaseBaseAttackDataSchema = z
  .object({
    damageInstances: z.array(DatabaseAttackDamageInstanceSchema),
  })
  .strict();

export const DatabaseAttackDataSchema = DatabaseBaseAttackDataSchema.extend({
  type: z.literal(CapabilityType.ATTACK),
  alternativeDefinitions: z
    .partialRecord(
      z.enum(Sequence),
      DatabaseBaseAttackDataSchema.partial()
        .extend({
          description: z.string().optional(),
        })
        .strict(),
    )
    .optional(),
}).strict();

export type DatabaseAttackData = z.infer<typeof DatabaseAttackDataSchema>;

export const DatabasePermanentStatSchema = z
  .object({
    type: z.literal(CapabilityType.PERMANENT_STAT),
    stat: z.enum({ ...CharacterStat, ...EnemyStat }),
    tags: z.array(z.string()),
    value: DatabaseNumberNodeSchema,
  })
  .strict();

export type DatabasePermanentStatData = z.infer<typeof DatabasePermanentStatSchema>;

const DatabaseBaseModifierDataSchema = z
  .object({
    modifiedStats: z.array(
      z.object({
        target: z.enum(Target),
        stat: z.enum({ ...CharacterStat, ...EnemyStat }),
        tags: z.array(z.string()),
        value: DatabaseNumberNodeSchema,
      }),
    ),
  })
  .strict();

export const DatabaseModifierDataSchema = DatabaseBaseModifierDataSchema.extend({
  type: z.literal(CapabilityType.MODIFIER),
  alternativeDefinitions: z
    .partialRecord(
      z.enum(Sequence),
      DatabaseBaseModifierDataSchema.partial()
        .extend({
          description: z.string().optional(),
        })
        .strict(),
    )
    .optional(),
}).strict();

export type DatabaseModifierData = z.infer<typeof DatabaseModifierDataSchema>;

export const DatabaseCapabilitySchema = z.discriminatedUnion('type', [
  DatabaseAttackDataSchema,
  DatabasePermanentStatSchema,
  DatabaseModifierDataSchema,
]);

export type DatabaseCapability = z.infer<typeof DatabaseCapabilitySchema>;

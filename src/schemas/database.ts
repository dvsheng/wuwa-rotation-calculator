import { z } from 'zod';

import { CapabilityType, Sequence, Target } from '@/services/game-data';
import {
  AttackScalingProperty,
  Attribute,
  CharacterStat,
  EnemyStat,
  Tag,
} from '@/types';

// ============================================================================
// RefineScalableNumber Schema
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

export const DatabaseNumberSchema = z.union([
  z.number(),
  DatabaseRefineScalableNumberSchema,
]);

export type DatabaseNumber = z.infer<typeof DatabaseNumberSchema>;

/**
 * Conditional configuration for step function bonuses.
 */
const ConditionalConfigurationSchema = z.object({
  operator: z.enum(['>=', '>', '<=', '<', '==']),
  threshold: z.number(),
  valueIfTrue: z.number(),
  valueIfFalse: z.number().optional(),
});

/**
 * LinearScalingParameterConfig with refine-scalable numbers.
 */
const DatabaseLinearScalingParameterConfigSchema = z.object({
  scale: DatabaseNumberSchema,
  minimum: DatabaseNumberSchema.optional(),
  maximum: DatabaseNumberSchema.optional(),
  conditionalConfiguration: ConditionalConfigurationSchema.optional(),
});

/**
 * UserParameterizedNumber with refine-scalable numbers.
 */
const DatabaseBaseParameterizedNumberSchema = z.object({
  minimum: DatabaseNumberSchema.optional(),
  maximum: DatabaseNumberSchema.optional(),
  offset: DatabaseNumberSchema.optional(),
});

/**
 * RotationRuntimeResolvableNumber with refine-scalable numbers.
 */
const DatabaseRotationRuntimeResolvableNumberSchema =
  DatabaseBaseParameterizedNumberSchema.extend({
    resolveWith: z.literal('self'),
    parameterConfigs: z.partialRecord(
      z.enum(CharacterStat),
      DatabaseLinearScalingParameterConfigSchema,
    ),
  }).strict();

export type DatabaseRotationRuntimeResolvableNumber = z.infer<
  typeof DatabaseRotationRuntimeResolvableNumberSchema
>;

const DatabaseUserParameterizedResolvableNUmberSchema =
  DatabaseBaseParameterizedNumberSchema.extend({
    parameterConfigs: z.partialRecord(
      z.enum({ '0': '0', '1': '1', '2': '2' }),
      DatabaseLinearScalingParameterConfigSchema,
    ),
  }).strict();

export type DatabaseUserParameterizedResolvableNumber = z.infer<
  typeof DatabaseUserParameterizedResolvableNUmberSchema
>;

const DatabaseBaseAttackDataSchema = z
  .object({
    motionValues: z.array(
      z.union([DatabaseNumberSchema, DatabaseUserParameterizedResolvableNUmberSchema]),
    ),
    tags: z.array(z.enum(Tag)),
    attribute: z.enum(Attribute),
    scalingStat: z.enum(AttackScalingProperty),
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
    value: z.union([
      DatabaseRotationRuntimeResolvableNumberSchema,
      DatabaseNumberSchema,
    ]),
  })
  .strict();

export type DatabasePermanentStatData = z.infer<typeof DatabasePermanentStatSchema>;

const DatabaseBaseModifierDataSchema = z
  .object({
    target: z.enum(Target),
    modifiedStats: z.array(
      z.object({
        stat: z.enum({ ...CharacterStat, ...EnemyStat }),
        tags: z.array(z.string()),
        value: z.union([
          DatabaseRotationRuntimeResolvableNumberSchema,
          DatabaseUserParameterizedResolvableNUmberSchema,
          DatabaseNumberSchema,
        ]),
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

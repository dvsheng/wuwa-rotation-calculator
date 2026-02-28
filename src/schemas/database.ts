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
// Static Number Schemas
// A "static number" is fully resolved at import time — either a plain number
// or a refine-scalable number that resolves at weapon refinement time.
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

export const DatabaseStaticNumberSchema = z.union([
  z.number(),
  DatabaseRefineScalableNumberSchema,
]);

export type DatabaseStaticNumber = z.infer<typeof DatabaseStaticNumberSchema>;

// ============================================================================
// Dynamic Number Schemas
// A "dynamic number" is resolved at rotation runtime, parameterized by either
// a character stat (RotationRuntimeResolvable) or a user-supplied parameter
// (UserParameterized). Its `scale` field can itself be static or dynamic,
// so these schemas are mutually recursive with LinearScalingParameterConfig.
// ============================================================================

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
 * Manual TypeScript types for the three mutually recursive schemas below.
 * z.lazy requires an explicit ZodType<T> annotation, which in turn requires
 * the TypeScript type to exist before the schema is declared.
 */
type DatabaseLinearScalingParameterConfig = {
  scale: DatabaseStaticNumber | DatabaseDynamicNumber;
  minimum?: DatabaseStaticNumber;
  maximum?: DatabaseStaticNumber;
  conditionalConfiguration?: z.infer<typeof ConditionalConfigurationSchema>;
};

export type DatabaseRotationRuntimeResolvableNumber =
  | {
      resolveWith: 'self';
      parameterConfigs: Partial<
        Record<CharacterStat, DatabaseLinearScalingParameterConfig>
      >;
      minimum?: DatabaseStaticNumber;
      maximum?: DatabaseStaticNumber;
      offset?: DatabaseStaticNumber;
    }
  | {
      resolveWith: 'enemy';
      parameterConfigs: Partial<
        Record<EnemyStat, DatabaseLinearScalingParameterConfig>
      >;
      minimum?: DatabaseStaticNumber;
      maximum?: DatabaseStaticNumber;
      offset?: DatabaseStaticNumber;
    };

// We don't realistically ever expect a single capability to have more than
// 3 user parameters
const USER_PARAMETER_KEYS = ['0', '1', '2'] as const;

type UserParameterKey = (typeof USER_PARAMETER_KEYS)[number];

export type DatabaseUserParameterizedResolvableNumber = {
  parameterConfigs: Partial<
    Record<UserParameterKey, DatabaseLinearScalingParameterConfig>
  >;
  minimum?: DatabaseStaticNumber;
  maximum?: DatabaseStaticNumber;
  offset?: DatabaseStaticNumber;
};

export type DatabaseDynamicNumber =
  | DatabaseRotationRuntimeResolvableNumber
  | DatabaseUserParameterizedResolvableNumber;

/**
 * Constrained variants of the two dynamic number types for use in positions
 * where cross-type scale nesting is not meaningful:
 *
 * - DatabasePureUserParameterizedResolvableNumber: for motionValue — scale can
 *   only be static or another UserParameterized number.
 * - DatabasePureRotationRuntimeResolvableNumber: for permanentStat values —
 *   scale can only be static or another RotationRuntime number.
 *
 * Modifiers use the permissive DatabaseDynamicNumber (above), which retains
 * cross-type nesting support (e.g., RotationRuntime whose scale is
 * UserParameterized).
 */
type DatabasePureUserParameterizedLinearScalingParameterConfig = {
  scale: DatabaseStaticNumber | DatabasePureUserParameterizedResolvableNumber;
  minimum?: DatabaseStaticNumber;
  maximum?: DatabaseStaticNumber;
  conditionalConfiguration?: z.infer<typeof ConditionalConfigurationSchema>;
};

export type DatabasePureUserParameterizedResolvableNumber = {
  parameterConfigs: Partial<
    Record<UserParameterKey, DatabasePureUserParameterizedLinearScalingParameterConfig>
  >;
  minimum?: DatabaseStaticNumber;
  maximum?: DatabaseStaticNumber;
  offset?: DatabaseStaticNumber;
};

type DatabasePureRotationRuntimeLinearScalingParameterConfig = {
  scale: DatabaseStaticNumber | DatabasePureRotationRuntimeResolvableNumber;
  minimum?: DatabaseStaticNumber;
  maximum?: DatabaseStaticNumber;
  conditionalConfiguration?: z.infer<typeof ConditionalConfigurationSchema>;
};

export type DatabasePureRotationRuntimeResolvableNumber =
  | {
      resolveWith: 'self';
      parameterConfigs: Partial<
        Record<CharacterStat, DatabasePureRotationRuntimeLinearScalingParameterConfig>
      >;
      minimum?: DatabaseStaticNumber;
      maximum?: DatabaseStaticNumber;
      offset?: DatabaseStaticNumber;
    }
  | {
      resolveWith: 'enemy';
      parameterConfigs: Partial<
        Record<EnemyStat, DatabasePureRotationRuntimeLinearScalingParameterConfig>
      >;
      minimum?: DatabaseStaticNumber;
      maximum?: DatabaseStaticNumber;
      offset?: DatabaseStaticNumber;
    };

/**
 * LinearScalingParameterConfig. Uses z.lazy because `scale` can be a dynamic
 * number (defined below), creating a mutual recursion that must be deferred
 * until all schemas are initialized.
 */
const DatabaseLinearScalingParameterConfigSchema: z.ZodType<DatabaseLinearScalingParameterConfig> =
  z.lazy(() =>
    z.object({
      scale: z.union([DatabaseStaticNumberSchema, DatabaseDynamicNumberSchema]),
      minimum: DatabaseStaticNumberSchema.optional(),
      maximum: DatabaseStaticNumberSchema.optional(),
      conditionalConfiguration: ConditionalConfigurationSchema.optional(),
    }),
  );

const DatabaseBaseParameterizedNumberSchema = z.object({
  minimum: DatabaseStaticNumberSchema.optional(),
  maximum: DatabaseStaticNumberSchema.optional(),
  offset: DatabaseStaticNumberSchema.optional(),
});

/**
 * RotationRuntimeResolvableNumber — resolves against a character's or enemy's
 * stats at rotation calculation time, discriminated by `resolveWith`.
 */
const DatabaseRotationRuntimeResolvableNumberSchema: z.ZodType<DatabaseRotationRuntimeResolvableNumber> =
  z.discriminatedUnion('resolveWith', [
    DatabaseBaseParameterizedNumberSchema.extend({
      resolveWith: z.literal('self'),
      parameterConfigs: z.partialRecord(
        z.enum(CharacterStat),
        DatabaseLinearScalingParameterConfigSchema,
      ),
    }).strict(),
    DatabaseBaseParameterizedNumberSchema.extend({
      resolveWith: z.literal('enemy'),
      parameterConfigs: z.partialRecord(
        z.enum(EnemyStat),
        DatabaseLinearScalingParameterConfigSchema,
      ),
    }).strict(),
  ]);

/**
 * UserParameterizedResolvableNumber — resolves against a user-supplied
 * parameter at rotation calculation time.
 */
const DatabaseUserParameterizedResolvableNumberSchema: z.ZodType<DatabaseUserParameterizedResolvableNumber> =
  DatabaseBaseParameterizedNumberSchema.extend({
    parameterConfigs: z.partialRecord(
      z.enum(USER_PARAMETER_KEYS),
      DatabaseLinearScalingParameterConfigSchema,
    ),
  }).strict();

/**
 * Union of all dynamic number schemas. Use this wherever a value can be
 * resolved at rotation runtime rather than being a plain static number.
 * Cross-type scale nesting is allowed here (for modifiers).
 */
export const DatabaseDynamicNumberSchema = z.union([
  DatabaseRotationRuntimeResolvableNumberSchema,
  DatabaseUserParameterizedResolvableNumberSchema,
]);

/**
 * Pure UserParameterized schemas — scale can only be static or another
 * UserParameterized number. Used for motionValue.
 */
const DatabasePureUserParameterizedLinearScalingParameterConfigSchema: z.ZodType<DatabasePureUserParameterizedLinearScalingParameterConfig> =
  z.lazy(() =>
    z.object({
      scale: z.union([
        DatabaseStaticNumberSchema,
        DatabasePureUserParameterizedResolvableNumberSchema,
      ]),
      minimum: DatabaseStaticNumberSchema.optional(),
      maximum: DatabaseStaticNumberSchema.optional(),
      conditionalConfiguration: ConditionalConfigurationSchema.optional(),
    }),
  );

const DatabasePureUserParameterizedResolvableNumberSchema: z.ZodType<DatabasePureUserParameterizedResolvableNumber> =
  DatabaseBaseParameterizedNumberSchema.extend({
    parameterConfigs: z.partialRecord(
      z.enum(USER_PARAMETER_KEYS),
      DatabasePureUserParameterizedLinearScalingParameterConfigSchema,
    ),
  }).strict();

/**
 * Pure RotationRuntime schemas — scale can only be static or another
 * RotationRuntime number. Used for permanentStat values.
 */
const DatabasePureRotationRuntimeLinearScalingParameterConfigSchema: z.ZodType<DatabasePureRotationRuntimeLinearScalingParameterConfig> =
  z.lazy(() =>
    z.object({
      scale: z.union([
        DatabaseStaticNumberSchema,
        DatabasePureRotationRuntimeResolvableNumberSchema,
      ]),
      minimum: DatabaseStaticNumberSchema.optional(),
      maximum: DatabaseStaticNumberSchema.optional(),
      conditionalConfiguration: ConditionalConfigurationSchema.optional(),
    }),
  );

const DatabasePureRotationRuntimeResolvableNumberSchema: z.ZodType<DatabasePureRotationRuntimeResolvableNumber> =
  z.discriminatedUnion('resolveWith', [
    DatabaseBaseParameterizedNumberSchema.extend({
      resolveWith: z.literal('self'),
      parameterConfigs: z.partialRecord(
        z.enum(CharacterStat),
        DatabasePureRotationRuntimeLinearScalingParameterConfigSchema,
      ),
    }).strict(),
    DatabaseBaseParameterizedNumberSchema.extend({
      resolveWith: z.literal('enemy'),
      parameterConfigs: z.partialRecord(
        z.enum(EnemyStat),
        DatabasePureRotationRuntimeLinearScalingParameterConfigSchema,
      ),
    }).strict(),
  ]);

// ============================================================================
// Capability Schemas
// ============================================================================

const DatabaseAttackDamageInstanceSchema = z.object({
  motionValue: z.union([
    DatabaseStaticNumberSchema,
    DatabasePureUserParameterizedResolvableNumberSchema,
  ]),
  tags: z.array(z.enum(Tag)),
  scalingStat: z.enum(AttackScalingProperty),
});

const DatabaseBaseAttackDataSchema = z
  .object({
    attribute: z.enum(Attribute),
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
    value: z.union([
      DatabasePureRotationRuntimeResolvableNumberSchema,
      DatabaseStaticNumberSchema,
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
        value: z.union([DatabaseDynamicNumberSchema, DatabaseStaticNumberSchema]),
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

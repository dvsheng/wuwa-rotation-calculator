import { z } from 'zod';

import {
  CharacterStatSchema,
  EnemyStatSchema,
  SequenceSchema,
  TargetSchema,
} from './database-enums';

// ============================================================================
// RefineScalableNumber Schema
// ============================================================================

/**
 * A number that scales linearly with weapon refinement level.
 * Resolves to: base + (refineLevel - 1) * increment
 */
export const RefineScalableNumberSchema = z.object({
  base: z.number(),
  increment: z.number(),
});

// ============================================================================
// StoreNumber Schema
// ============================================================================

/**
 * A number in stored weapon data that may scale with refine level.
 * Can be either a plain number or a RefineScalableNumber.
 */
export const StoreNumberSchema = z.union([z.number(), RefineScalableNumberSchema]);

// ============================================================================
// StoreLinearScalingParameterConfig Schema
// ============================================================================

/**
 * Conditional configuration for step function bonuses.
 */
export const ConditionalConfigurationSchema = z.object({
  operator: z.enum(['>=', '>', '<=', '<', '==']),
  threshold: z.number(),
  valueIfTrue: z.number(),
  valueIfFalse: z.number().optional(),
});

/**
 * LinearScalingParameterConfig with refine-scalable numbers.
 */
export const StoreLinearScalingParameterConfigSchema = z.object({
  scale: StoreNumberSchema,
  minimum: StoreNumberSchema.optional(),
  maximum: StoreNumberSchema.optional(),
  conditionalConfiguration: ConditionalConfigurationSchema.optional(),
});

// ============================================================================
// StoreParameterizedNumber Schema
// ============================================================================

/**
 * UserParameterizedNumber with refine-scalable numbers.
 */
export const StoreParameterizedNumberSchema = z.object({
  minimum: StoreNumberSchema.optional(),
  maximum: StoreNumberSchema.optional(),
  parameterConfigs: z.record(z.string(), StoreLinearScalingParameterConfigSchema),
  offset: StoreNumberSchema.optional(),
});

// ============================================================================
// StoreRotationRuntimeResolvableNumber Schema
// ============================================================================

/**
 * RotationRuntimeResolvableNumber with refine-scalable numbers.
 */
export const StoreRotationRuntimeResolvableNumberSchema =
  StoreParameterizedNumberSchema.extend({
    resolveWith: z.literal('self'),
  });

// ============================================================================
// StoreModifierStat Schema
// ============================================================================

const hasValidAllTag = (tags: Array<string>) => {
  // If 'all' is present, it must be the only tag
  return !tags.includes('all') || tags.length === 1;
};

export const StoreModifierStatSchema = z
  .object({
    stat: z.union([CharacterStatSchema, EnemyStatSchema]),
    tags: z.array(z.string()),
    value: z.union([
      StoreNumberSchema,
      StoreParameterizedNumberSchema,
      StoreRotationRuntimeResolvableNumberSchema,
    ]),
  })
  .refine(
    (data) => hasValidAllTag(data.tags),
    "If 'all' tag is present, it must be the only tag",
  );

// ============================================================================
// Alternative Definition Schemas
// ============================================================================

/**
 * Fields that can be overridden in an attack alternative definition.
 */
export const StoreAttackAlternativeDefinitionSchema = z.object({
  description: z.string().optional(),
  motionValues: z.array(z.union([StoreNumberSchema, StoreParameterizedNumberSchema])),
  tags: z.array(z.string()).optional(),
});

/**
 * Fields that can be overridden in a modifier alternative definition.
 */
export const StoreModifierAlternativeDefinitionSchema = z.object({
  description: z.string().optional(),
  target: TargetSchema.optional(),
  modifiedStats: z.array(StoreModifierStatSchema),
});

/**
 * Alternative definitions keyed by sequence (s1-s6).
 */
export const AttackAlternativeDefinitionsSchema = z.partialRecord(
  SequenceSchema,
  StoreAttackAlternativeDefinitionSchema,
);

export const ModifierAlternativeDefinitionsSchema = z.partialRecord(
  SequenceSchema,
  StoreModifierAlternativeDefinitionSchema,
);

// ============================================================================
// Type Inference
// ============================================================================

export type RefineScalableNumber = z.infer<typeof RefineScalableNumberSchema>;
export type StoreNumber = z.infer<typeof StoreNumberSchema>;
export type ConditionalConfiguration = z.infer<typeof ConditionalConfigurationSchema>;
export type StoreLinearScalingParameterConfig = z.infer<
  typeof StoreLinearScalingParameterConfigSchema
>;
export type StoreParameterizedNumber = z.infer<typeof StoreParameterizedNumberSchema>;
export type StoreRotationRuntimeResolvableNumber = z.infer<
  typeof StoreRotationRuntimeResolvableNumberSchema
>;
export type StoreModifierStat = z.infer<typeof StoreModifierStatSchema>;
export type StoreAttackAlternativeDefinition = z.infer<
  typeof StoreAttackAlternativeDefinitionSchema
>;
export type StoreModifierAlternativeDefinition = z.infer<
  typeof StoreModifierAlternativeDefinitionSchema
>;
export type AttackAlternativeDefinitions = z.infer<
  typeof AttackAlternativeDefinitionsSchema
>;
export type ModifierAlternativeDefinitions = z.infer<
  typeof ModifierAlternativeDefinitionsSchema
>;

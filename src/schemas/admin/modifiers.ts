import { z } from 'zod';

import { BaseCapabilitySchema, CreateBaseCapabilitySchema } from './base-capability';
import { OriginTypeSchema, TargetSchema } from './database-enums';
import {
  ModifierAlternativeDefinitionsSchema,
  StoreModifierStatSchema,
} from './store-types';

// ============================================================================
// Modifier Schema (Ground Truth - matches DB)
// ============================================================================

export const ModifierSchema = BaseCapabilitySchema.extend({
  // Modifier-specific fields
  target: TargetSchema,
  modifiedStats: z.array(StoreModifierStatSchema),

  // Alternative definitions for different sequences
  alternativeDefinitions: ModifierAlternativeDefinitionsSchema.nullable(),

  // Origin type
  originType: OriginTypeSchema.nullable(),
});

// ============================================================================
// Create Schema (omits auto-generated fields)
// ============================================================================

export const CreateModifierSchema = CreateBaseCapabilitySchema.extend({
  // Modifier-specific fields
  target: TargetSchema,
  modifiedStats: z.array(StoreModifierStatSchema),

  // Alternative definitions for different sequences
  alternativeDefinitions: ModifierAlternativeDefinitionsSchema.nullable(),

  // Origin type
  originType: OriginTypeSchema.nullable(),
});

// ============================================================================
// Update Schema (all fields from Modifier)
// ============================================================================

export const UpdateModifierSchema = ModifierSchema;

// ============================================================================
// Type Inference
// ============================================================================

export type Modifier = z.infer<typeof ModifierSchema>;
export type CreateModifier = z.infer<typeof CreateModifierSchema>;
export type UpdateModifier = z.infer<typeof UpdateModifierSchema>;

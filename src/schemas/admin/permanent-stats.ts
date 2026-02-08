import { z } from 'zod';

import { BaseCapabilitySchema, CreateBaseCapabilitySchema } from './base-capability';
import {
  CharacterStatSchema,
  EnemyStatSchema,
  OriginTypeSchema,
} from './database-enums';
import {
  StoreNumberSchema,
  StoreRotationRuntimeResolvableNumberSchema,
} from './store-types';

// ============================================================================
// Tag Validation
// ============================================================================

const hasValidAllTag = (tags: Array<string>) => {
  // If 'all' is present, it must be the only tag
  return !tags.includes('all') || tags.length === 1;
};

const PermanentStatTagsSchema = z
  .array(z.string())
  .refine(hasValidAllTag, "If 'all' tag is present, it must be the only tag");

// ============================================================================
// Permanent Stat Schema (Ground Truth - matches DB)
// ============================================================================

export const PermanentStatSchema = BaseCapabilitySchema.extend({
  // Permanent stat-specific fields
  stat: z.union([CharacterStatSchema, EnemyStatSchema]),
  value: z.union([StoreNumberSchema, StoreRotationRuntimeResolvableNumberSchema]),
  tags: PermanentStatTagsSchema,

  // Origin type
  originType: OriginTypeSchema.nullable(),
});

// ============================================================================
// Create Schema (omits auto-generated fields)
// ============================================================================

export const CreatePermanentStatSchema = CreateBaseCapabilitySchema.extend({
  // Permanent stat-specific fields
  stat: z.union([CharacterStatSchema, EnemyStatSchema]),
  value: z.union([StoreNumberSchema, StoreRotationRuntimeResolvableNumberSchema]),
  tags: PermanentStatTagsSchema,

  // Origin type
  originType: OriginTypeSchema.nullable(),
});

// ============================================================================
// Update Schema (all fields from PermanentStat)
// ============================================================================

export const UpdatePermanentStatSchema = PermanentStatSchema;

// ============================================================================
// Type Inference
// ============================================================================

export type PermanentStat = z.infer<typeof PermanentStatSchema>;
export type CreatePermanentStat = z.infer<typeof CreatePermanentStatSchema>;
export type UpdatePermanentStat = z.infer<typeof UpdatePermanentStatSchema>;

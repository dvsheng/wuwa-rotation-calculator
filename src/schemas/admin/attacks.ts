import { z } from 'zod';

import { Tag } from '@/types';

import { BaseCapabilitySchema, CreateBaseCapabilitySchema } from './base-capability';
import {
  AbilityAttributeSchema,
  AttackOriginTypeSchema,
  AttributeSchema,
} from './database-enums';
import {
  AttackAlternativeDefinitionsSchema,
  StoreNumberSchema,
  StoreParameterizedNumberSchema,
} from './store-types';

// ============================================================================
// Tag Validation (matches validation script rules)
// ============================================================================

// Valid attack tags: All Tag enum values except 'all'
const BaseAttackTagSchema = z.enum(Object.values(Tag).filter((tag) => tag !== 'all'));

// Mutually exclusive attack category tags - an attack must have at most one
const MUTUALLY_EXCLUSIVE_TAGS = [
  'basicAttack',
  'heavyAttack',
  'resonanceSkill',
  'resonanceLiberation',
  'echo',
] as const;

const hasAtMostOneMutuallyExclusiveTag = (tags: Array<string>) => {
  const count = tags.filter((tag) =>
    MUTUALLY_EXCLUSIVE_TAGS.includes(tag as (typeof MUTUALLY_EXCLUSIVE_TAGS)[number]),
  ).length;
  return count <= 1;
};

// Attack tags schema with validation
const AttackTagsSchema = z
  .array(BaseAttackTagSchema)
  .refine(
    hasAtMostOneMutuallyExclusiveTag,
    'Attack must have at most one of: basicAttack, heavyAttack, resonanceSkill, resonanceLiberation, echo',
  );

// ============================================================================
// Attack Schema (Ground Truth - matches DB)
// ============================================================================

export const AttackSchema = BaseCapabilitySchema.extend({
  // Attack-specific fields
  scalingStat: AbilityAttributeSchema,
  attribute: AttributeSchema,
  motionValues: z.array(z.union([StoreNumberSchema, StoreParameterizedNumberSchema])),
  tags: AttackTagsSchema,

  // Alternative definitions for different sequences
  alternativeDefinitions: AttackAlternativeDefinitionsSchema.nullable(),

  // Origin type
  originType: AttackOriginTypeSchema.nullable(),
});

// ============================================================================
// Create Schema (omits auto-generated fields)
// ============================================================================

export const CreateAttackSchema = CreateBaseCapabilitySchema.extend({
  // Attack-specific fields
  scalingStat: AbilityAttributeSchema,
  attribute: AttributeSchema,
  motionValues: z.array(z.union([StoreNumberSchema, StoreParameterizedNumberSchema])),
  tags: AttackTagsSchema,

  // Alternative definitions for different sequences
  alternativeDefinitions: AttackAlternativeDefinitionsSchema.nullable(),

  // Origin type
  originType: AttackOriginTypeSchema.nullable(),
});

// ============================================================================
// Update Schema (all fields from Attack)
// ============================================================================

export const UpdateAttackSchema = AttackSchema;

// ============================================================================
// Type Inference
// ============================================================================

export type Attack = z.infer<typeof AttackSchema>;
export type CreateAttack = z.infer<typeof CreateAttackSchema>;
export type UpdateAttack = z.infer<typeof UpdateAttackSchema>;

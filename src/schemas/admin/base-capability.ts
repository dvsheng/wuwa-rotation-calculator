import { z } from 'zod';

import { SequenceSchema } from './database-enums';

// ============================================================================
// Base Capability Schema (Ground Truth - matches DB)
// ============================================================================

/**
 * Base fields shared across all capability types (attacks, modifiers, permanentStats).
 * This represents the ground truth of what's in the database.
 */
export const BaseCapabilitySchema = z.object({
  // Primary key
  id: z.number().int().positive(),

  // Foreign key to entity
  entityId: z.number().int().positive(),

  // Metadata
  name: z.string().nullable(),
  parentName: z.string().nullable(),
  description: z.string().nullable(),
  iconPath: z.string().nullable(),

  // Character-specific: sequence unlock level (s1-s6)
  unlockedAt: SequenceSchema.nullable(),

  // Echo Set-specific: piece requirement (2, 3, 5)
  echoSetBonusRequirement: z.number().int().nullable(),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// Create Schema (omits auto-generated fields)
// ============================================================================

export const CreateBaseCapabilitySchema = BaseCapabilitySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============================================================================
// Type Inference
// ============================================================================

export type BaseCapability = z.infer<typeof BaseCapabilitySchema>;
export type CreateBaseCapability = z.infer<typeof CreateBaseCapabilitySchema>;

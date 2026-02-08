import { z } from 'zod';

import { EntityType } from '@/db/schema';

import { AttributeSchema, EntityTypeSchema } from './database-enums';

// ============================================================================
// Base Entity Schema (Ground Truth - matches DB)
// ============================================================================

const EntityBaseSchema = z.object({
  id: z.number().int().positive(),
  hakushinId: z.number().int().nullable(),
  name: z.string().min(1, 'Name is required'),
  type: EntityTypeSchema,
  iconPath: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// Entity Type-Specific Schemas (Discriminated Union)
// ============================================================================

const CharacterEntitySchema = EntityBaseSchema.extend({
  type: z.literal(EntityType.CHARACTER),
  attribute: AttributeSchema,
  echoSetIds: z.null(),
  setBonusThresholds: z.null(),
});

const WeaponEntitySchema = EntityBaseSchema.extend({
  type: z.literal(EntityType.WEAPON),
  attribute: z.null(),
  echoSetIds: z.null(),
  setBonusThresholds: z.null(),
});

const EchoEntitySchema = EntityBaseSchema.extend({
  type: z.literal(EntityType.ECHO),
  attribute: z.null(),
  echoSetIds: z.array(z.number().int()),
  setBonusThresholds: z.null(),
});

const EchoSetEntitySchema = EntityBaseSchema.extend({
  type: z.literal(EntityType.ECHO_SET),
  attribute: z.null(),
  echoSetIds: z.null(),
  setBonusThresholds: z.array(z.number().int()),
});

// ============================================================================
// Main Entity Schema (Ground Truth)
// ============================================================================

export const EntitySchema = z.discriminatedUnion('type', [
  CharacterEntitySchema,
  WeaponEntitySchema,
  EchoEntitySchema,
  EchoSetEntitySchema,
]);

// ============================================================================
// Create Schema (omits auto-generated fields)
// ============================================================================

const CreateEntityBaseSchema = EntityBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateEntitySchema = z.discriminatedUnion('type', [
  CreateEntityBaseSchema.extend({
    type: z.literal(EntityType.CHARACTER),
    attribute: AttributeSchema,
    echoSetIds: z.null(),
    setBonusThresholds: z.null(),
  }),
  CreateEntityBaseSchema.extend({
    type: z.literal(EntityType.WEAPON),
    attribute: z.null(),
    echoSetIds: z.null(),
    setBonusThresholds: z.null(),
  }),
  CreateEntityBaseSchema.extend({
    type: z.literal(EntityType.ECHO),
    attribute: z.null(),
    echoSetIds: z.array(z.number().int()),
    setBonusThresholds: z.null(),
  }),
  CreateEntityBaseSchema.extend({
    type: z.literal(EntityType.ECHO_SET),
    attribute: z.null(),
    echoSetIds: z.null(),
    setBonusThresholds: z.array(z.number().int()),
  }),
]);

// ============================================================================
// Update Schema (all fields from Entity, used for updates)
// ============================================================================

export const UpdateEntitySchema = EntitySchema;

// ============================================================================
// Type Inference
// ============================================================================

export type Entity = z.infer<typeof EntitySchema>;
export type CreateEntity = z.infer<typeof CreateEntitySchema>;
export type UpdateEntity = z.infer<typeof UpdateEntitySchema>;

import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type {
  AttackOriginType,
  OriginType,
  Sequence,
} from '@/services/game-data/types';
import { Target } from '@/services/game-data/types';
import type { AbilityAttribute, Attribute, CharacterStat, EnemyStat } from '@/types';

// ============================================================================
// Type Definitions (formerly in game-data types)
// ============================================================================

/**
 * A number that scales linearly with weapon refinement level.
 * Resolves to: base + (refineLevel - 1) * increment
 */
export interface RefineScalableNumber {
  base: number;
  increment: number;
}

/**
 * A number in stored weapon data that may scale with refine level.
 */
export type StoreNumber = number | RefineScalableNumber;

/**
 * LinearScalingParameterConfig with refine-scalable numbers.
 */
export interface StoreLinearScalingParameterConfig {
  scale: StoreNumber;
  minimum?: StoreNumber;
  maximum?: StoreNumber;
}

/**
 * UserParameterizedNumber with refine-scalable numbers.
 */
export interface StoreParameterizedNumber {
  minimum?: StoreNumber;
  maximum?: StoreNumber;
  parameterConfigs: Partial<Record<string, StoreLinearScalingParameterConfig>>;
  offset?: StoreNumber;
}

/**
 * RotationRuntimeResolvableNumber with refine-scalable numbers.
 */
export interface StoreRotationRuntimeResolvableNumber extends StoreParameterizedNumber {
  resolveWith: 'self';
}

export interface StoreModifierStat {
  stat: CharacterStat | EnemyStat;
  tags: Array<string>;
  value: StoreNumber | StoreParameterizedNumber | StoreRotationRuntimeResolvableNumber;
}

/**
 * Alternative definition types for capabilities at different sequence levels.
 * These represent the fields that can be overridden for a capability at a specific sequence.
 */

/**
 * Fields that can be overridden in an attack alternative definition.
 */
interface StoreAttackAlternativeDefinition {
  description?: string;
  motionValues: Array<StoreNumber | StoreParameterizedNumber>;
  tags?: Array<string>;
}

/**
 * Fields that can be overridden in a modifier alternative definition.
 */
interface StoreModifierAlternativeDefinition {
  description?: string;
  target?: Target;
  modifiedStats: Array<StoreModifierStat>;
}

// ============================================================================
// Database Schema Enums
// ============================================================================

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

// ============================================================================
// Database Tables
// ============================================================================

/**
 * Main entities table storing characters, weapons, echoes, and echo sets
 */
export const entities = sqliteTable('entities', {
  // Primary key - autoincrement integer
  id: integer('id').primaryKey({ autoIncrement: true }),

  // Common fields
  hakushinId: integer('hakushin_id').unique(), // Original game ID from Hakushin (null for echo sets)
  name: text('name').notNull(),
  type: text('type').notNull().$type<EntityType>(),

  // Character-specific fields
  attribute: text('attribute').$type<Attribute>(),

  // Echo-specific fields
  echoSetIds: text('echo_set_ids', { mode: 'json' }).$type<Array<number>>(),

  // Echo Set-specific fields
  setBonusThresholds: text('set_bonus_thresholds', { mode: 'json' }).$type<
    Array<number>
  >(),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Base capability fields shared across all capability types
 */
const baseCapabilityFields = {
  // Primary key
  id: integer('id').primaryKey({ autoIncrement: true }),

  // Foreign key to entity
  entityId: integer('entity_id')
    .notNull()
    .references(() => entities.id, { onDelete: 'cascade' }),

  // Metadata
  name: text('name'),
  parentName: text('parent_name'),
  description: text('description'),

  // Character-specific: sequence unlock level (s1-s6)
  unlockedAt: text('unlocked_at').$type<Sequence>(),

  // Echo Set-specific: piece requirement (2, 3, 5)
  echoSetBonusRequirement: integer('echo_set_bonus_requirement'),
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
} as const;

/**
 * Attacks table - stores offensive capabilities
 */
export const attacks = sqliteTable('attacks', {
  ...baseCapabilityFields,
  scalingStat: text('scaling_stat').notNull().$type<AbilityAttribute>(),
  attribute: text('attribute').$type<Attribute>(), // Elemental attribute
  motionValues: text('motion_values', { mode: 'json' })
    .notNull()
    .$type<Array<StoreNumber | StoreParameterizedNumber>>(), // Array of numbers or parameterized numbers
  tags: text('tags', { mode: 'json' }).notNull().$type<Array<string>>(),
  // Alternative definitions for different sequences
  alternativeDefinitions: text('alternative_definitions', {
    mode: 'json',
  }).$type<Partial<Record<Sequence, StoreAttackAlternativeDefinition>>>(),
  originType: text('origin_type').$type<AttackOriginType>(),
});

/**
 * Modifiers table - stores temporary/conditional stat modifiers
 */
export const modifiers = sqliteTable('modifiers', {
  ...baseCapabilityFields,
  target: text('target', {
    enum: Object.values(Target) as [string, ...Array<string>],
  })
    .notNull()
    .$type<Target>(),
  modifiedStats: text('modified_stats', { mode: 'json' })
    .notNull()
    .$type<Array<StoreModifierStat>>(),
  // Alternative definitions for different sequences
  alternativeDefinitions: text('alternative_definitions', {
    mode: 'json',
  }).$type<Partial<Record<Sequence, StoreModifierAlternativeDefinition>>>(),
  originType: text('origin_type').$type<OriginType>(),
});

/**
 * Permanent stats table - stores permanent stat bonuses
 */
export const permanentStats = sqliteTable('permanent_stats', {
  ...baseCapabilityFields,
  stat: text('stat').notNull().$type<CharacterStat | EnemyStat>(),
  value: text('value', { mode: 'json' })
    .notNull()
    .$type<StoreNumber | StoreRotationRuntimeResolvableNumber>(),
  tags: text('tags', { mode: 'json' }).notNull().$type<Array<string>>(),
  originType: text('origin_type').$type<OriginType>(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;

export type Attack = typeof attacks.$inferSelect;
export type NewAttack = typeof attacks.$inferInsert;

export type Modifier = typeof modifiers.$inferSelect;
export type NewModifier = typeof modifiers.$inferInsert;

export type PermanentStat = typeof permanentStats.$inferSelect;
export type NewPermanentStat = typeof permanentStats.$inferInsert;

export type StoreCapability = Attack | Modifier | PermanentStat;

// ============================================================================
// Relational Queries
// ============================================================================

export const entitiesRelations = relations(entities, ({ many }) => ({
  attacks: many(attacks),
  modifiers: many(modifiers),
  permanentStats: many(permanentStats),
}));

export const attacksRelations = relations(attacks, ({ one }) => ({
  entity: one(entities, {
    fields: [attacks.entityId],
    references: [entities.id],
  }),
}));

export const modifiersRelations = relations(modifiers, ({ one }) => ({
  entity: one(entities, {
    fields: [modifiers.entityId],
    references: [entities.id],
  }),
}));

export const permanentStatsRelations = relations(permanentStats, ({ one }) => ({
  entity: one(entities, {
    fields: [permanentStats.entityId],
    references: [entities.id],
  }),
}));

import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type {
  AttackAlternativeDefinitions,
  ModifierAlternativeDefinitions,
  StoreModifierStat,
  StoreNumber,
  StoreParameterizedNumber,
  StoreRotationRuntimeResolvableNumber,
} from '@/schemas/admin/store-types';
import type {
  AttackOriginType,
  OriginType,
  Sequence,
} from '@/services/game-data/types';
import { Target } from '@/services/game-data/types';
import type { AbilityAttribute, Attribute, CharacterStat, EnemyStat } from '@/types';

// Re-export store types for backward compatibility
export type {
  AttackAlternativeDefinitions,
  ModifierAlternativeDefinitions,
  RefineScalableNumber,
  StoreModifierStat,
  StoreNumber,
  StoreParameterizedNumber,
  StoreRotationRuntimeResolvableNumber,
} from '@/schemas/admin/store-types';

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
  iconPath: text('icon_path'),

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
  iconPath: text('icon_path'),

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
  attribute: text('attribute').notNull().$type<Attribute>(), // Elemental attribute
  motionValues: text('motion_values', { mode: 'json' })
    .notNull()
    .$type<Array<StoreNumber | StoreParameterizedNumber>>(), // Array of numbers or parameterized numbers
  tags: text('tags', { mode: 'json' }).notNull().$type<Array<string>>(),
  // Alternative definitions for different sequences
  alternativeDefinitions: text('alternative_definitions', {
    mode: 'json',
  }).$type<AttackAlternativeDefinitions>(),
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
  }).$type<ModifierAlternativeDefinitions>(),
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

// Database return types (inferred from Drizzle schema)
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

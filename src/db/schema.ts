import { relations, sql } from 'drizzle-orm';
import { integer, sqliteTable, sqliteView, text } from 'drizzle-orm/sqlite-core';

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
import type {
  AbilityAttribute,
  Attribute,
  CharacterStat,
  EnemyStat,
  WeaponType,
} from '@/types';

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
 * Base fields shared across all tables
 */
const baseTableFields = {
  // Primary key - autoincrement integer
  id: integer('id').primaryKey({ autoIncrement: true }),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$onUpdate(() => new Date()),
} as const;

/**
 * Main entities table storing characters, weapons, echoes, and echo sets
 */
export const entities = sqliteTable('entities', {
  ...baseTableFields,

  // Common fields
  gameId: integer('game_id').unique(), // Original game ID from game data source
  name: text('name').notNull(),
  type: text('type').notNull().$type<EntityType>(),
  iconUrl: text('icon_url'),
  description: text('description'), // Entity description

  // Character and weapon specific fields
  rank: integer('rank'), // Rarity rank (e.g., 4, 5)
  weaponType: text('weapon_type').$type<WeaponType>(), // Weapon type for characters and weapons

  // Character-specific fields
  attribute: text('attribute').$type<Attribute>(),

  // Echo-specific fields
  echoSetIds: text('echo_set_ids', { mode: 'json' }).$type<Array<number>>(),
  cost: integer('cost'), // Echo cost (1, 3, or 4)

  // Echo Set-specific fields
  setBonusThresholds: text('set_bonus_thresholds', { mode: 'json' }).$type<
    Array<number>
  >(),
});

/**
 * Base capability fields shared across all capability types
 */
const baseCapabilityFields = {
  ...baseTableFields,

  // Foreign key to entity
  entityId: integer('entity_id')
    .notNull()
    .references(() => entities.id, { onDelete: 'cascade' }),

  // Metadata
  name: text('name'),
  parentName: text('parent_name'),
  description: text('description'),
  iconUrl: text('icon_url'),

  // Character-specific: sequence unlock level (s1-s6)
  unlockedAt: text('unlocked_at').$type<Sequence>(),

  // Echo Set-specific: piece requirement (2, 3, 5)
  echoSetBonusRequirement: integer('echo_set_bonus_requirement'),
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

/**
 * Base capability fields shared across all capability types
 */
const baseCapabilityV2Fields = {
  ...baseTableFields,
  gameId: integer('game_id'), // Original game ID from game data source
  skillId: integer('skill_id')
    .references(() => skills.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  description: text('description'),
} as const;

/**
 * Permanent stats table - stores permanent stat bonuses
 */
export const permanentStatsV2 = sqliteTable('permanent_stats_v2', {
  ...baseCapabilityV2Fields,
  stat: text('stat').notNull().$type<CharacterStat | EnemyStat>(),
  value: text('value', { mode: 'json' })
    .notNull()
    .$type<StoreNumber | StoreRotationRuntimeResolvableNumber>(),
  tags: text('tags', { mode: 'json' }).notNull().$type<Array<string>>(),
});

/**
 * Attacks table - stores offensive capabilities
 */
export const attacksV2 = sqliteTable('attacks_v2', {
  ...baseCapabilityV2Fields,
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
});

/**
 * Modifiers table - stores temporary/conditional stat modifiers
 */
export const modifiersV2 = sqliteTable('modifiers_v2', {
  ...baseCapabilityV2Fields,
  target: text('target').notNull().$type<Target>(),
  modifiedStats: text('modified_stats', { mode: 'json' })
    .notNull()
    .$type<Array<StoreModifierStat>>(),
  // Alternative definitions for different sequences
  alternativeDefinitions: text('alternative_definitions', {
    mode: 'json',
  }).$type<ModifierAlternativeDefinitions>(),
});

/**
 * Skills table - stores character and weapon skills
 */
export const skills = sqliteTable('skills', {
  ...baseTableFields,

  // Game ID (original identifier from game data)
  gameId: integer('game_id'),

  // Foreign key to entity
  entityId: integer('entity_id')
    .notNull()
    .references(() => entities.id, { onDelete: 'cascade' }),

  // Skill information
  name: text('name').notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  originType: text('origin_type').$type<OriginType>(),
});

// ============================================================================
// Database Views
// ============================================================================

/**
 * Denormalized view of entities with their skills
 * Joins entities with skills for easier querying
 */
export const entitiesWithSkills = sqliteView('entities_with_skills', {
  // Entity fields
  entityId: integer('entity_id').notNull(),
  entityGameId: integer('entity_game_id'),
  entityName: text('entity_name').notNull(),
  entityType: text('entity_type').notNull().$type<EntityType>(),
  entityIconUrl: text('entity_icon_url'),
  entityDescription: text('entity_description'),
  rank: integer('rank'),
  weaponType: text('weapon_type').$type<WeaponType>(),
  attribute: text('attribute').$type<Attribute>(),
  echoSetIds: text('echo_set_ids', { mode: 'json' }).$type<Array<number>>(),
  cost: integer('cost'),
  setBonusThresholds: text('set_bonus_thresholds', { mode: 'json' }).$type<
    Array<number>
  >(),

  // Skill fields (nullable if entity has no skills)
  skillId: integer('skill_id'),
  skillGameId: integer('skill_game_id'),
  skillName: text('skill_name'),
  skillDescription: text('skill_description'),
  skillIconUrl: text('skill_icon_url'),
  skillOriginType: text('skill_origin_type').$type<OriginType>(),
}).as(
  sql`
    SELECT
      entities.id AS entity_id,
      entities.game_id AS entity_game_id,
      entities.name AS entity_name,
      entities.type AS entity_type,
      entities.icon_url AS entity_icon_url,
      entities.description AS entity_description,
      entities.rank,
      entities.weapon_type,
      entities.attribute,
      entities.echo_set_ids,
      entities.cost,
      entities.set_bonus_thresholds,
      skills.id AS skill_id,
      skills.game_id AS skill_game_id,
      skills.name AS skill_name,
      skills.description AS skill_description,
      skills.icon_url AS skill_icon_url,
      skills.origin_type AS skill_origin_type
    FROM entities
    LEFT JOIN skills ON entities.id = skills.entity_id
  `,
);

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

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;

export type EntityWithSkills = typeof entitiesWithSkills.$inferSelect;

export type StoreCapability = Attack | Modifier | PermanentStat;

// ============================================================================
// Relational Queries
// ============================================================================

export const entitiesRelations = relations(entities, ({ many }) => ({
  attacks: many(attacks),
  modifiers: many(modifiers),
  permanentStats: many(permanentStats),
  skills: many(skills),
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

export const skillsRelations = relations(skills, ({ one }) => ({
  entity: one(entities, {
    fields: [skills.entityId],
    references: [entities.id],
  }),
}));

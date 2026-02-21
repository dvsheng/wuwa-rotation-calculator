import { relations, sql } from 'drizzle-orm';
import { integer, sqliteTable, sqliteView, text } from 'drizzle-orm/sqlite-core';

import type {
  DatabaseAttackData,
  DatabaseCapability as DatabaseCapabilityType,
  DatabaseModifierData,
  DatabasePermanentStatData,
} from '@/schemas/database';
import type {
  CapabilityType,
  EntityType,
  OriginType,
} from '@/services/game-data/types';
import type { Attribute, WeaponType } from '@/types';

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
  originType: text('origin_type').notNull().$type<OriginType>(),
});

/**
 * Unified capabilities table - combines attacks, modifiers, and permanent stats
 */
export const capabilities = sqliteTable('capabilities', {
  ...baseTableFields,
  skillId: integer('skill_id')
    .references(() => skills.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name'),
  description: text('description'),
  capabilityType: text('capability_type').notNull().$type<CapabilityType>(),
  capabilityJson: text('capability_json', { mode: 'json' })
    .notNull()
    .$type<DatabaseCapabilityType>(),
});

// ============================================================================
// Relational Queries
// ============================================================================

export const skillsRelations = relations(skills, ({ one, many }) => ({
  entity: one(entities, {
    fields: [skills.entityId],
    references: [entities.id],
  }),
  capabilities: many(capabilities),
}));

export const capabilitiesRelations = relations(capabilities, ({ one }) => ({
  skill: one(skills, {
    fields: [capabilities.skillId],
    references: [skills.id],
  }),
}));

// ============================================================================
// Database Views
// ============================================================================

/**
 * Denormalized view of capabilities with skill and entity data
 */
export const fullCapabilities = sqliteView('full_capabilities', {
  // Capability fields
  capabilityId: integer('capability_id').notNull(),
  capabilityName: text('capability_name'),
  capabilityDescription: text('capability_description'),
  capabilityType: text('capability_type').notNull().$type<CapabilityType>(),
  capabilityJson: text('capability_json', { mode: 'json' })
    .notNull()
    .$type<DatabaseCapabilityType>(),

  // Skill fields (nullable if entity has no skills)
  skillId: integer('skill_id').notNull(),
  skillName: text('skill_name').notNull(),
  skillDescription: text('skill_description'),
  skillIconUrl: text('skill_icon_url'),
  skillOriginType: text('skill_origin_type').notNull().$type<OriginType>(),

  // Entity fields
  entityId: integer('entity_id').notNull(),
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
}).as(
  sql`
    SELECT
      capabilities.id AS capability_id,
      capabilities.name AS capability_name,
      capabilities.description AS capability_description,
      capabilities.capability_type AS capability_type,
      capabilities.capability_json AS capability_json,
      skills.id AS skill_id,
      skills.name AS skill_name,
      skills.description AS skill_description,
      skills.icon_url AS skill_icon_url,
      skills.origin_type AS skill_origin_type,
      entities.id AS entity_id,
      entities.name AS entity_name,
      entities.type AS entity_type,
      entities.icon_url AS entity_icon_url,
      entities.description AS entity_description,
      entities.rank,
      entities.weapon_type,
      entities.attribute,
      entities.echo_set_ids,
      entities.cost,
      entities.set_bonus_thresholds
    FROM capabilities
    JOIN skills ON capabilities.skill_id = skills.id
    JOIN entities ON skills.entity_id = entities.id
  `,
);

// ============================================================================
// Type Exports
// ============================================================================

// Database return types (inferred from Drizzle schema)
export type DatabaseEntity = typeof entities.$inferSelect;
export type NewDatabaseEntity = typeof entities.$inferInsert;

export type DatabaseSkill = typeof skills.$inferSelect;
export type NewDatabaseSkill = typeof skills.$inferInsert;

export type DatabaseCapability = typeof capabilities.$inferSelect;
export type NewDatabaseCapability = typeof capabilities.$inferInsert;

export type DatabaseFullCapability = typeof fullCapabilities.$inferSelect;

export type DatabaseFullCapabilityByType<T extends CapabilityType> = Omit<
  DatabaseFullCapability,
  'capabilityType' | 'capabilityJson'
> & {
  capabilityType: T;
  capabilityJson: T extends 'attack'
    ? DatabaseAttackData
    : T extends 'modifier'
      ? DatabaseModifierData
      : DatabasePermanentStatData;
};

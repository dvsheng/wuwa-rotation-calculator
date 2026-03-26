import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  pgView,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import type { RotationVisibility, SavedRotationData } from '@/schemas/library';
import type {
  CapabilityData,
  CapabilityType,
  EntityType,
  OriginType,
} from '@/services/game-data/types';
import type { Attribute, WeaponType } from '@/types';

// ============================================================================
// Auth Tables (better-auth)
// ============================================================================

export const authUser = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  username: text('username').unique(),
  displayUsername: text('display_username'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const authSession = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => authUser.id, { onDelete: 'cascade' }),
});

export const authAccount = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => authUser.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const authVerification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

// ============================================================================
// Database Tables
// ============================================================================

/**
 * Base fields shared across all tables
 */
const baseTableFields = {
  // Primary key - autoincrement integer
  id: serial('id').primaryKey(),
  // Timestamps
  createdAt: timestamp('created_at')
    .defaultNow()
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
} as const;

/**
 * Main entities table storing characters, weapons, echoes, and echo sets
 */
export const entities = pgTable('entities', {
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
  echoSetIds: jsonb('echo_set_ids').$type<Array<number>>(),
  cost: integer('cost'), // Echo cost (1, 3, or 4)

  // Echo Set-specific fields
  setBonusThresholds: jsonb('set_bonus_thresholds').$type<Array<number>>(),
});

/**
 * Skills table - stores character and weapon skills
 */
export const skills = pgTable('skills', {
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
export const capabilities = pgTable('capabilities', {
  ...baseTableFields,
  skillId: integer('skill_id')
    .references(() => skills.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name'),
  description: text('description'),
  capabilityJson: jsonb('capability_json').notNull().$type<CapabilityData>(),
});

/**
 * Saved rotations table - stores user-created rotation configurations.
 */
export const rotations = pgTable('rotations', {
  ...baseTableFields,
  ownerId: text('owner_id')
    .notNull()
    .references(() => authUser.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  totalDamage: real('total_damage'),
  visibility: text('visibility')
    .notNull()
    .$type<RotationVisibility>()
    .default('private'),
  data: jsonb('data').notNull().$type<SavedRotationData>(),
});

// ============================================================================
// Relational Queries
// ============================================================================

export const entitiesRelations = relations(entities, ({ many }) => ({
  skills: many(skills),
}));

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
export const fullCapabilities = pgView('full_capabilities', {
  // Capability fields
  capabilityId: integer('capability_id').notNull(),
  capabilityName: text('capability_name'),
  capabilityDescription: text('capability_description'),
  capabilityType: text('capability_type').notNull().$type<CapabilityType>(),
  capabilityJson: jsonb('capability_json').notNull().$type<CapabilityData>(),

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
  echoSetIds: jsonb('echo_set_ids').$type<Array<number>>(),
  cost: integer('cost'),
  setBonusThresholds: jsonb('set_bonus_thresholds').$type<Array<number>>(),
}).as(
  sql`
    SELECT
      capabilities.id AS capability_id,
      capabilities.name AS capability_name,
      capabilities.description AS capability_description,
      capabilities.capability_json->>'type' AS capability_type,
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
export type DatabaseRotation = typeof rotations.$inferSelect;
export type NewDatabaseRotation = typeof rotations.$inferInsert;

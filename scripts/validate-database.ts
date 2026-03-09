import { z } from 'zod';

import { database } from '@/db/client';
import type { DatabaseCapability, DatabaseEntity, DatabaseSkill } from '@/db/schema';
import {
  DatabaseAttackDataSchema,
  DatabaseModifierDataSchema,
  DatabasePermanentStatSchema,
} from '@/schemas/database';
import { CapabilityType, EntityType } from '@/services/game-data';
import { Attribute, DamageType, Tag, WeaponType } from '@/types';

/**
 * Validates database data for the new unified schema.
 * This ensures entities, skills, and capabilities are properly structured and linked.
 */

interface ValidationResult {
  tableName: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: Array<{ id: number; issues: Array<string> }>;
}

// ============================================================================
// Validation Schemas
// ============================================================================

const BaseEntitySchema = z.object({
  id: z.number(),
  gameId: z.number(),
  name: z.string(),
  iconUrl: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const CharacterEntitySchema = BaseEntitySchema.extend({
  type: z.literal(EntityType.CHARACTER),
  rank: z.number().min(4).max(5),
  weaponType: z.enum(WeaponType),
  attribute: z.enum(Attribute),
  echoSetIds: z.null(),
  cost: z.null(),
  setBonusThresholds: z.null(),
}).strict();

const WeaponEntitySchema = BaseEntitySchema.extend({
  type: z.literal(EntityType.WEAPON),
  rank: z.number().min(1).max(5),
  weaponType: z.enum(WeaponType),
  attribute: z.null(),
  echoSetIds: z.null(),
  cost: z.null(),
  setBonusThresholds: z.null(),
}).strict();

const EchoEntitySchema = BaseEntitySchema.extend({
  type: z.literal(EntityType.ECHO),
  rank: z.null(),
  weaponType: z.null(),
  attribute: z.null(),
  echoSetIds: z.array(z.number()).min(1),
  cost: z.number().min(1).max(4),
  setBonusThresholds: z.null(),
}).strict();

const EchoSetEntitySchema = BaseEntitySchema.extend({
  type: z.literal(EntityType.ECHO_SET),
  rank: z.null(),
  weaponType: z.null(),
  attribute: z.null(),
  echoSetIds: z.null(),
  cost: z.null(),
  setBonusThresholds: z.array(z.number()).min(1),
}).strict();

const EntityValidationSchema = z.discriminatedUnion('type', [
  CharacterEntitySchema,
  WeaponEntitySchema,
  EchoEntitySchema,
  EchoSetEntitySchema,
]);

const SkillValidationSchema = z
  .object({
    id: z.number(),
    gameId: z.number().nullable(),
    entityId: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    iconUrl: z.string().nullable(),
    originType: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

const BaseCapabilitySchema = z.object({
  id: z.number(),
  skillId: z.number(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const AttackCapabilityValidationSchema = BaseCapabilitySchema.extend({
  capabilityType: z.literal(CapabilityType.ATTACK),
  capabilityJson: DatabaseAttackDataSchema,
}).strict();

const ModifierCapabilityValidationSchema = BaseCapabilitySchema.extend({
  capabilityType: z.literal(CapabilityType.MODIFIER),
  capabilityJson: DatabaseModifierDataSchema,
}).strict();

const PermanentStatCapabilityValidationSchema = BaseCapabilitySchema.extend({
  capabilityType: z.literal(CapabilityType.PERMANENT_STAT),
  capabilityJson: DatabasePermanentStatSchema,
}).strict();

const CapabilityValidationSchema = z.discriminatedUnion('capabilityType', [
  AttackCapabilityValidationSchema,
  ModifierCapabilityValidationSchema,
  PermanentStatCapabilityValidationSchema,
]);

// ============================================================================
// Cross-Table Validation Helpers
// ============================================================================

/**
 * Validates that entity references exist
 */
function validateEntityReference(
  skill: { entityId: number; id: number },
  entityMap: Map<number, DatabaseEntity>,
): Array<string> {
  const issues: Array<string> = [];

  if (!entityMap.has(skill.entityId)) {
    issues.push(`Skill ${skill.id} references non-existent entity ${skill.entityId}`);
  }

  return issues;
}

/**
 * Validates that skill references exist
 */
function validateSkillReference(
  capability: { skillId: number; id: number },
  skillMap: Map<number, DatabaseSkill>,
): Array<string> {
  const issues: Array<string> = [];

  if (!skillMap.has(capability.skillId)) {
    issues.push(
      `Capability ${capability.id} references non-existent skill ${capability.skillId}`,
    );
  }

  return issues;
}

/**
 * Validates that tags are valid (Tag enum values or attack names)
 */
function validateCapabilityTags(
  capability: DatabaseCapability,
  attackNamesForSkill: Set<string>,
): Array<string> {
  const issues: Array<string> = [];

  const json = capability.capabilityJson as any;
  const validTagValues = new Set(Object.values(Tag));
  let tagsToValidate: Array<string> = [];

  // Collect tags based on capability type
  if (json.tags && Array.isArray(json.tags)) {
    tagsToValidate = [...json.tags];
  }

  // For modifiers, also check tags in modifiedStats
  if (
    capability.capabilityJson.type === CapabilityType.MODIFIER &&
    Array.isArray(json.modifiedStats)
  ) {
    for (const stat of json.modifiedStats) {
      if (stat.tags && Array.isArray(stat.tags)) {
        tagsToValidate.push(...stat.tags);
      }
    }
  }

  // Validate each tag
  for (const tag of tagsToValidate) {
    const isValidTagEnum = validTagValues.has(tag as Tag);
    const isAttackName = attackNamesForSkill.has(tag);

    if (!isValidTagEnum && !isAttackName) {
      issues.push(
        `Tag '${tag}' is not a valid Tag enum value or an attack name for this skill`,
      );
    }
  }

  return issues;
}

const VALID_DAMAGE_TYPES = new Set<string>(Object.values(DamageType));
const VALID_ATTRIBUTES = new Set<string>(Object.values(Attribute));

function validateAttackDamageInstanceFields(capability: DatabaseCapability): Array<string> {
  if (capability.capabilityJson.type !== CapabilityType.ATTACK) {
    return [];
  }

  const issues: Array<string> = [];
  const json = capability.capabilityJson as any;

  const validateDamageInstances = (
    damageInstances: Array<{ attribute?: string; damageType?: string }> | undefined,
    context: string,
  ) => {
    if (!Array.isArray(damageInstances)) {
      return;
    }

    for (const [index, damageInstance] of damageInstances.entries()) {
      if (!damageInstance.attribute || !VALID_ATTRIBUTES.has(damageInstance.attribute)) {
        issues.push(
          `${context} damageInstances[${index}] is missing a valid 'attribute' field (required on all instances)`,
        );
      }

      if (!damageInstance.damageType || !VALID_DAMAGE_TYPES.has(damageInstance.damageType)) {
        issues.push(
          `${context} damageInstances[${index}] is missing a valid 'damageType' field (required on all instances)`,
        );
      }
    }
  };

  validateDamageInstances(json.damageInstances, 'Base');

  for (const [sequence, definition] of Object.entries(
    json.alternativeDefinitions ?? {},
  )) {
    validateDamageInstances(
      (definition as any)?.damageInstances,
      `alternativeDefinitions.${sequence}`,
    );
  }

  return issues;
}

// ============================================================================
// Generic Validation Function
// ============================================================================

const validateRecords = <T>(
  tableName: string,
  schema: z.ZodSchema<T>,
  records: Array<unknown>,
  customValidations?: (record: T) => Array<string>,
): ValidationResult => {
  const result: ValidationResult = {
    tableName,
    totalRecords: records.length,
    validRecords: 0,
    invalidRecords: 0,
    errors: [],
  };

  for (const record of records) {
    const issues: Array<string> = [];

    // Schema validation
    try {
      const parsed = schema.parse(record);

      // Run custom validations if provided
      if (customValidations) {
        const customIssues = customValidations(parsed);
        issues.push(...customIssues);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        issues.push(z.prettifyError(error));
      } else {
        throw error;
      }
    }

    // Record result
    if (issues.length === 0) {
      result.validRecords++;
    } else {
      result.invalidRecords++;
      result.errors.push({
        id: (record as { id: number }).id,
        issues,
      });
    }
  }

  return result;
};

// ============================================================================
// Main Validation Function
// ============================================================================

async function validateDatabase() {
  console.log('Validating database records...\n');

  const results: Array<ValidationResult> = [];

  // ========================================================================
  // Step 1: Load and validate entities
  // ========================================================================
  console.log('Loading and validating entities...');
  const entities = await database.query.entities.findMany();
  const entityMap = new Map(entities.map((entity) => [entity.id, entity]));

  const entitiesResult = validateRecords('entities', EntityValidationSchema, entities);
  results.push(entitiesResult);
  console.log(
    `  ${entitiesResult.validRecords}/${entitiesResult.totalRecords} valid\n`,
  );

  // ========================================================================
  // Step 2: Load and validate skills
  // ========================================================================
  console.log('Loading and validating skills...');
  const skills = await database.query.skills.findMany();
  const skillMap = new Map(skills.map((skill) => [skill.id, skill]));

  const skillsResult = validateRecords(
    'skills',
    SkillValidationSchema,
    skills,
    (skill) => validateEntityReference(skill, entityMap),
  );
  results.push(skillsResult);
  console.log(`  ${skillsResult.validRecords}/${skillsResult.totalRecords} valid\n`);

  // ========================================================================
  // Step 3: Group attack names by entity for tag validation
  // ========================================================================
  console.log('Building attack name index...');
  const capabilities = await database.query.capabilities.findMany();
  const attackNames = new Set(
    capabilities
      .filter((capability) => capability.capabilityJson.type === CapabilityType.ATTACK)
      .map((capability) => capability.name)
      .filter((name) => name !== null),
  );
  console.log(`  Indexed ${attackNames.size} attacks\n`);

  // ========================================================================
  // Step 4: Validate capabilities
  // ========================================================================
  console.log('Validating capabilities...');
  const capabilitiesResult = validateRecords(
    'capabilities',
    CapabilityValidationSchema,
    capabilities,
    (capability) => [
      // Validate skill reference
      ...validateSkillReference(capability, skillMap),
      // Validate that each attack damage instance has required attribute and damageType fields
      ...validateAttackDamageInstanceFields(capability),
      // Validate tags (for modifiers and permanent stats)
      ...(capability.capabilityType === CapabilityType.MODIFIER ||
      capability.capabilityType === CapabilityType.PERMANENT_STAT
        ? validateCapabilityTags(capability, attackNames)
        : []),
    ],
  );
  results.push(capabilitiesResult);
  console.log(
    `  ${capabilitiesResult.validRecords}/${capabilitiesResult.totalRecords} valid\n`,
  );

  // ========================================================================
  // Print Summary
  // ========================================================================
  console.log('='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));

  // Overall statistics
  const totalRecords = results.reduce((sum, r) => sum + r.totalRecords, 0);
  const totalValid = results.reduce((sum, r) => sum + r.validRecords, 0);
  const totalInvalid = results.reduce((sum, r) => sum + r.invalidRecords, 0);

  console.log(`\nTotal: ${totalRecords} records`);
  console.log(
    `Valid: ${totalValid} (${((totalValid / totalRecords) * 100).toFixed(1)}%)`,
  );
  console.log(
    `Invalid: ${totalInvalid} (${((totalInvalid / totalRecords) * 100).toFixed(1)}%)`,
  );

  // Per-table breakdown
  console.log('\nPer-table breakdown:');
  for (const result of results) {
    const percentage = ((result.validRecords / result.totalRecords) * 100).toFixed(1);
    console.log(
      `  ${result.tableName}: ${result.validRecords}/${result.totalRecords} (${percentage}%)`,
    );
  }

  // Error details
  let hasErrors = false;
  for (const result of results) {
    if (result.invalidRecords > 0) {
      hasErrors = true;
      console.log(
        `\n${result.tableName.toUpperCase()}: ${result.invalidRecords} errors`,
      );

      // Show first 10 errors
      const errorsToShow = result.errors.slice(0, 10);
      for (const error of errorsToShow) {
        console.log(`\n  Record ID ${error.id}:`);
        for (const issue of error.issues) {
          console.log(`    - ${issue}`);
        }
      }

      if (result.errors.length > 10) {
        console.log(
          `\n  ... and ${result.errors.length - 10} more errors (showing first 10)`,
        );
      }
    }
  }

  if (hasErrors) {
    console.log('\n✗ Validation failed. Please fix the errors above.');
    throw new Error('Database validation failed');
  } else {
    console.log('\n✓ All records are valid!');
  }
}

// Run validation
await validateDatabase().catch((error) => {
  console.error('Error validating database:', error);
  throw error;
});

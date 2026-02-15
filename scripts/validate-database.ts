import { z } from 'zod';

import { database } from '@/db/client';
import type {
  Attack,
  Entity,
  Modifier,
  PermanentStat,
  RefineScalableNumber,
} from '@/db/schema';
import { EntityType } from '@/db/schema';
import { AttackSchema } from '@/schemas/admin/attacks';
import { EntitySchema } from '@/schemas/admin/entities';
import { ModifierSchema } from '@/schemas/admin/modifiers';
import { PermanentStatSchema } from '@/schemas/admin/permanent-stats';
import { Tag } from '@/types';

/**
 * Validates database data against admin schemas.
 * This ensures the database contents match the expected structure and validation rules.
 */

interface ValidationResult {
  tableName: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: Array<{ id: number; issues: Array<string> }>;
}

// ============================================================================
// Cross-Table Validation Helpers
// ============================================================================

/**
 * Type guard to check if a value is a RefineScalableNumber
 */
function isRefineScalableNumber(value: unknown): value is RefineScalableNumber {
  return (
    typeof value === 'object' &&
    value !== null &&
    'base' in value &&
    'increment' in value &&
    typeof (value as RefineScalableNumber).base === 'number' &&
    typeof (value as RefineScalableNumber).increment === 'number'
  );
}

/**
 * Recursively checks if a value contains any RefineScalableNumbers
 */
function containsRefineScalableNumber(value: unknown): boolean {
  if (isRefineScalableNumber(value)) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsRefineScalableNumber(item));
  }

  if (typeof value === 'object' && value !== null) {
    return Object.values(value).some((nestedValue) =>
      containsRefineScalableNumber(nestedValue),
    );
  }

  return false;
}

/**
 * Validates character-specific capability requirements
 */
function validateCharacterCapability(
  capability: {
    name: string | null;
    parentName: string | null;
    originType: string | null;
  },
  entityType: string,
): Array<string> {
  const issues: Array<string> = [];

  if (entityType !== EntityType.CHARACTER) {
    return issues;
  }

  if (!capability.name) {
    issues.push('Character capabilities must have a name');
  }
  if (!capability.parentName) {
    issues.push('Character capabilities must have a parentName');
  }
  if (!capability.originType) {
    issues.push('Character capabilities must have an originType');
  }

  return issues;
}

/**
 * Validates that RefineScalableNumbers are only used for weapon capabilities
 */
function validateRefineScalableNumberUsage(
  capability: { motionValues?: unknown; modifiedStats?: unknown; value?: unknown },
  entityType: string,
): Array<string> {
  const issues: Array<string> = [];

  // Check all potential fields that might contain RefineScalableNumbers
  const fieldsToCheck = [
    { name: 'motionValues', value: capability.motionValues },
    { name: 'modifiedStats', value: capability.modifiedStats },
    { name: 'value', value: capability.value },
  ];

  for (const field of fieldsToCheck) {
    if (
      field.value &&
      containsRefineScalableNumber(field.value) &&
      entityType !== EntityType.WEAPON
    ) {
      issues.push(
        `RefineScalableNumber found in ${field.name} but entity is type '${entityType}' (only WEAPON entities should use RefineScalableNumbers)`,
      );
    }
  }

  return issues;
}

/**
 * Validates that tags in character modifiers/permanent stats are either Tag enum values
 * or attack names from the same character
 */
function validateCharacterCapabilityTags(
  capability: Modifier | PermanentStat,
  entityType: string,
  attackNames: Set<string>,
): Array<string> {
  const issues: Array<string> = [];

  // Only validate for character entities
  if (entityType !== EntityType.CHARACTER) {
    return issues;
  }

  // Get all valid Tag enum values
  const validTagValues = new Set(Object.values(Tag));

  // Get tags from the capability
  let tagsToValidate: Array<string> = [];

  if ('tags' in capability && Array.isArray(capability.tags)) {
    tagsToValidate = capability.tags;
  }

  // Also check tags in modifiedStats for modifiers
  if ('modifiedStats' in capability && Array.isArray(capability.modifiedStats)) {
    for (const modifiedStat of capability.modifiedStats) {
      if ('tags' in modifiedStat && Array.isArray(modifiedStat.tags)) {
        tagsToValidate.push(...modifiedStat.tags);
      }
    }
  }

  // Validate each tag
  for (const tag of tagsToValidate) {
    const isValidTagEnum = validTagValues.has(tag as Tag);
    const isAttackName = attackNames.has(tag);

    if (!isValidTagEnum && !isAttackName) {
      issues.push(
        `Tag '${tag}' is not a valid Tag enum value or an attack name for this character`,
      );
    }
  }

  return issues;
}

/**
 * Validates that capabilities only have fields appropriate for their entity type
 */
function validateCapabilityFieldConstraints(
  capability: {
    echoSetBonusRequirement?: number | null;
    unlockedAt?: string | null;
    alternativeDefinitions?: unknown;
    parentName?: string | null;
    originType?: string | null;
    iconUrl?: string | null;
  },
  entityType: string,
): Array<string> {
  const issues: Array<string> = [];

  // echoSetBonusRequirement should only be populated for ECHO_SET entities
  // and MUST be populated for all ECHO_SET entities
  if (entityType === EntityType.ECHO_SET) {
    if (
      capability.echoSetBonusRequirement === null ||
      capability.echoSetBonusRequirement === undefined
    ) {
      issues.push('echoSetBonusRequirement must be populated for ECHO_SET entities');
    }
  } else if (
    capability.echoSetBonusRequirement !== null &&
    capability.echoSetBonusRequirement !== undefined
  ) {
    issues.push(
      `echoSetBonusRequirement should only be populated for ECHO_SET entities (entity is ${entityType})`,
    );
  }

  // unlockedAt should only be populated for CHARACTER entities
  if (
    capability.unlockedAt !== null &&
    capability.unlockedAt !== undefined &&
    entityType !== EntityType.CHARACTER
  ) {
    issues.push(
      `unlockedAt should only be populated for CHARACTER entities (entity is ${entityType})`,
    );
  }

  // alternativeDefinitions should only be populated for CHARACTER entities
  if (
    capability.alternativeDefinitions !== null &&
    capability.alternativeDefinitions !== undefined &&
    entityType !== EntityType.CHARACTER
  ) {
    issues.push(
      `alternativeDefinitions should only be populated for CHARACTER entities (entity is ${entityType})`,
    );
  }

  // parentName should only be populated for CHARACTER entities
  if (
    capability.parentName !== null &&
    capability.parentName !== undefined &&
    entityType !== EntityType.CHARACTER
  ) {
    issues.push(
      `parentName should only be populated for CHARACTER entities (entity is ${entityType})`,
    );
  }

  // originType should only be populated for CHARACTER entities
  if (
    capability.originType !== null &&
    capability.originType !== undefined &&
    entityType !== EntityType.CHARACTER
  ) {
    issues.push(
      `originType should only be populated for CHARACTER entities (entity is ${entityType})`,
    );
  }

  // iconUrl should only be populated for CHARACTER entities
  if (
    capability.iconUrl !== null &&
    capability.iconUrl !== undefined &&
    entityType !== EntityType.CHARACTER
  ) {
    issues.push(
      `iconUrl should only be populated for CHARACTER entities (entity is ${entityType})`,
    );
  }

  return issues;
}

const validateRecords = <T>(
  tableName: string,
  schema: z.ZodSchema<T>,
  records: Array<unknown>,
  entityMap?: Map<number, Entity>,
  attacksByEntityId?: Map<number, Array<Attack>>,
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
      schema.parse(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        issues.push(
          ...error.issues.map((issue) => {
            const pathString = issue.path.join('.');
            return `${pathString}: ${issue.message}`;
          }),
        );
      }
    }

    // Cross-table validation for capabilities
    if (
      entityMap &&
      typeof record === 'object' &&
      record !== null &&
      'entityId' in record &&
      typeof record.entityId === 'number'
    ) {
      const entity = entityMap.get(record.entityId);

      if (entity) {
        // Validate character-specific requirements
        if ('name' in record && 'parentName' in record && 'originType' in record) {
          const characterIssues = validateCharacterCapability(
            {
              name: record.name as string | null,
              parentName: record.parentName as string | null,
              originType: record.originType as string | null,
            },
            entity.type,
          );
          issues.push(...characterIssues);
        }

        // Validate RefineScalableNumber usage
        const refineIssues = validateRefineScalableNumberUsage(
          record as {
            motionValues?: unknown;
            modifiedStats?: unknown;
            value?: unknown;
          },
          entity.type,
        );
        issues.push(...refineIssues);

        // Validate tags for character modifiers and permanent stats
        if (attacksByEntityId && ('tags' in record || 'modifiedStats' in record)) {
          const attacks = attacksByEntityId.get(record.entityId) ?? [];
          const attackNames = new Set(
            attacks
              .map((attack) => attack.name)
              .filter((name): name is string => !!name),
          );

          const tagIssues = validateCharacterCapabilityTags(
            record as Modifier | PermanentStat,
            entity.type,
            attackNames,
          );
          issues.push(...tagIssues);
        }

        // Validate capability field constraints based on entity type
        if (
          'echoSetBonusRequirement' in record ||
          'unlockedAt' in record ||
          'alternativeDefinitions' in record ||
          'parentName' in record ||
          'originType' in record ||
          'iconUrl' in record
        ) {
          const fieldConstraintIssues = validateCapabilityFieldConstraints(
            record as {
              echoSetBonusRequirement?: number | null;
              unlockedAt?: string | null;
              alternativeDefinitions?: unknown;
              parentName?: string | null;
              originType?: string | null;
              iconUrl?: string | null;
            },
            entity.type,
          );
          issues.push(...fieldConstraintIssues);
        }
      } else {
        issues.push(`Referenced entity ${record.entityId} does not exist`);
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

async function validateDatabase() {
  console.log('Validating database records against schemas...\n');

  const results: Array<ValidationResult> = [];

  // Load entities first for cross-table validation
  console.log('Loading entities for cross-table validation...');
  const entities = await database.query.entities.findMany();
  const entityMap = new Map(entities.map((entity) => [entity.id, entity]));
  console.log(`  Loaded ${entities.length} entities\n`);

  // Validate entities
  console.log('Validating entities...');
  const entitiesResult = validateRecords('entities', EntitySchema, entities);
  results.push(entitiesResult);
  console.log(
    `  ${entitiesResult.validRecords}/${entitiesResult.totalRecords} valid\n`,
  );

  // Load attacks and group by entityId for tag validation
  console.log('Loading attacks for tag validation...');
  const attacks = await database.query.attacks.findMany();
  const attacksByEntityId = new Map<number, Array<Attack>>();
  for (const attack of attacks) {
    const existing = attacksByEntityId.get(attack.entityId) ?? [];
    existing.push(attack);
    attacksByEntityId.set(attack.entityId, existing);
  }
  console.log(`  Loaded ${attacks.length} attacks\n`);

  // Validate attacks (with cross-table validation)
  console.log('Validating attacks...');
  const attacksResult = validateRecords('attacks', AttackSchema, attacks, entityMap);
  results.push(attacksResult);
  console.log(`  ${attacksResult.validRecords}/${attacksResult.totalRecords} valid\n`);

  // Validate modifiers (with cross-table validation)
  console.log('Validating modifiers...');
  const modifiers = await database.query.modifiers.findMany();
  const modifiersResult = validateRecords(
    'modifiers',
    ModifierSchema,
    modifiers,
    entityMap,
    attacksByEntityId,
  );
  results.push(modifiersResult);
  console.log(
    `  ${modifiersResult.validRecords}/${modifiersResult.totalRecords} valid\n`,
  );

  // Validate permanent stats (with cross-table validation)
  console.log('Validating permanent stats...');
  const permanentStats = await database.query.permanentStats.findMany();
  const permanentStatsResult = validateRecords(
    'permanentStats',
    PermanentStatSchema,
    permanentStats,
    entityMap,
    attacksByEntityId,
  );
  results.push(permanentStatsResult);
  console.log(
    `  ${permanentStatsResult.validRecords}/${permanentStatsResult.totalRecords} valid\n`,
  );

  // Print summary
  console.log('='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));

  let hasErrors = false;
  for (const result of results) {
    if (result.invalidRecords > 0) {
      hasErrors = true;
      console.log(
        `\n${result.tableName.toUpperCase()}: ${result.invalidRecords} errors`,
      );
      for (const error of result.errors) {
        console.log(`\n  Record ID ${error.id}:`);
        for (const issue of error.issues) {
          console.log(`    - ${issue}`);
        }
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

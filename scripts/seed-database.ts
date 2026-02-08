import * as fs from 'node:fs/promises';
import path from 'node:path';

import { z } from 'zod';

import { closeDatabase, database } from '@/db/client';
import { attacks, entities, modifiers, permanentStats } from '@/db/schema';
import type { Sequence } from '@/services/game-data/character/types';
import { OriginType, Target } from '@/services/game-data/common-types';

// ============================================================================
// Validation Schemas
// ============================================================================

// Validation schemas - validate structure but be flexible with complex nested types
const ModifierStatSchema = z.object({
  stat: z.string(),
  value: z.unknown(), // Can be number, object with complex nesting - validated at DB level
  tags: z.array(z.string()),
});

// Alternative definition schemas - validate required fields exist and have correct types
const AttackAlternativeDefinitionSchema = z.object({
  description: z.string().optional(),
  motionValues: z.array(z.unknown()), // Can be numbers or parameterized objects
  tags: z.array(z.string()).optional(),
});

const ModifierAlternativeDefinitionSchema = z.object({
  description: z.string().optional(),
  target: z.string().optional(),
  modifiedStats: z.array(ModifierStatSchema),
});

// Main capability schemas with validated alternativeDefinitions structure
const AttackSchema = z.object({
  name: z.string().optional(),
  parentName: z.string().optional(),
  description: z.string().optional(),
  originType: z.string().optional(),
  unlockedAt: z.string().optional(),
  scalingStat: z.string(),
  motionValues: z.array(z.unknown()), // Validated at DB level
  tags: z.array(z.string()),
  alternativeDefinitions: z
    .record(z.string(), AttackAlternativeDefinitionSchema)
    .optional(),
  attribute: z.string().optional(), // May be present in attacks
});

const ModifierSchema = z.object({
  name: z.string().optional(),
  parentName: z.string().optional(),
  description: z.string().optional(),
  originType: z.string().optional(),
  unlockedAt: z.string().optional(),
  target: z.string(),
  modifiedStats: z.array(ModifierStatSchema),
  alternativeDefinitions: z
    .record(z.string(), ModifierAlternativeDefinitionSchema)
    .optional(),
});

const PermanentStatSchema = z.object({
  name: z.string().optional(),
  parentName: z.string().optional(),
  description: z.string().optional(),
  originType: z.string().optional(),
  stat: z.string(),
  value: z.unknown(), // Validated at DB level
  tags: z.array(z.string()),
  unlockedAt: z.string().optional(),
});

const CharacterSchema = z.object({
  id: z.string(),
  uuid: z.string(),
  name: z.string(),
  attribute: z.string(),
  capabilities: z.object({
    attacks: z.array(AttackSchema),
    modifiers: z.array(ModifierSchema),
    permanentStats: z.array(PermanentStatSchema),
  }),
});

const WeaponSchema = z.object({
  id: z.string(),
  uuid: z.string(),
  name: z.string(),
  capabilities: z.object({
    attacks: z.array(AttackSchema),
    modifiers: z.array(ModifierSchema),
    permanentStats: z.array(PermanentStatSchema),
  }),
});

const EchoSchema = z.object({
  id: z.string(),
  uuid: z.string(),
  name: z.string(),
  echoSetIds: z.array(z.string()),
  capabilities: z.object({
    attacks: z.array(AttackSchema),
    modifiers: z.array(ModifierSchema),
    permanentStats: z.array(PermanentStatSchema),
  }),
});

const EchoSetSchema = z.object({
  id: z.string(),
  uuid: z.string(),
  name: z.string(),
  setEffects: z.partialRecord(
    z.enum(['2', '3', '5']), // Only 2, 3, or 5 piece bonuses
    z.object({
      attacks: z.array(AttackSchema),
      modifiers: z.array(ModifierSchema),
      permanentStats: z.array(PermanentStatSchema),
    }),
  ),
});

// ============================================================================
// Enum Validation Functions
// ============================================================================

function validateOriginType(value: string): void {
  if (!Object.values(OriginType).includes(value as any)) {
    throw new Error(
      `Invalid originType: ${value}. Must be one of: ${Object.values(OriginType).join(', ')}`,
    );
  }
}

function validateTarget(value: string): void {
  if (!Object.values(Target).includes(value as any)) {
    throw new Error(
      `Invalid target: ${value}. Must be one of: ${Object.values(Target).join(', ')}`,
    );
  }
}

// ============================================================================
// Error Tracking
// ============================================================================

interface MigrationError {
  file: string;
  error: unknown;
  context?: string;
}

const errors: Array<MigrationError> = [];

// ============================================================================
// Utility Functions
// ============================================================================

async function readJSONFile<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

async function getJSONFiles(directoryPath: string): Promise<Array<string>> {
  const files = await fs.readdir(directoryPath);
  return files
    .filter((file) => file.endsWith('.json'))
    .map((file) => path.join(directoryPath, file));
}

// ============================================================================
// Seeding Functions
// ============================================================================

async function seedCharacters() {
  const characterDir = path.join(process.cwd(), '.local/data/character/parsed');
  const characterFiles = await getJSONFiles(characterDir);

  console.log(`\n📚 Seeding Characters (${characterFiles.length} files)...`);

  let successCount = 0;

  for (const [index, filePath] of characterFiles.entries()) {
    try {
      const character = await readJSONFile<z.infer<typeof CharacterSchema>>(filePath);

      // Validate schema
      const validated = CharacterSchema.parse(character);

      // Insert entity
      const [entity] = await database
        .insert(entities)
        .values({
          hakushinId: Number.parseInt(validated.id),
          name: validated.name,
          type: 'character',
          attribute: validated.attribute as any,
        })
        .returning();

      // Insert attacks
      for (const attack of validated.capabilities.attacks) {
        validateOriginType(attack.originType);
        if (attack.unlockedAt) {
          // Validate sequence if present
          const validSequences = ['s1', 's2', 's3', 's4', 's5', 's6'];
          if (!validSequences.includes(attack.unlockedAt)) {
            throw new Error(`Invalid sequence: ${attack.unlockedAt}`);
          }
        }

        await database.insert(attacks).values({
          entityId: entity.id,
          name: attack.name,
          parentName: attack.parentName,
          description: attack.description,
          originType: attack.originType as any,
          unlockedAt: attack.unlockedAt as Sequence | undefined,
          scalingStat: attack.scalingStat as any,
          attribute: (attack.attribute ?? validated.attribute) as any,
          motionValues: attack.motionValues as any,
          tags: attack.tags,
          alternativeDefinitions: attack.alternativeDefinitions as any,
        } as any);
      }

      // Insert modifiers
      for (const modifier of validated.capabilities.modifiers) {
        validateOriginType(modifier.originType);
        validateTarget(modifier.target);
        if (modifier.unlockedAt) {
          const validSequences = ['s1', 's2', 's3', 's4', 's5', 's6'];
          if (!validSequences.includes(modifier.unlockedAt)) {
            throw new Error(`Invalid sequence: ${modifier.unlockedAt}`);
          }
        }

        await database.insert(modifiers).values({
          entityId: entity.id,
          name: modifier.name,
          parentName: modifier.parentName,
          description: modifier.description,
          originType: modifier.originType,
          unlockedAt: modifier.unlockedAt as Sequence | undefined,
          target: modifier.target,
          modifiedStats: modifier.modifiedStats as any,
          alternativeDefinitions: modifier.alternativeDefinitions as any,
        });
      }

      // Insert permanent stats
      for (const permanentStat of validated.capabilities.permanentStats) {
        validateOriginType(permanentStat.originType);

        await database.insert(permanentStats).values({
          entityId: entity.id,
          name: permanentStat.name,
          parentName: permanentStat.parentName,
          description: permanentStat.description,
          originType: permanentStat.originType,
          unlockedAt: permanentStat.unlockedAt as Sequence | undefined,
          stat: permanentStat.stat,
          value: permanentStat.value as any,
          tags: permanentStat.tags,
          alternativeDefinitions: permanentStat.alternativeDefinitions as any,
        });
      }

      successCount++;
      console.log(
        `  [${index + 1}/${characterFiles.length}] ✓ ${validated.name} (${validated.capabilities.attacks.length} attacks, ${validated.capabilities.modifiers.length} modifiers, ${validated.capabilities.permanentStats.length} stats)`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `  [${index + 1}/${characterFiles.length}] ✗ Failed: ${path.basename(filePath)} - ${errorMessage.slice(0, 100)}`,
      );
      errors.push({ file: filePath, error, context: 'character' });
    }
  }

  console.log(
    `✓ Characters: ${successCount}/${characterFiles.length} migrated successfully`,
  );
}

async function seedWeapons() {
  const weaponDir = path.join(process.cwd(), '.local/data/weapon/parsed');
  const weaponFiles = await getJSONFiles(weaponDir);

  console.log(`\n⚔️  Seeding Weapons (${weaponFiles.length} files)...`);

  let successCount = 0;

  for (const [index, filePath] of weaponFiles.entries()) {
    try {
      const weapon = await readJSONFile<z.infer<typeof WeaponSchema>>(filePath);

      // Validate schema
      const validated = WeaponSchema.parse(weapon);

      // Insert entity
      const [entity] = await database
        .insert(entities)
        .values({
          hakushinId: Number.parseInt(validated.id),
          name: validated.name,
          type: 'weapon',
        })
        .returning();

      // Insert attacks
      for (const attack of validated.capabilities.attacks) {
        await database.insert(attacks).values({
          entityId: entity.id,
          name: attack.name,
          parentName: attack.parentName,
          description: attack.description,
          originType: attack.originType,
          scalingStat: attack.scalingStat,
          attribute: attack.attribute,
          motionValues: attack.motionValues as any,
          tags: attack.tags,
          alternativeDefinitions: attack.alternativeDefinitions as any,
        });
      }

      // Insert modifiers
      for (const modifier of validated.capabilities.modifiers) {
        validateTarget(modifier.target);

        await database.insert(modifiers).values({
          entityId: entity.id,
          name: modifier.name,
          parentName: modifier.parentName,
          description: modifier.description,
          originType: modifier.originType,
          target: modifier.target,
          modifiedStats: modifier.modifiedStats,
          alternativeDefinitions: modifier.alternativeDefinitions,
        });
      }

      // Insert permanent stats
      for (const permanentStat of validated.capabilities.permanentStats) {
        await database.insert(permanentStats).values({
          entityId: entity.id,
          name: permanentStat.name,
          parentName: permanentStat.parentName,
          description: permanentStat.description,
          originType: permanentStat.originType,
          stat: permanentStat.stat,
          value: permanentStat.value,
          tags: permanentStat.tags,
          alternativeDefinitions: permanentStat.alternativeDefinitions,
        });
      }

      successCount++;
      if ((index + 1) % 20 === 0) {
        console.log(`  [${index + 1}/${weaponFiles.length}] Processing...`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `  [${index + 1}/${weaponFiles.length}] ✗ Failed: ${path.basename(filePath)} - ${errorMessage.slice(0, 100)}`,
      );
      errors.push({ file: filePath, error, context: 'weapon' });
    }
  }

  console.log(`✓ Weapons: ${successCount}/${weaponFiles.length} migrated successfully`);
}

async function seedEchoes() {
  const echoDir = path.join(process.cwd(), '.local/data/echo/parsed');
  const echoFiles = await getJSONFiles(echoDir);

  console.log(`\n👻 Seeding Echoes (${echoFiles.length} files)...`);

  let successCount = 0;

  for (const [index, filePath] of echoFiles.entries()) {
    try {
      const echo = await readJSONFile<z.infer<typeof EchoSchema>>(filePath);

      // Validate schema
      const validated = EchoSchema.parse(echo);

      // Convert echoSetIds from strings to numbers
      const echoSetIds = validated.echoSetIds.map((id) => Number.parseInt(id));

      // Insert entity
      const [entity] = await database
        .insert(entities)
        .values({
          hakushinId: Number.parseInt(validated.id),
          name: validated.name,
          type: 'echo',
          echoSetIds,
        })
        .returning();

      // Insert attacks
      for (const attack of validated.capabilities.attacks) {
        await database.insert(attacks).values({
          entityId: entity.id,
          name: attack.name,
          parentName: attack.parentName,
          description: attack.description,
          originType: attack.originType,
          scalingStat: attack.scalingStat,
          attribute: attack.attribute,
          motionValues: attack.motionValues as any,
          tags: attack.tags,
          alternativeDefinitions: attack.alternativeDefinitions as any,
        });
      }

      // Insert modifiers
      for (const modifier of validated.capabilities.modifiers) {
        validateTarget(modifier.target);

        await database.insert(modifiers).values({
          entityId: entity.id,
          name: modifier.name,
          parentName: modifier.parentName,
          description: modifier.description,
          originType: modifier.originType,
          target: modifier.target,
          modifiedStats: modifier.modifiedStats,
          alternativeDefinitions: modifier.alternativeDefinitions,
        });
      }

      // Insert permanent stats
      for (const permanentStat of validated.capabilities.permanentStats) {
        await database.insert(permanentStats).values({
          entityId: entity.id,
          name: permanentStat.name,
          parentName: permanentStat.parentName,
          description: permanentStat.description,
          originType: permanentStat.originType,
          stat: permanentStat.stat,
          value: permanentStat.value,
          tags: permanentStat.tags,
          alternativeDefinitions: permanentStat.alternativeDefinitions,
        });
      }

      successCount++;
      if ((index + 1) % 30 === 0) {
        console.log(`  [${index + 1}/${echoFiles.length}] Processing...`);
      }
    } catch (error) {
      console.error(
        `  [${index + 1}/${echoFiles.length}] ✗ Failed: ${path.basename(filePath)}`,
      );
      errors.push({ file: filePath, error, context: 'echo' });
    }
  }

  console.log(`✓ Echoes: ${successCount}/${echoFiles.length} migrated successfully`);
}

async function seedEchoSets() {
  const echoSetDir = path.join(process.cwd(), '.local/data/echo-set/parsed');
  const echoSetFiles = await getJSONFiles(echoSetDir);

  console.log(`\n🎯 Seeding Echo Sets (${echoSetFiles.length} files)...`);

  let successCount = 0;

  for (const [index, filePath] of echoSetFiles.entries()) {
    try {
      const echoSet = await readJSONFile<z.infer<typeof EchoSetSchema>>(filePath);

      // Validate schema
      const validated = EchoSetSchema.parse(echoSet);

      // Extract set bonus thresholds (2, 3, or 5)
      const setBonusThresholds = Object.keys(validated.setEffects).map((key) =>
        Number.parseInt(key),
      );

      // Insert entity
      const [entity] = await database
        .insert(entities)
        .values({
          hakushinId: Number.parseInt(validated.id),
          name: validated.name,
          type: 'echo_set',
          setBonusThresholds,
        })
        .returning();

      // Flatten setEffects by requirement level
      for (const [requirement, effects] of Object.entries(validated.setEffects)) {
        const requirementNumber = Number.parseInt(requirement);

        // Insert attacks with echoSetBonusRequirement
        for (const attack of effects.attacks) {
          await database.insert(attacks).values({
            entityId: entity.id,
            echoSetBonusRequirement: requirementNumber,
            name: attack.name,
            parentName: attack.parentName,
            description: attack.description,
            originType: attack.originType,
            scalingStat: attack.scalingStat,
            attribute: attack.attribute,
            motionValues: attack.motionValues,
            tags: attack.tags,
            alternativeDefinitions: attack.alternativeDefinitions,
          });
        }

        // Insert modifiers with echoSetBonusRequirement
        for (const modifier of effects.modifiers) {
          validateTarget(modifier.target);

          await database.insert(modifiers).values({
            entityId: entity.id,
            echoSetBonusRequirement: requirementNumber,
            name: modifier.name,
            parentName: modifier.parentName,
            description: modifier.description,
            originType: modifier.originType,
            target: modifier.target,
            modifiedStats: modifier.modifiedStats,
            alternativeDefinitions: modifier.alternativeDefinitions,
          });
        }

        // Insert permanent stats with echoSetBonusRequirement
        for (const permanentStat of effects.permanentStats) {
          await database.insert(permanentStats).values({
            entityId: entity.id,
            echoSetBonusRequirement: requirementNumber,
            name: permanentStat.name,
            parentName: permanentStat.parentName,
            description: permanentStat.description,
            originType: permanentStat.originType,
            stat: permanentStat.stat,
            value: permanentStat.value,
            tags: permanentStat.tags,
            alternativeDefinitions: permanentStat.alternativeDefinitions,
          });
        }
      }

      successCount++;
      console.log(`  [${index + 1}/${echoSetFiles.length}] ✓ ${validated.name}`);
    } catch (error) {
      console.error(
        `  [${index + 1}/${echoSetFiles.length}] ✗ Failed: ${path.basename(filePath)}`,
      );
      errors.push({ file: filePath, error, context: 'echo_set' });
    }
  }

  console.log(
    `✓ Echo Sets: ${successCount}/${echoSetFiles.length} migrated successfully`,
  );
}

// ============================================================================
// Main Seeding Function
// ============================================================================

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');
  console.log('⚠️  This will clear all existing data in the database.\n');

  try {
    // Clear existing data (cascades to all capability tables)
    console.log('🗑️  Clearing existing data...');
    await database.delete(entities);
    console.log('✓ Database cleared\n');

    // Seed all entity types
    await seedCharacters();
    await seedWeapons();
    await seedEchoes();
    await seedEchoSets();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Database seeding completed!');
    console.log('='.repeat(60));

    // Count entities
    const entityCount = await database.select().from(entities);
    const attackCount = await database.select().from(attacks);
    const modifierCount = await database.select().from(modifiers);
    const permanentStatCount = await database.select().from(permanentStats);

    console.log(`\nFinal counts:`);
    console.log(`  Entities: ${entityCount.length}`);
    console.log(`  Attacks: ${attackCount.length}`);
    console.log(`  Modifiers: ${modifierCount.length}`);
    console.log(`  Permanent Stats: ${permanentStatCount.length}`);

    if (errors.length > 0) {
      console.log(`\n⚠️  ${errors.length} errors occurred during migration`);
      console.log('Writing error log to .local/data/migration-errors.json');

      await fs.writeFile(
        path.join(process.cwd(), '.local/data/migration-errors.json'),
        JSON.stringify(
          errors.map((error) => ({
            file: error.file,
            context: error.context,
            error:
              error.error instanceof Error ? error.error.message : String(error.error),
          })),
          null,
          2,
        ),
      );
    }
  } catch (error) {
    console.error('\n❌ Fatal error during seeding:');
    console.error(error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}

// Run the seeding
seedDatabase();

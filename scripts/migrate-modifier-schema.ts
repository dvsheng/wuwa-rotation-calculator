#!/usr/bin/env tsx

/**
 * Migration script: transforms modifier capability JSON from the old schema to the new schema.
 *
 * Old schema:
 *   { type: 'modifier', target: Target, modifiedStats: Array<{stat, tags, value}>, alternativeDefinitions?: { [seq]: { target?, modifiedStats?, description? } } }
 *
 * New schema:
 *   { type: 'modifier', modifiedStats: Array<{target: Target, stat, tags, value}>, alternativeDefinitions?: { [seq]: { modifiedStats?, description? } } }
 *
 * Each entry in modifiedStats gains the top-level target (or its override target) as its own field.
 * Within alternativeDefinitions, each override that specifies modifiedStats (with or without a target
 * override) is transformed the same way — using the override target if present, otherwise the
 * base target.
 */

import { eq, sql } from 'drizzle-orm';

import { database } from '../src/db/client';
import { capabilities } from '../src/db/schema';
import { CapabilityType } from '../src/services/game-data';

// ============================================================================
// Old-schema types (pre-migration)
// ============================================================================

interface OldModifierStat {
  stat: string;
  tags: Array<string>;
  value: unknown;
}

interface OldAlternativeDefinition {
  target?: string;
  modifiedStats?: Array<OldModifierStat>;
  description?: string;
}

interface OldModifierJson {
  type: 'modifier';
  target: string;
  modifiedStats: Array<OldModifierStat>;
  alternativeDefinitions?: Record<string, OldAlternativeDefinition>;
}

// ============================================================================
// New-schema types (post-migration)
// ============================================================================

interface NewModifierStat {
  target: string;
  stat: string;
  tags: Array<string>;
  value: unknown;
}

interface NewAlternativeDefinition {
  modifiedStats?: Array<NewModifierStat>;
  description?: string;
}

interface NewModifierJson {
  type: 'modifier';
  modifiedStats: Array<NewModifierStat>;
  alternativeDefinitions?: Record<string, NewAlternativeDefinition>;
}

// ============================================================================
// Transform logic
// ============================================================================

const transformModifierJson = (old: OldModifierJson): NewModifierJson => {
  const modifiedStats: Array<NewModifierStat> = old.modifiedStats.map((s) => ({
    target: old.target,
    stat: s.stat,
    tags: s.tags,
    value: s.value,
  }));

  const newJson: NewModifierJson = { type: 'modifier', modifiedStats };

  if (old.alternativeDefinitions) {
    const newAlternativeDefinitions: Record<string, NewAlternativeDefinition> = {};

    for (const [seq, override] of Object.entries(old.alternativeDefinitions)) {
      const newOverride: NewAlternativeDefinition = {};

      if (override.description !== undefined) {
        newOverride.description = override.description;
      }

      if (override.modifiedStats !== undefined) {
        // Use the override's target if it specifies one, otherwise fall back to base target
        const overrideTarget = override.target ?? old.target;
        newOverride.modifiedStats = override.modifiedStats.map((s) => ({
          target: overrideTarget,
          stat: s.stat,
          tags: s.tags,
          value: s.value,
        }));
      } else if (override.target !== undefined) {
        // Target-only override without modifiedStats: re-stamp all base stats with the new target
        newOverride.modifiedStats = old.modifiedStats.map((s) => ({
          target: override.target!,
          stat: s.stat,
          tags: s.tags,
          value: s.value,
        }));
      }

      newAlternativeDefinitions[seq] = newOverride;
    }

    newJson.alternativeDefinitions = newAlternativeDefinitions;
  }

  return newJson;
};

// ============================================================================
// Main
// ============================================================================

const main = async () => {
  console.log('Starting modifier schema migration...\n');

  // Fetch all modifier capabilities
  const modifierCapabilities = await database
    .select({ id: capabilities.id, capabilityJson: capabilities.capabilityJson })
    .from(capabilities)
    .where(
      sql`${capabilities.capabilityJson}->>'type' = ${CapabilityType.MODIFIER}`,
    );

  console.log(`Found ${modifierCapabilities.length} modifier capabilities to migrate.\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const capability of modifierCapabilities) {
    const json = capability.capabilityJson as unknown;

    // Skip if already in new format: has 'modifiedStats' with items containing 'target',
    // and no top-level 'target' field
    if (
      typeof json === 'object' &&
      json !== null &&
      'modifiedStats' in json &&
      !('target' in json)
    ) {
      skipped++;
      continue;
    }

    // Validate it looks like the old format
    if (
      typeof json !== 'object' ||
      json === null ||
      !('target' in json) ||
      !('modifiedStats' in json)
    ) {
      console.error(
        `  ⚠️  Capability ${capability.id} has unexpected shape, skipping:`,
        JSON.stringify(json).slice(0, 100),
      );
      errors++;
      continue;
    }

    try {
      const newJson = transformModifierJson(json as OldModifierJson);

      await database
        .update(capabilities)
        .set({ capabilityJson: newJson as any })
        .where(eq(capabilities.id, capability.id));

      console.log(`  ✅ Migrated capability ${capability.id}`);
      migrated++;
    } catch (error) {
      console.error(`  ❌ Error migrating capability ${capability.id}:`, error);
      errors++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   - Migrated:  ${migrated}`);
  console.log(`   - Skipped (already new format): ${skipped}`);
  console.log(`   - Errors:    ${errors}`);

  if (errors > 0) {
    console.error('\n❌ Migration completed with errors.');
    process.exit(1);
  } else {
    console.log('\n✅ Migration completed successfully.');
  }
};

await main();

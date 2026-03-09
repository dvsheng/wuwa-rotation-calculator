#!/usr/bin/env tsx

/**
 * Migration: extract attribute and damageType into damage instance fields.
 *
 * Before this migration each AttackDamageInstance stored its damageType as a tag
 * in the `tags` array, and inherited its `attribute` from the parent attack's
 * top-level `attribute` field (or, occasionally, from an attribute tag).
 *
 * After this migration:
 *  - `damageType` is a required field on every damage instance, extracted from tags.
 *  - `attribute`  is a required field on every damage instance, taken from the
 *    instance's own attribute tag when present, falling back to the attack-level
 *    `attribute` field.
 *  - Both values are removed from the tags array on each instance.
 *  - The top-level `attribute` field is removed from the attack JSON.
 *
 * Any instance that cannot have its damageType resolved is logged and the script
 * exits with a non-zero code so the issue can be fixed before re-running.
 */

import { eq } from 'drizzle-orm';

import { database } from '../src/db/client';
import { capabilities } from '../src/db/schema';
import { CapabilityType } from '../src/services/game-data';
import { Attribute, DamageType } from '../src/types';

const VALID_DAMAGE_TYPES = new Set<string>(Object.values(DamageType));
const VALID_ATTRIBUTES = new Set<string>(Object.values(Attribute));

interface LegacyDamageInstance {
  motionValue: unknown;
  scalingStat: string;
  tags: Array<string>;
  // Fields that may already be present if the migration was partially applied
  attribute?: string;
  damageType?: string;
}

interface LegacyAttackJson {
  type: string;
  /** Attack-level attribute present in the old schema. */
  attribute?: string;
  damageInstances?: Array<LegacyDamageInstance>;
  alternativeDefinitions?: Record<
    string,
    {
      description?: string;
      attribute?: string;
      damageInstances?: Array<LegacyDamageInstance>;
    }
  >;
}

const migrateDamageInstances = (
  damageInstances: Array<LegacyDamageInstance>,
  attackAttribute: string | undefined,
  context: string,
): { migrated: Array<LegacyDamageInstance>; errors: Array<string> } => {
  const errors: Array<string> = [];
  const migrated = damageInstances.map((di, index) => {
    // ── attribute ──────────────────────────────────────────────────────────
    let attribute = di.attribute;
    if (!attribute || !VALID_ATTRIBUTES.has(attribute)) {
      // Try to find an attribute tag on the instance itself
      const attrTag = di.tags.find((t) => VALID_ATTRIBUTES.has(t));
      attribute = attrTag ?? attackAttribute;
    }
    if (!attribute || !VALID_ATTRIBUTES.has(attribute)) {
      errors.push(`${context}[${index}]: could not resolve attribute`);
    }

    // ── damageType ─────────────────────────────────────────────────────────
    let damageType = di.damageType;
    if (!damageType || !VALID_DAMAGE_TYPES.has(damageType)) {
      const dtTag = di.tags.find((t) => VALID_DAMAGE_TYPES.has(t));
      damageType = dtTag;
    }
    if (!damageType || !VALID_DAMAGE_TYPES.has(damageType)) {
      errors.push(
        `${context}[${index}]: could not resolve damageType (scalingStat=${di.scalingStat})`,
      );
    }

    // ── strip resolved values from tags ───────────────────────────────────
    const remainingTags = di.tags.filter(
      (t) => !VALID_ATTRIBUTES.has(t) && !VALID_DAMAGE_TYPES.has(t),
    );

    return { ...di, attribute, damageType, tags: remainingTags };
  });

  return { migrated, errors };
};

async function migrate() {
  console.log('Starting migration: extracting attribute and damageType to damage instance fields...\n');

  const allCapabilities = await database.query.capabilities.findMany();
  const attackCapabilities = allCapabilities.filter(
    (c) => c.capabilityJson.type === CapabilityType.ATTACK,
  );

  console.log(`Found ${attackCapabilities.length} attack capabilities to migrate.\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  const allErrors: Array<{ capabilityId: number; name: string | null; errors: Array<string> }> = [];

  for (const capability of attackCapabilities) {
    const json = capability.capabilityJson as LegacyAttackJson;

    // Skip if already migrated: no top-level attribute and instances already have fields
    const alreadyMigrated =
      !json.attribute &&
      (json.damageInstances ?? []).every((di) => di.attribute && di.damageType);
    if (alreadyMigrated) {
      skippedCount++;
      continue;
    }

    const attackAttribute = json.attribute;
    const capabilityErrors: Array<string> = [];

    // ── migrate base damageInstances ────────────────────────────────────────
    let migratedInstances = json.damageInstances ?? [];
    if (json.damageInstances) {
      const { migrated, errors } = migrateDamageInstances(
        json.damageInstances,
        attackAttribute,
        `capability[${capability.id}].damageInstances`,
      );
      migratedInstances = migrated;
      capabilityErrors.push(...errors);
    }

    // ── migrate alternativeDefinitions ──────────────────────────────────────
    const migratedAltDefs: LegacyAttackJson['alternativeDefinitions'] = {};
    for (const [seq, def] of Object.entries(json.alternativeDefinitions ?? {})) {
      if (!def.damageInstances) {
        migratedAltDefs[seq] = def;
        continue;
      }
      const altAttribute = def.attribute ?? attackAttribute;
      const { migrated, errors } = migrateDamageInstances(
        def.damageInstances,
        altAttribute,
        `capability[${capability.id}].alternativeDefinitions.${seq}.damageInstances`,
      );
      // Drop the attribute override from the alt-def since each instance now carries it
      const { attribute: _dropped, ...restDef } = def;
      migratedAltDefs[seq] = { ...restDef, damageInstances: migrated };
      capabilityErrors.push(...errors);
    }

    if (capabilityErrors.length > 0) {
      allErrors.push({ capabilityId: capability.id, name: capability.name, errors: capabilityErrors });
      continue;
    }

    // ── build updated JSON without top-level attribute ───────────────────────
    const { attribute: _removed, ...jsonWithoutAttribute } = json;
    const updatedJson = {
      ...jsonWithoutAttribute,
      damageInstances: migratedInstances,
      ...(Object.keys(migratedAltDefs).length > 0
        ? { alternativeDefinitions: migratedAltDefs }
        : {}),
    };

    await database
      .update(capabilities)
      .set({ capabilityJson: updatedJson })
      .where(eq(capabilities.id, capability.id));

    updatedCount++;
    console.log(`  ✓ Migrated capability ${capability.id} (${capability.name ?? '<unnamed>'})`);
  }

  console.log(`\n─── Summary ───────────────────────────────────────────────`);
  console.log(`  Updated : ${updatedCount}`);
  console.log(`  Skipped : ${skippedCount} (already migrated)`);
  console.log(`  Errors  : ${allErrors.length}`);

  if (allErrors.length > 0) {
    console.error('\n✗ The following capabilities could not be migrated automatically:');
    for (const { capabilityId, name, errors } of allErrors) {
      console.error(`\n  Capability ${capabilityId} (${name ?? '<unnamed>'}):`);
      for (const err of errors) {
        console.error(`    - ${err}`);
      }
    }
    console.error(
      '\nPlease resolve these manually then re-run the migration.',
    );
    process.exit(1);
  }

  console.log('\n✓ Migration complete.');
}

await migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

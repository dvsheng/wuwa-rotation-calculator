/**
 * Migration script to add UUID field to all top-level entities
 * (characters, weapons, echoes, echo-sets).
 *
 * Run with: npx tsx scripts/add-uuid-to-entities.ts
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DATA_ROOT = path.join(process.cwd(), '.local/data');

interface Entity {
  id: string;
  uuid?: string;
  [key: string]: unknown;
}

function processDirectory(
  dirPath: string,
  entityType: string,
): { processed: number; added: number; errors: Array<string> } {
  if (!fs.existsSync(dirPath)) {
    return { processed: 0, added: 0, errors: [] };
  }

  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json'));
  let added = 0;
  const errors: Array<string> = [];

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const entity: Entity = JSON.parse(content);

      if (!entity.uuid) {
        // Insert uuid right after id by reconstructing the object
        const newEntity: Entity = {
          id: entity.id,
          uuid: crypto.randomUUID(),
        };

        // Copy remaining properties
        for (const [key, value] of Object.entries(entity)) {
          if (key !== 'id' && key !== 'uuid') {
            newEntity[key] = value;
          }
        }

        fs.writeFileSync(filePath, JSON.stringify(newEntity, null, 2));
        added++;
      }
    } catch (err) {
      errors.push(`${file}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`  ${entityType}: processed ${files.length} files, added ${added} UUIDs`);
  if (errors.length > 0) {
    console.log(`    Errors:`);
    for (const error of errors) {
      console.log(`      - ${error}`);
    }
  }

  return { processed: files.length, added, errors };
}

async function main(): Promise<void> {
  await Promise.resolve();
  console.log('='.repeat(60));
  console.log('Adding UUIDs to Entity Files');
  console.log('='.repeat(60));
  console.log();

  const results = {
    characters: processDirectory(
      path.join(DATA_ROOT, 'character/parsed'),
      'Characters',
    ),
    weapons: processDirectory(path.join(DATA_ROOT, 'weapon/parsed'), 'Weapons'),
    echoes: processDirectory(path.join(DATA_ROOT, 'echo/parsed'), 'Echoes'),
    echoSets: processDirectory(path.join(DATA_ROOT, 'echo-set/parsed'), 'Echo Sets'),
  };

  const totalAdded = Object.values(results).reduce((sum, r) => sum + r.added, 0);
  const totalErrors = Object.values(results).reduce(
    (sum, r) => sum + r.errors.length,
    0,
  );

  console.log();
  console.log('='.repeat(60));
  console.log(`Done! Added ${totalAdded} UUIDs total.`);
  if (totalErrors > 0) {
    console.log(`${totalErrors} file(s) had errors.`);
  }
  console.log('='.repeat(60));
}

main().catch(console.error);

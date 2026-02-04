/**
 * Migration script to add UUIDs to all capability items (attacks, modifiers, permanentStats)
 * across all parsed game data files.
 *
 * Run with: npx tsx scripts/add-uuids-to-capabilities.ts
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DATA_ROOT = path.join(process.cwd(), '.local/data');

interface CapabilityItem {
  id?: string;
  [key: string]: unknown;
}

interface Capabilities {
  attacks: Array<CapabilityItem>;
  modifiers: Array<CapabilityItem>;
  permanentStats: Array<CapabilityItem>;
}

function addUuidsToCapabilities(capabilities: Capabilities): number {
  let count = 0;

  for (const attack of capabilities.attacks) {
    if (!attack.id) {
      attack.id = crypto.randomUUID();
      count++;
    }
  }

  for (const modifier of capabilities.modifiers) {
    if (!modifier.id) {
      modifier.id = crypto.randomUUID();
      count++;
    }
  }

  for (const stat of capabilities.permanentStats) {
    if (!stat.id) {
      stat.id = crypto.randomUUID();
      count++;
    }
  }

  return count;
}

function processCharacters(): number {
  const directory = path.join(DATA_ROOT, 'character/parsed');
  if (!fs.existsSync(directory)) return 0;

  const files = fs.readdirSync(directory).filter((f) => f.endsWith('.json'));
  let totalAdded = 0;

  for (const file of files) {
    const filePath = path.join(directory, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (content.capabilities) {
      const added = addUuidsToCapabilities(content.capabilities);
      totalAdded += added;
      fs.writeFileSync(filePath, JSON.stringify(content, undefined, 2));
    }
  }

  console.log(
    `  Characters: processed ${files.length} files, added ${totalAdded} UUIDs`,
  );
  return totalAdded;
}

function processWeapons(): number {
  const directory = path.join(DATA_ROOT, 'weapon/parsed');
  if (!fs.existsSync(directory)) return 0;

  const files = fs.readdirSync(directory).filter((f) => f.endsWith('.json'));
  let totalAdded = 0;

  for (const file of files) {
    const filePath = path.join(directory, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (content.capabilities) {
      // Weapons have capabilities keyed by refine level ("1" through "5")
      for (const refineLevel of Object.keys(content.capabilities)) {
        const added = addUuidsToCapabilities(content.capabilities[refineLevel]);
        totalAdded += added;
      }
      fs.writeFileSync(filePath, JSON.stringify(content, undefined, 2));
    }
  }

  console.log(`  Weapons: processed ${files.length} files, added ${totalAdded} UUIDs`);
  return totalAdded;
}

function processEchoes(): number {
  const directory = path.join(DATA_ROOT, 'echo/parsed');
  if (!fs.existsSync(directory)) return 0;

  const files = fs.readdirSync(directory).filter((f) => f.endsWith('.json'));
  let totalAdded = 0;

  for (const file of files) {
    const filePath = path.join(directory, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (content.capabilities) {
      const added = addUuidsToCapabilities(content.capabilities);
      totalAdded += added;
      fs.writeFileSync(filePath, JSON.stringify(content, undefined, 2));
    }
  }

  console.log(`  Echoes: processed ${files.length} files, added ${totalAdded} UUIDs`);
  return totalAdded;
}

function processEchoSets(): number {
  const directory = path.join(DATA_ROOT, 'echo-set/parsed');
  if (!fs.existsSync(directory)) return 0;

  const files = fs.readdirSync(directory).filter((f) => f.endsWith('.json'));
  let totalAdded = 0;

  for (const file of files) {
    const filePath = path.join(directory, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (content.setEffects) {
      // Echo sets have setEffects keyed by requirement ("2", "3", "5")
      for (const requirement of Object.keys(content.setEffects)) {
        if (content.setEffects[requirement]) {
          const added = addUuidsToCapabilities(content.setEffects[requirement]);
          totalAdded += added;
        }
      }
      fs.writeFileSync(filePath, JSON.stringify(content, undefined, 2));
    }
  }

  console.log(
    `  Echo Sets: processed ${files.length} files, added ${totalAdded} UUIDs`,
  );
  return totalAdded;
}

async function main(): Promise<void> {
  await Promise.resolve();
  console.log('='.repeat(60));
  console.log('Adding UUIDs to Capability Items');
  console.log('='.repeat(60));
  console.log();

  let total = 0;

  total += processCharacters();
  total += processWeapons();
  total += processEchoes();
  total += processEchoSets();

  console.log();
  console.log('='.repeat(60));
  console.log(`Done! Added ${total} UUIDs total.`);
  console.log('='.repeat(60));
}

await main();

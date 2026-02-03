/**
 * Converts existing character capabilities from disabledAt/unlockedAt pattern
 * to the new alternativeDefinitions format.
 *
 * Run with: npx tsx scripts/convert-character-alternative-definitions.ts
 */

import fs from 'node:fs';
import path from 'node:path';

const CHARACTER_DIR = path.join(process.cwd(), '.local/data/character/parsed');
const BACKUP_DIR = path.join(process.cwd(), '.local/data/character/backup');

type Sequence = 's1' | 's2' | 's3' | 's4' | 's5' | 's6';

interface Capability {
  id: string;
  name: string;
  description: string;
  unlockedAt?: Sequence;
  disabledAt?: Sequence;
  [key: string]: unknown;
}

interface Character {
  id: string;
  uuid: string;
  name: string;
  attribute: string;
  capabilities: {
    attacks: Array<Capability>;
    modifiers: Array<Capability>;
    permanentStats: Array<Capability>;
  };
}

const SEQUENCE_ORDER: Array<Sequence> = ['s1', 's2', 's3', 's4', 's5', 's6'];

/**
 * Get the sequence index for sorting (undefined = -1, s1 = 0, etc.)
 */
const getSequenceIndex = (seq: Sequence | undefined): number => {
  if (seq === undefined) return -1;
  return SEQUENCE_ORDER.indexOf(seq);
};

/**
 * Group capabilities by their base ID (removing -s1, -s2, etc. suffixes)
 */
const groupCapabilitiesByBaseId = (
  capabilities: Array<Capability>,
): Map<string, Array<Capability>> => {
  const groups = new Map<string, Array<Capability>>();

  for (const cap of capabilities) {
    // Try to find base ID by removing sequence suffixes
    const baseIdMatch = cap.id.match(/^(.+?)(?:-s[1-6])?$/);
    const baseId = baseIdMatch ? baseIdMatch[1] : cap.id;

    // Also check if there's a disabledAt chain that indicates grouping
    const existing = groups.get(baseId);
    if (existing) {
      existing.push(cap);
    } else {
      groups.set(baseId, [cap]);
    }
  }

  return groups;
};

/**
 * Find capabilities that form a chain (base -> s1 -> s2 -> etc.)
 */
const findChain = (
  capabilities: Array<Capability>,
): Array<Capability> | null => {
  // Sort by unlockedAt sequence
  const sorted = [...capabilities].sort(
    (a, b) => getSequenceIndex(a.unlockedAt) - getSequenceIndex(b.unlockedAt),
  );

  // Check if they form a valid chain
  // A valid chain: base has disabledAt, each subsequent has unlockedAt matching previous disabledAt
  if (sorted.length < 2) return null;

  const base = sorted[0];
  if (!base.disabledAt) return null;

  // Verify the chain
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    // Current should unlock when previous is disabled
    if (curr.unlockedAt !== prev.disabledAt) {
      return null;
    }
  }

  return sorted;
};

/**
 * Get the child fields for an attack alternative
 */
const getAttackChildFields = (
  base: Capability,
  child: Capability,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  if (child.description !== base.description) {
    result.description = child.description;
  }
  if (JSON.stringify(child.motionValues) !== JSON.stringify(base.motionValues)) {
    result.motionValues = child.motionValues;
  }
  if (JSON.stringify(child.tags) !== JSON.stringify(base.tags)) {
    result.tags = child.tags;
  }

  return result;
};

/**
 * Get the child fields for a modifier alternative
 */
const getModifierChildFields = (
  base: Capability,
  child: Capability,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  if (child.description !== base.description) {
    result.description = child.description;
  }
  if (JSON.stringify(child.target) !== JSON.stringify(base.target)) {
    result.target = child.target;
  }
  if (JSON.stringify(child.modifiedStats) !== JSON.stringify(base.modifiedStats)) {
    result.modifiedStats = child.modifiedStats;
  }

  return result;
};

/**
 * Get the child fields for a permanent stat alternative
 */
const getPermanentStatChildFields = (
  base: Capability,
  child: Capability,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  if (child.description !== base.description) {
    result.description = child.description;
  }
  if (child.stat !== base.stat) {
    result.stat = child.stat;
  }
  if (JSON.stringify(child.value) !== JSON.stringify(base.value)) {
    result.value = child.value;
  }
  if (JSON.stringify(child.tags) !== JSON.stringify(base.tags)) {
    result.tags = child.tags;
  }

  return result;
};

/**
 * Convert a chain of capabilities to the new format
 */
const convertChain = (
  chain: Array<Capability>,
  type: 'attacks' | 'modifiers' | 'permanentStats',
): Capability => {
  const base = chain[0];
  const alternatives: Partial<Record<Sequence, Record<string, unknown>>> = {};

  const getChildFields =
    type === 'attacks'
      ? getAttackChildFields
      : type === 'modifiers'
        ? getModifierChildFields
        : getPermanentStatChildFields;

  for (let i = 1; i < chain.length; i++) {
    const child = chain[i];
    const seq = child.unlockedAt;
    if (seq) {
      alternatives[seq] = getChildFields(base, child);
    }
  }

  // Create the new capability without disabledAt
  const { disabledAt, ...baseWithoutDisabled } = base;

  return {
    ...baseWithoutDisabled,
    alternativeDefinitions:
      Object.keys(alternatives).length > 0 ? alternatives : undefined,
  } as Capability;
};

/**
 * Process a single capability type (attacks, modifiers, or permanentStats)
 */
const processCapabilityType = (
  capabilities: Array<Capability>,
  type: 'attacks' | 'modifiers' | 'permanentStats',
): { converted: Array<Capability>; changes: number } => {
  const groups = groupCapabilitiesByBaseId(capabilities);
  const result: Array<Capability> = [];
  let changes = 0;

  for (const [baseId, group] of groups) {
    const chain = findChain(group);

    if (chain && chain.length > 1) {
      // Convert the chain
      const converted = convertChain(chain, type);
      result.push(converted);
      changes += chain.length - 1; // Number of capabilities consolidated
      console.log(
        `    Consolidated ${chain.length} capabilities into "${converted.name}" (${baseId})`,
      );
    } else {
      // Keep original capabilities
      result.push(...group);
    }
  }

  return { converted: result, changes };
};

/**
 * Process a single character file
 */
const processCharacter = (filePath: string): boolean => {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Character;
  const fileName = path.basename(filePath);

  console.log(`Processing ${content.name} (${fileName})...`);

  let totalChanges = 0;

  // Process each capability type
  const attacksResult = processCapabilityType(content.capabilities.attacks, 'attacks');
  const modifiersResult = processCapabilityType(
    content.capabilities.modifiers,
    'modifiers',
  );
  const permanentStatsResult = processCapabilityType(
    content.capabilities.permanentStats,
    'permanentStats',
  );

  totalChanges =
    attacksResult.changes + modifiersResult.changes + permanentStatsResult.changes;

  if (totalChanges === 0) {
    console.log(`  No changes needed`);
    return false;
  }

  // Backup original file
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  const backupPath = path.join(BACKUP_DIR, fileName);
  fs.copyFileSync(filePath, backupPath);
  console.log(`  Backed up to ${backupPath}`);

  // Write updated file
  const updated: Character = {
    ...content,
    capabilities: {
      attacks: attacksResult.converted,
      modifiers: modifiersResult.converted,
      permanentStats: permanentStatsResult.converted,
    },
  };

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2) + '\n');
  console.log(`  Saved ${totalChanges} consolidated capabilities`);

  return true;
};

/**
 * Main function
 */
const main = () => {
  const files = fs.readdirSync(CHARACTER_DIR).filter((f) => f.endsWith('.json'));

  let filesModified = 0;

  for (const file of files) {
    const filePath = path.join(CHARACTER_DIR, file);
    if (processCharacter(filePath)) {
      filesModified++;
    }
  }

  console.log(`\nDone. Modified ${filesModified} files.`);
  if (filesModified > 0) {
    console.log(`Backups saved to ${BACKUP_DIR}`);
  }
};

main();

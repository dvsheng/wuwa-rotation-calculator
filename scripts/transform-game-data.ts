/**
 * Migration script to transform game data from old format to new format.
 *
 * Key transformations:
 * 1. stats: Record<StatKey, Array<...>> → permanentStats: Array<{stat, ...}>
 * 2. modifiedStats in modifiers: Record<StatKey, Array<{value, tags}>> → Array<{stat, value, tags}>
 * 3. Weapons: attributes → capabilities, baseStats moved to permanentStats
 * 4. Echoes/Echo Sets: attack, modifiers, stats wrapped in capabilities object
 *
 * Run with: npx tsx scripts/transform-game-data.ts
 */

import fs from 'node:fs';
import path from 'node:path';

const DATA_ROOT = path.join(process.cwd(), '.local/data');
const BACKUP_ROOT = path.join(process.cwd(), '.local/data-backup');

// ============================================================================
// Types for OLD format
// ============================================================================

interface OldTaggedStatValue {
  value: number | Record<string, unknown>;
  tags: Array<string>;
  description?: string;
}

interface OldModifier {
  name: string;
  description: string;
  target: string | Array<number>;
  modifiedStats: Record<string, Array<OldTaggedStatValue>>;
  // Character-specific
  originType?: string;
  parentName?: string;
  unlockedAt?: string;
  disabledAt?: string;
}

interface OldAttack {
  name: string;
  description: string;
  scalingStat: string;
  motionValues: Array<number | Record<string, unknown>>;
  parameterizedMotionValues?: Array<unknown>;
  tags: Array<string>;
  // Character-specific
  originType?: string;
  parentName?: string;
  unlockedAt?: string;
  disabledAt?: string;
}

interface OldPermanentStat {
  name: string;
  description: string;
  value: number | Record<string, unknown>;
  tags: Array<string>;
  // Character-specific
  originType?: string;
  parentName?: string;
  unlockedAt?: string;
  disabledAt?: string;
}

interface OldCharacter {
  id: string;
  name: string;
  attribute: string;
  attacks: Array<OldAttack>;
  modifiers: Array<OldModifier>;
  stats: Record<string, Array<OldPermanentStat>>;
}

interface OldWeaponRefineProps {
  attack?: OldAttack;
  modifiers: Array<OldModifier>;
  stats: Record<string, Array<OldTaggedStatValue & { description: string }>>;
}

interface OldWeapon {
  id: string;
  name: string;
  baseStats: Record<string, number>;
  attributes: Record<string, OldWeaponRefineProps>;
}

interface OldEcho {
  id: string;
  name: string;
  echoSetIds: Array<string>;
  attack?: OldAttack;
  modifiers: Array<OldModifier>;
  stats: Record<string, Array<OldTaggedStatValue & { description: string }>>;
}

interface OldSetEffect {
  modifiers: Array<OldModifier>;
  stats: Record<string, Array<OldTaggedStatValue & { description: string }>>;
}

interface OldEchoSet {
  id: string;
  name: string;
  setEffects: Record<string, OldSetEffect>;
}

// ============================================================================
// Types for NEW format
// ============================================================================

interface NewStat {
  stat: string;
  value: number | Record<string, unknown>;
  tags: Array<string>;
}

interface NewPermanentStat extends NewStat {
  name: string;
  description: string;
  // Character-specific
  originType?: string;
  parentName?: string;
  unlockedAt?: string;
  disabledAt?: string;
}

interface NewModifier {
  name: string;
  description: string;
  target?: string | Array<number>;
  modifiedStats: Array<NewStat>;
  // Character-specific
  originType?: string;
  parentName?: string;
  unlockedAt?: string;
  disabledAt?: string;
}

interface NewAttack {
  name: string;
  description: string;
  scalingStat: string;
  motionValues: Array<number | Record<string, unknown>>;
  tags: Array<string>;
  // Character-specific
  originType?: string;
  parentName?: string;
  unlockedAt?: string;
  disabledAt?: string;
}

interface NewCapabilities {
  attacks: Array<NewAttack>;
  modifiers: Array<NewModifier>;
  permanentStats: Array<NewPermanentStat>;
}

interface NewCharacter {
  id: string;
  name: string;
  attribute: string;
  capabilities: NewCapabilities & {
    attacks: Array<NewAttack & { originType: string; parentName: string }>;
    modifiers: Array<NewModifier & { originType: string; parentName: string }>;
    permanentStats: Array<
      NewPermanentStat & { originType: string; parentName: string }
    >;
  };
}

interface NewWeapon {
  id: string;
  name: string;
  capabilities: Record<string, NewCapabilities>;
}

interface NewEcho {
  id: string;
  name: string;
  echoSetIds: Array<string>;
  capabilities: NewCapabilities;
}

interface NewEchoSet {
  id: string;
  name: string;
  setEffects: Record<string, NewCapabilities>;
}

// ============================================================================
// Transformation functions
// ============================================================================

/**
 * Flattens modifiedStats from Record<StatKey, Array<{value, tags}>>
 * to Array<{stat, value, tags}>
 */
function transformModifiedStats(
  oldStats: Record<string, Array<OldTaggedStatValue>>,
): Array<NewStat> {
  const result: Array<NewStat> = [];

  for (const [statKey, statValues] of Object.entries(oldStats)) {
    for (const sv of statValues) {
      result.push({
        stat: statKey,
        value: sv.value,
        tags: sv.tags,
      });
    }
  }

  return result;
}

/**
 * Transforms an old modifier to new format
 */
function transformModifier(old: OldModifier): NewModifier {
  const result: NewModifier = {
    name: old.name,
    description: old.description,
    modifiedStats: transformModifiedStats(old.modifiedStats),
  };
  // Character-specific fields
  if (old.originType) result.originType = old.originType;
  if (old.parentName) result.parentName = old.parentName;
  if (old.unlockedAt) result.unlockedAt = old.unlockedAt;
  if (old.disabledAt) result.disabledAt = old.disabledAt;

  return result;
}

/**
 * Transforms an old attack to new format (mostly removes parameterizedMotionValues)
 */
function transformAttack(old: OldAttack): NewAttack {
  const result: NewAttack = {
    name: old.name,
    description: old.description,
    scalingStat: old.scalingStat,
    motionValues: old.motionValues,
    tags: old.tags,
  };

  // Character-specific fields
  if (old.originType) result.originType = old.originType;
  if (old.parentName) result.parentName = old.parentName;
  if (old.unlockedAt) result.unlockedAt = old.unlockedAt;
  if (old.disabledAt) result.disabledAt = old.disabledAt;

  return result;
}

/**
 * Flattens stats from Record<StatKey, Array<PermanentStat>>
 * to Array<PermanentStat & {stat: StatKey}>
 */
function transformPermanentStats(
  oldStats: Record<string, Array<OldPermanentStat>>,
): Array<NewPermanentStat> {
  const result: Array<NewPermanentStat> = [];

  for (const [statKey, statValues] of Object.entries(oldStats)) {
    for (const sv of statValues) {
      const newStat: NewPermanentStat = {
        stat: statKey,
        name: sv.name,
        description: sv.description,
        value: sv.value,
        tags: sv.tags,
      };

      // Character-specific fields
      if (sv.originType) newStat.originType = sv.originType;
      if (sv.parentName) newStat.parentName = sv.parentName;
      if (sv.unlockedAt) newStat.unlockedAt = sv.unlockedAt;
      if (sv.disabledAt) newStat.disabledAt = sv.disabledAt;

      result.push(newStat);
    }
  }

  return result;
}

/**
 * Transforms weapon/echo stats (which have description in the value object)
 */
function transformSimplePermanentStats(
  oldStats: Record<string, Array<OldTaggedStatValue & { description: string }>>,
): Array<NewPermanentStat> {
  const result: Array<NewPermanentStat> = [];

  for (const [statKey, statValues] of Object.entries(oldStats)) {
    for (const sv of statValues) {
      result.push({
        stat: statKey,
        name: statKey, // Use stat key as name for weapons/echoes
        description: sv.description,
        value: sv.value,
        tags: sv.tags,
      });
    }
  }

  return result;
}

// ============================================================================
// Entity transformations
// ============================================================================

function transformCharacter(old: OldCharacter): NewCharacter {
  return {
    id: old.id,
    name: old.name,
    attribute: old.attribute,
    capabilities: {
      attacks: old.attacks.map(transformAttack) as Array<
        NewAttack & { originType: string; parentName: string }
      >,
      modifiers: old.modifiers.map(transformModifier) as Array<
        NewModifier & { originType: string; parentName: string }
      >,
      permanentStats: transformPermanentStats(old.stats) as Array<
        NewPermanentStat & { originType: string; parentName: string }
      >,
    },
  };
}

function transformWeapon(old: OldWeapon): NewWeapon {
  const capabilities: Record<string, NewCapabilities> = {};

  for (const [refineLevel, props] of Object.entries(old.attributes)) {
    const permanentStats = transformSimplePermanentStats(props.stats);

    // Add baseStats as permanentStats for refine level 1 only
    // Actually, baseStats should probably be the same across all refine levels
    // Let's add them to all refine levels for consistency
    for (const [statKey, value] of Object.entries(old.baseStats)) {
      permanentStats.unshift({
        stat: statKey,
        name: `Base ${statKey}`,
        description: `Base weapon stat`,
        value: value,
        tags: ['all'],
      });
    }

    capabilities[refineLevel] = {
      attacks: props.attack ? [transformAttack(props.attack)] : [],
      modifiers: props.modifiers.map(transformModifier),
      permanentStats,
    };
  }

  return {
    id: old.id,
    name: old.name,
    capabilities,
  };
}

function transformEcho(old: OldEcho): NewEcho {
  return {
    id: old.id,
    name: old.name,
    echoSetIds: old.echoSetIds,
    capabilities: {
      attacks: old.attack ? [transformAttack(old.attack)] : [],
      modifiers: old.modifiers.map(transformModifier),
      permanentStats: transformSimplePermanentStats(old.stats),
    },
  };
}

function transformEchoSet(old: OldEchoSet): NewEchoSet {
  const setEffects: Record<string, NewCapabilities> = {};

  for (const [requirement, effect] of Object.entries(old.setEffects)) {
    setEffects[requirement] = {
      attacks: [],
      modifiers: effect.modifiers.map(transformModifier),
      permanentStats: transformSimplePermanentStats(effect.stats),
    };
  }

  return {
    id: old.id,
    name: old.name,
    setEffects,
  };
}

// ============================================================================
// File processing
// ============================================================================

function processDirectory<TOld, TNew>(
  dirPath: string,
  transform: (old: TOld) => TNew,
  entityName: string,
): void {
  const fullPath = path.join(DATA_ROOT, dirPath);

  if (!fs.existsSync(fullPath)) {
    console.log(`Directory not found: ${fullPath}, skipping ${entityName}`);
    return;
  }

  const files = fs.readdirSync(fullPath).filter((f) => f.endsWith('.json'));
  console.log(`Processing ${files.length} ${entityName} files...`);

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = path.join(fullPath, file);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const oldData = JSON.parse(content) as TOld;
      const newData = transform(oldData);

      fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
      successCount++;
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
      errorCount++;
    }
  }

  console.log(`  ✓ ${successCount} files transformed successfully`);
  if (errorCount > 0) {
    console.log(`  ✗ ${errorCount} files had errors`);
  }
}

function createBackup(): void {
  if (fs.existsSync(BACKUP_ROOT)) {
    console.log('Backup already exists, skipping backup creation');
    return;
  }

  console.log('Creating backup...');
  fs.cpSync(DATA_ROOT, BACKUP_ROOT, { recursive: true });
  console.log(`Backup created at ${BACKUP_ROOT}`);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  await Promise.resolve({});
  console.log('='.repeat(60));
  console.log('Game Data Migration Script');
  console.log('='.repeat(60));
  console.log();

  // Create backup first
  createBackup();
  console.log();

  // Transform each entity type
  processDirectory<OldCharacter, NewCharacter>(
    'character/parsed',
    transformCharacter,
    'character',
  );

  processDirectory<OldWeapon, NewWeapon>('weapon/parsed', transformWeapon, 'weapon');

  processDirectory<OldEcho, NewEcho>('echo/parsed', transformEcho, 'echo');

  processDirectory<OldEchoSet, NewEchoSet>(
    'echo-set/parsed',
    transformEchoSet,
    'echo-set',
  );

  console.log();
  console.log('='.repeat(60));
  console.log('Migration complete!');
  console.log('='.repeat(60));
  console.log();
  console.log('Next steps:');
  console.log('1. Run validation: npx vitest run scripts/validate-game-data.test.ts');
  console.log('2. If validation passes, you can delete the backup at:', BACKUP_ROOT);
  console.log('3. If validation fails, restore from backup and fix issues');
}

main().catch(console.error);

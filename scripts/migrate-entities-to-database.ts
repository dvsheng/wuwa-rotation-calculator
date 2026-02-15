#!/usr/bin/env tsx

/**
 * Script to migrate echo, weapon, character, and echo set data from encore.moe JSON files into the entities table
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { and, eq } from 'drizzle-orm';

import { database as database } from '../src/db/client';
import { EntityType, entities, skills } from '../src/db/schema';
import { OriginType } from '../src/services/game-data';
import { Attribute, WeaponType } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ECHO_DATA_DIR = path.join(__dirname, '../.local/data/encore.moe/api/en/echo');
const WEAPON_DATA_DIR = path.join(__dirname, '../.local/data/encore.moe/api/en/weapon');
const CHARACTER_DATA_DIR = path.join(
  __dirname,
  '../.local/data/encore.moe/api/en/character',
);
const ECHO_INDEX_PATH = path.join(ECHO_DATA_DIR, 'index.json');

// ============================================================================
// Types
// ============================================================================

interface EchoSkill {
  Id: number;
  SimplyDescription?: string;
  DescriptionEx?: string;
  BattleViewIcon?: string;
  [key: string]: unknown;
}

interface FetterGroupDetail {
  Group: {
    Id: number;
    FetterGroupName: string;
    FetterMap?: Array<{ Key: number; Value: number }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface FetterDetailsEntry {
  EffectDescriptions: Array<string>;
  DefineDescriptions?: Array<string>;
}

interface EchoData {
  MonsterId: number;
  MonsterName: string;
  IconSmall?: string;
  Rarity: number;
  TypeDescription?: string;
  FetterGroup?: Array<number>;
  Skill?: EchoSkill;
  PhantomType?: number;
  FetterGroupDetails?: Array<FetterGroupDetail>;
  FetterDetails?: Record<string, FetterDetailsEntry>;
  [key: string]: unknown;
}

interface WeaponIndexEntry {
  Id: number;
  Name: string;
  Icon?: string;
  Type: number;
  QualityId: number;
  [key: string]: unknown;
}

interface WeaponIndex {
  weapons: Array<WeaponIndexEntry>;
}

interface WeaponData {
  ItemId: number;
  WeaponName: string;
  Desc?: string;
  [key: string]: unknown;
}

interface CharacterSkill {
  SkillId: number;
  SkillType: string;
  SkillName: string;
  SkillDescribe?: string;
  Icon?: string;
  [key: string]: unknown;
}

interface ResonantChainNode {
  Id: number;
  NodeName: string;
  AttributesDescription?: string;
  NodeIcon?: string;
  [key: string]: unknown;
}

interface SkillTreeNode {
  Id: number;
  PropertyNodeTitle: string;
  PropertyNodeDescribe?: string;
  PropertyNodeIcon?: string;
  [key: string]: unknown;
}

interface CharacterData {
  Id: number;
  Name: {
    Content: string;
    [key: string]: unknown;
  };
  Skills?: Array<CharacterSkill>;
  ResonantChain?: Array<ResonantChainNode>;
  SkillTree?: Array<SkillTreeNode>;
  [key: string]: unknown;
}

interface CharacterIndexEntry {
  Id: number;
  Name: string;
  RoleHeadIcon?: string;
  QualityId: number;
  WeaponType: number;
  Element: {
    Id: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface CharacterIndex {
  roleList: Array<CharacterIndexEntry>;
}

interface Fetter {
  Id: number;
  Name: string;
  EffectDescription?: string;
  [key: string]: unknown;
}

interface FetterGroup {
  Id: number;
  Name: string;
  Icon?: string;
  Fetters: Array<Fetter>;
  [key: string]: unknown;
}

interface EchoIndexEntry {
  MonsterId: number;
  MonsterName: string;
  FetterGroups?: Array<FetterGroup>;
  [key: string]: unknown;
}

interface EchoIndex {
  Echo: Array<EchoIndexEntry>;
}

// ============================================================================
// Rarity to Cost Mapping (for Echoes)
// ============================================================================

const RARITY_TO_COST_MAP: Record<number, number> = {
  0: 1,
  1: 3,
  2: 4,
  3: 4,
};

const mapRarityToCost = (rarity: number): number => {
  return RARITY_TO_COST_MAP[rarity] ?? 1;
};

// ============================================================================
// Weapon Type Mapping
// ============================================================================

const WEAPON_TYPE_MAP: Record<number, WeaponType> = {
  1: WeaponType.BROADBLADE,
  2: WeaponType.SWORD,
  3: WeaponType.PISTOLS,
  4: WeaponType.GAUNTLETS,
  5: WeaponType.RECTIFIER,
};

const mapWeaponType = (weaponTypeId: number): WeaponType | undefined => {
  return WEAPON_TYPE_MAP[weaponTypeId];
};

// ============================================================================
// Attribute Mapping (for Characters)
// ============================================================================

const ATTRIBUTE_MAP: Record<number, Attribute> = {
  1: Attribute.GLACIO,
  2: Attribute.FUSION,
  3: Attribute.ELECTRO,
  4: Attribute.AERO,
  5: Attribute.SPECTRO,
  6: Attribute.HAVOC,
};

const mapAttribute = (attributeId: number): Attribute | undefined => {
  return ATTRIBUTE_MAP[attributeId];
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Strip HTML and CSS tags from a string
 */
const stripHtmlTags = (html: string | undefined): string | undefined => {
  if (!html) return undefined;
  return html.replaceAll(/<[^>]*>/g, '').trim();
};

/**
 * Collapse repeated values in weapon descriptions (e.g., 15/15/15/15/15 -> 15)
 */
const collapseRepeatedValues = (text: string | undefined): string | undefined => {
  if (!text) return undefined;
  // Match patterns like "15/15/15/15/15" where all 5 values are identical
  // Supports numbers with decimals and optional % sign
  return text.replaceAll(/(\d+(?:\.\d+)?%?)\/\1\/\1\/\1\/\1/g, '$1');
};

const ENCORE_MOE_IMAGE_ASSETS_URL = 'https://api-v2.encore.moe/resource/Data/';

/**
 * Converts an icon path to a full encore.moe API URL with .png extension.
 */
const processIconPath = (iconUrl?: string | null): string | undefined => {
  if (!iconUrl) return undefined;

  // Remove file extension and add .png
  const pathWithPng = iconUrl.replace(/\.[^.]*$/, '.png');

  // Remove leading slash to ensure proper URL concatenation
  const relativePath = pathWithPng.startsWith('/') ? pathWithPng.slice(1) : pathWithPng;

  return new URL(relativePath, ENCORE_MOE_IMAGE_ASSETS_URL).href;
};

/**
 * Map resonance chain index to sequence value (s1-s6)
 */
const mapResonanceChainIndexToSequence = (index: number): string => {
  return `s${index + 1}`;
};

// ============================================================================
// Data Processing
// ============================================================================

const loadEchoJSON = async (filePath: string): Promise<EchoData | undefined> => {
  try {
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content) as EchoData;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return undefined;
  }
};

const shouldSkipEcho = (echo: EchoData): boolean => {
  return (
    echo.TypeDescription === 'Phantom Appearance' ||
    echo.MonsterName.startsWith('Phantom:') ||
    echo.PhantomType === 2
  );
};

const upsertEchoEntity = async (echo: EchoData): Promise<void> => {
  const gameId = echo.MonsterId;
  const name = echo.MonsterName;
  const iconUrl = echo.IconSmall;
  const description = echo.Skill?.SimplyDescription;
  const cost = mapRarityToCost(echo.Rarity);
  const echoSetIds = echo.FetterGroup;

  // Check if entity already exists
  const existing = await database
    .select()
    .from(entities)
    .where(eq(entities.gameId, gameId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing entity
    await database
      .update(entities)
      .set({
        name,
        type: EntityType.ECHO,
        iconUrl,
        description,
        cost,
        echoSetIds,
        updatedAt: new Date(),
      })
      .where(eq(entities.gameId, gameId));
    console.log(`Updated echo: ${name} (ID: ${gameId})`);
  } else {
    // Insert new entity
    await database.insert(entities).values({
      gameId,
      name,
      type: EntityType.ECHO,
      iconUrl,
      description,
      cost,
      echoSetIds,
    });
    console.log(`Inserted echo: ${name} (ID: ${gameId})`);
  }
};

const upsertEchoSkill = async (echo: EchoData): Promise<number> => {
  if (!echo.Skill) {
    return 0;
  }

  const skillGameId = echo.Skill.Id;
  const name = echo.MonsterName;
  const description = stripHtmlTags(echo.Skill.DescriptionEx);
  const iconUrl = echo.Skill.BattleViewIcon;
  const originType = OriginType.ECHO;

  // Find the entity ID for this echo
  const entityRecord = await database
    .select({ id: entities.id })
    .from(entities)
    .where(eq(entities.gameId, echo.MonsterId))
    .limit(1);

  if (entityRecord.length === 0) {
    console.error(`Entity not found for echo MonsterId: ${echo.MonsterId}`);
    return 0;
  }

  const entityId = entityRecord[0].id;

  // Check if skill already exists
  const existing = await database
    .select()
    .from(skills)
    .where(eq(skills.gameId, skillGameId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing skill
    await database
      .update(skills)
      .set({
        entityId,
        name,
        description,
        iconUrl,
        originType,
        updatedAt: new Date(),
      })
      .where(eq(skills.gameId, skillGameId));
    console.log(`  Updated echo skill: ${name} (ID: ${skillGameId})`);
  } else {
    // Insert new skill
    await database.insert(skills).values({
      gameId: skillGameId,
      entityId,
      name,
      description,
      iconUrl,
      originType,
    });
    console.log(`  Inserted echo skill: ${name} (ID: ${skillGameId})`);
  }

  return 1;
};

const upsertEchoSetSkills = async (echo: EchoData): Promise<number> => {
  if (!echo.FetterGroupDetails || !echo.FetterDetails) {
    return 0;
  }

  let skillsProcessed = 0;

  for (const fetterGroupDetail of echo.FetterGroupDetails) {
    const echoSetGameId = fetterGroupDetail.Group.Id;
    const echoSetName = fetterGroupDetail.Group.FetterGroupName;

    // Find the entity ID for this echo set
    const entityRecord = await database
      .select({ id: entities.id })
      .from(entities)
      .where(eq(entities.gameId, echoSetGameId))
      .limit(1);

    if (entityRecord.length === 0) {
      continue;
    }

    const entityId = entityRecord[0].id;

    // Get the fetter details for this echo set
    if (!(echoSetName in echo.FetterDetails)) {
      continue;
    }

    const fetterDetails = echo.FetterDetails[echoSetName];

    // Determine thresholds based on number of effect descriptions
    const thresholds = fetterDetails.EffectDescriptions.length === 2 ? [2, 5] : [3];

    // Create a skill for each threshold
    for (const [index, threshold] of thresholds.entries()) {
      const description = stripHtmlTags(fetterDetails.EffectDescriptions[index]);
      const name = `${echoSetName} - ${threshold}`;
      const originType = OriginType.ECHO_SET;

      // Check if skill already exists (by name and entity ID since no game ID)
      const existing = await database
        .select()
        .from(skills)
        .where(and(eq(skills.entityId, entityId), eq(skills.name, name)))
        .limit(1);

      if (existing.length > 0) {
        // Update existing skill
        await database
          .update(skills)
          .set({
            description,
            originType,
            updatedAt: new Date(),
          })
          .where(eq(skills.id, existing[0].id));
        console.log(`  Updated echo set skill: ${name}`);
      } else {
        // Insert new skill
        await database.insert(skills).values({
          entityId,
          name,
          description,
          iconUrl: undefined,
          originType,
        });
        console.log(`  Inserted echo set skill: ${name}`);
      }

      skillsProcessed++;
    }
  }

  return skillsProcessed;
};

const loadWeaponIndex = async (): Promise<WeaponIndex | undefined> => {
  const indexPath = path.join(WEAPON_DATA_DIR, 'index.json');
  try {
    const content = await readFile(indexPath, 'utf8');
    return JSON.parse(content) as WeaponIndex;
  } catch (error) {
    console.error(`Error reading weapon index:`, error);
    return undefined;
  }
};

const loadWeaponJSON = async (weaponId: number): Promise<WeaponData | undefined> => {
  const filePath = path.join(WEAPON_DATA_DIR, `${weaponId}.json`);
  try {
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content) as WeaponData;
  } catch (error) {
    console.error(`Error reading weapon ${weaponId}:`, error);
    return undefined;
  }
};

const upsertWeaponEntity = async (weapon: WeaponIndexEntry): Promise<void> => {
  const gameId = weapon.Id;
  const name = weapon.Name;
  const iconUrl = weapon.Icon ?? undefined;
  const rank = weapon.QualityId;
  const weaponType = mapWeaponType(weapon.Type);

  // Check if entity already exists
  const existing = await database
    .select()
    .from(entities)
    .where(eq(entities.gameId, gameId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing entity
    await database
      .update(entities)
      .set({
        name,
        type: EntityType.WEAPON,
        iconUrl,
        rank,
        weaponType,
        updatedAt: new Date(),
      })
      .where(eq(entities.gameId, gameId));
    console.log(`Updated weapon: ${name} (ID: ${gameId})`);
  } else {
    // Insert new entity
    await database.insert(entities).values({
      gameId,
      name,
      type: EntityType.WEAPON,
      iconUrl,
      rank,
      weaponType,
    });
    console.log(`Inserted weapon: ${name} (ID: ${gameId})`);
  }
};

const upsertWeaponSkill = async (weaponId: number): Promise<number> => {
  const weaponData = await loadWeaponJSON(weaponId);
  if (!weaponData?.Desc) {
    return 0;
  }

  const name = weaponData.WeaponName;
  const description = collapseRepeatedValues(stripHtmlTags(weaponData.Desc));
  const originType = OriginType.WEAPON;

  // Find the entity ID for this weapon
  const entityRecord = await database
    .select({ id: entities.id })
    .from(entities)
    .where(eq(entities.gameId, weaponId))
    .limit(1);

  if (entityRecord.length === 0) {
    console.error(`Entity not found for weapon ID: ${weaponId}`);
    return 0;
  }

  const entityId = entityRecord[0].id;

  // Check if skill already exists (by name and entity ID since no game ID)
  const existing = await database
    .select()
    .from(skills)
    .where(and(eq(skills.entityId, entityId), eq(skills.name, name)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing skill
    await database
      .update(skills)
      .set({
        description,
        originType,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, existing[0].id));
    console.log(`  Updated weapon skill: ${name}`);
  } else {
    // Insert new skill
    await database.insert(skills).values({
      entityId,
      name,
      description,
      iconUrl: undefined,
      originType,
    });
    console.log(`  Inserted weapon skill: ${name}`);
  }

  return 1;
};

const loadCharacterIndex = async (): Promise<CharacterIndex | undefined> => {
  const indexPath = path.join(CHARACTER_DATA_DIR, 'index.json');
  try {
    const content = await readFile(indexPath, 'utf8');
    return JSON.parse(content) as CharacterIndex;
  } catch (error) {
    console.error(`Error reading character index:`, error);
    return undefined;
  }
};

const loadCharacterJSON = async (
  characterId: number,
): Promise<CharacterData | undefined> => {
  const filePath = path.join(CHARACTER_DATA_DIR, `${characterId}.json`);
  try {
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content) as CharacterData;
  } catch (error) {
    console.error(`Error reading character ${characterId}:`, error);
    return undefined;
  }
};

const upsertCharacterEntity = async (character: CharacterIndexEntry): Promise<void> => {
  const gameId = character.Id;
  const name = character.Name;
  const iconUrl = character.RoleHeadIcon ?? undefined;
  const rank = character.QualityId;
  const weaponType = mapWeaponType(character.WeaponType);
  const attribute = mapAttribute(character.Element.Id);

  // Check if entity already exists
  const existing = await database
    .select()
    .from(entities)
    .where(eq(entities.gameId, gameId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing entity
    await database
      .update(entities)
      .set({
        name,
        type: EntityType.CHARACTER,
        iconUrl,
        rank,
        weaponType,
        attribute,
        updatedAt: new Date(),
      })
      .where(eq(entities.gameId, gameId));
    console.log(`Updated character: ${name} (ID: ${gameId})`);
  } else {
    // Insert new entity
    await database.insert(entities).values({
      gameId,
      name,
      type: EntityType.CHARACTER,
      iconUrl,
      rank,
      weaponType,
      attribute,
    });
    console.log(`Inserted character: ${name} (ID: ${gameId})`);
  }
};

const upsertCharacterSkills = async (characterId: number): Promise<number> => {
  const characterData = await loadCharacterJSON(characterId);
  if (!characterData?.Skills) {
    return 0;
  }

  let skillsProcessed = 0;

  // Find the entity ID for this character
  const entityRecord = await database
    .select({ id: entities.id })
    .from(entities)
    .where(eq(entities.gameId, characterId))
    .limit(1);

  if (entityRecord.length === 0) {
    console.error(`Entity not found for character ID: ${characterId}`);
    return 0;
  }

  const entityId = entityRecord[0].id;

  for (const skill of characterData.Skills) {
    const skillGameId = skill.SkillId;
    const name = skill.SkillName;
    const description = stripHtmlTags(skill.SkillDescribe);
    const iconUrl = skill.Icon;
    // SkillType from the data matches OriginType values like "Normal Attack", "Resonance Skill", etc.
    const originType = skill.SkillType as OriginType;

    // Check if skill already exists
    const existing = await database
      .select()
      .from(skills)
      .where(eq(skills.gameId, skillGameId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing skill
      await database
        .update(skills)
        .set({
          entityId,
          name,
          description,
          iconUrl,
          originType,
          updatedAt: new Date(),
        })
        .where(eq(skills.gameId, skillGameId));
      console.log(`  Updated character skill: ${name} (${originType})`);
    } else {
      // Insert new skill
      await database.insert(skills).values({
        gameId: skillGameId,
        entityId,
        name,
        description,
        iconUrl,
        originType,
      });
      console.log(`  Inserted character skill: ${name} (${originType})`);
    }

    skillsProcessed++;
  }

  return skillsProcessed;
};

const upsertResonantChainSkills = async (characterId: number): Promise<number> => {
  const characterData = await loadCharacterJSON(characterId);
  if (!characterData?.ResonantChain) {
    return 0;
  }

  let skillsProcessed = 0;

  // Find the entity ID for this character
  const entityRecord = await database
    .select({ id: entities.id })
    .from(entities)
    .where(eq(entities.gameId, characterId))
    .limit(1);

  if (entityRecord.length === 0) {
    console.error(`Entity not found for character ID: ${characterId}`);
    return 0;
  }

  const entityId = entityRecord[0].id;

  for (const [index, node] of characterData.ResonantChain.entries()) {
    const skillGameId = node.Id;
    const name = node.NodeName.replaceAll('\n', ' ');
    const description = stripHtmlTags(node.AttributesDescription);
    const iconUrl = processIconPath(node.NodeIcon);
    // Map resonance chain index (1-6) to sequence (s1-s6)
    const originType = mapResonanceChainIndexToSequence(index) as OriginType;

    // Check if skill already exists
    const existing = await database
      .select()
      .from(skills)
      .where(eq(skills.gameId, skillGameId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing skill
      await database
        .update(skills)
        .set({
          entityId,
          name,
          description,
          iconUrl,
          originType,
          updatedAt: new Date(),
        })
        .where(eq(skills.gameId, skillGameId));
      console.log(`  Updated resonant chain: ${name} (${originType})`);
    } else {
      // Insert new skill
      await database.insert(skills).values({
        gameId: skillGameId,
        entityId,
        name,
        description,
        iconUrl,
        originType,
      });
      console.log(`  Inserted resonant chain: ${name} (${originType})`);
    }

    skillsProcessed++;
  }

  return skillsProcessed;
};

const upsertSkillTreeNodes = async (characterId: number): Promise<number> => {
  const characterData = await loadCharacterJSON(characterId);
  if (!characterData?.SkillTree) {
    return 0;
  }

  let nodesProcessed = 0;

  // Find the entity ID for this character
  const entityRecord = await database
    .select({ id: entities.id })
    .from(entities)
    .where(eq(entities.gameId, characterId))
    .limit(1);

  if (entityRecord.length === 0) {
    console.error(`Entity not found for character ID: ${characterId}`);
    return 0;
  }

  const entityId = entityRecord[0].id;

  for (const node of characterData.SkillTree) {
    const skillGameId = node.Id;
    const name = node.PropertyNodeTitle;
    const description = stripHtmlTags(node.PropertyNodeDescribe);
    const iconUrl = processIconPath(node.PropertyNodeIcon);
    // SkillTree nodes are Base Stats bonuses
    const originType = OriginType.BASE_STATS;

    // Check if skill already exists
    const existing = await database
      .select()
      .from(skills)
      .where(eq(skills.gameId, skillGameId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing skill
      await database
        .update(skills)
        .set({
          entityId,
          name,
          description,
          iconUrl,
          originType,
          updatedAt: new Date(),
        })
        .where(eq(skills.gameId, skillGameId));
      console.log(`  Updated skill tree node: ${name}`);
    } else {
      // Insert new skill
      await database.insert(skills).values({
        gameId: skillGameId,
        entityId,
        name,
        description,
        iconUrl,
        originType,
      });
      console.log(`  Inserted skill tree node: ${name}`);
    }

    nodesProcessed++;
  }

  return nodesProcessed;
};

const loadEchoIndex = async (): Promise<EchoIndex | undefined> => {
  try {
    const content = await readFile(ECHO_INDEX_PATH, 'utf8');
    return JSON.parse(content) as EchoIndex;
  } catch (error) {
    console.error(`Error reading echo index:`, error);
    return undefined;
  }
};

const upsertEchoSetEntity = async (fetterGroup: FetterGroup): Promise<void> => {
  const gameId = fetterGroup.Id;
  const name = fetterGroup.Name;
  const iconUrl = fetterGroup.Icon;
  const setBonusThresholds = fetterGroup.Fetters.length === 2 ? [2, 5] : [3];

  // Check if entity already exists
  const existing = await database
    .select()
    .from(entities)
    .where(eq(entities.gameId, gameId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing entity
    await database
      .update(entities)
      .set({
        name,
        type: EntityType.ECHO_SET,
        iconUrl,
        setBonusThresholds,
        updatedAt: new Date(),
      })
      .where(eq(entities.gameId, gameId));
    console.log(`Updated echo set: ${name} (ID: ${gameId})`);
  } else {
    // Insert new entity
    await database.insert(entities).values({
      gameId,
      name,
      type: EntityType.ECHO_SET,
      iconUrl,
      setBonusThresholds,
    });
    console.log(`Inserted echo set: ${name} (ID: ${gameId})`);
  }
};

// ============================================================================
// Main Entry Point
// ============================================================================

const main = async () => {
  console.log('Starting entity data migration...\n');

  try {
    // ========================================================================
    // ECHOES
    // ========================================================================
    console.log('=== Processing Echoes ===\n');

    const echoFiles = await readdir(ECHO_DATA_DIR);
    const echoJsonFiles = echoFiles.filter(
      (file) => file.endsWith('.json') && file !== 'index.json',
    );

    console.log(`Found ${echoJsonFiles.length} echo files\n`);

    let echoProcessed = 0;
    let echoSkipped = 0;
    let echoErrors = 0;
    let echoSkillsProcessed = 0;
    let echoSetSkillsProcessed = 0;

    for (const file of echoJsonFiles) {
      const filePath = path.join(ECHO_DATA_DIR, file);
      const echo = await loadEchoJSON(filePath);

      if (!echo) {
        echoErrors++;
        continue;
      }

      if (shouldSkipEcho(echo)) {
        console.log(`Skipping Phantom Appearance: ${echo.MonsterName}`);
        echoSkipped++;
        continue;
      }

      try {
        await upsertEchoEntity(echo);
        echoSkillsProcessed += await upsertEchoSkill(echo);
        echoSetSkillsProcessed += await upsertEchoSetSkills(echo);
        echoProcessed++;
      } catch (error) {
        console.error(`Error processing ${echo.MonsterName}:`, error, file);
        echoErrors++;
      }
    }

    console.log('\n✅ Echo migration completed!');
    console.log(`📊 Echo Summary:`);
    console.log(`   - Processed: ${echoProcessed}`);
    console.log(`   - Skipped: ${echoSkipped}`);
    console.log(`   - Errors: ${echoErrors}`);
    console.log(`   - Echo Skills: ${echoSkillsProcessed}`);
    console.log(`   - Echo Set Skills: ${echoSetSkillsProcessed}`);

    // ========================================================================
    // WEAPONS
    // ========================================================================
    console.log('\n=== Processing Weapons ===\n');

    const weaponIndex = await loadWeaponIndex();
    if (!weaponIndex) {
      console.error('Failed to load weapon index');
      process.exit(1);
    }

    console.log(`Found ${weaponIndex.weapons.length} weapons in index\n`);

    let weaponProcessed = 0;
    let weaponErrors = 0;
    let weaponSkillsProcessed = 0;

    for (const weapon of weaponIndex.weapons) {
      try {
        await upsertWeaponEntity(weapon);
        weaponSkillsProcessed += await upsertWeaponSkill(weapon.Id);
        weaponProcessed++;
      } catch (error) {
        console.error(`Error processing ${weapon.Name}:`, error);
        weaponErrors++;
      }
    }

    console.log('\n✅ Weapon migration completed!');
    console.log(`📊 Weapon Summary:`);
    console.log(`   - Processed: ${weaponProcessed}`);
    console.log(`   - Errors: ${weaponErrors}`);
    console.log(`   - Weapon Skills: ${weaponSkillsProcessed}`);

    // ========================================================================
    // CHARACTERS
    // ========================================================================
    console.log('\n=== Processing Characters ===\n');

    const characterIndex = await loadCharacterIndex();
    if (!characterIndex) {
      console.error('Failed to load character index');
      process.exit(1);
    }

    console.log(`Found ${characterIndex.roleList.length} characters in index\n`);

    let characterProcessed = 0;
    let characterErrors = 0;
    let characterSkillsProcessed = 0;
    let resonantChainSkillsProcessed = 0;
    let skillTreeNodesProcessed = 0;

    for (const character of characterIndex.roleList) {
      try {
        await upsertCharacterEntity(character);
        characterSkillsProcessed += await upsertCharacterSkills(character.Id);
        resonantChainSkillsProcessed += await upsertResonantChainSkills(character.Id);
        skillTreeNodesProcessed += await upsertSkillTreeNodes(character.Id);
        characterProcessed++;
      } catch (error) {
        console.error(`Error processing ${character.Name}:`, error);
        characterErrors++;
      }
    }

    console.log('\n✅ Character migration completed!');
    console.log(`📊 Character Summary:`);
    console.log(`   - Processed: ${characterProcessed}`);
    console.log(`   - Errors: ${characterErrors}`);
    console.log(`   - Character Skills: ${characterSkillsProcessed}`);
    console.log(`   - Resonant Chain Skills: ${resonantChainSkillsProcessed}`);
    console.log(`   - Skill Tree Nodes: ${skillTreeNodesProcessed}`);

    // ========================================================================
    // ECHO SETS
    // ========================================================================
    console.log('\n=== Processing Echo Sets ===\n');

    const echoIndex = await loadEchoIndex();
    if (!echoIndex) {
      console.error('Failed to load echo index');
      process.exit(1);
    }

    // Collect all unique FetterGroups from all echoes
    const fetterGroupMap = new Map<number, FetterGroup>();

    for (const echo of echoIndex.Echo) {
      if (!echo.FetterGroups || echo.FetterGroups.length === 0) {
        continue;
      }

      for (const fetterGroup of echo.FetterGroups) {
        // Use the FetterGroup ID as the key to avoid duplicates
        if (!fetterGroupMap.has(fetterGroup.Id)) {
          fetterGroupMap.set(fetterGroup.Id, fetterGroup);
        }
      }
    }

    const uniqueFetterGroups = [...fetterGroupMap.values()];
    console.log(`Found ${uniqueFetterGroups.length} unique echo sets\n`);

    let echoSetProcessed = 0;
    let echoSetErrors = 0;

    for (const fetterGroup of uniqueFetterGroups) {
      try {
        await upsertEchoSetEntity(fetterGroup);
        echoSetProcessed++;
      } catch (error) {
        console.error(`Error processing ${fetterGroup.Name}:`, error);
        echoSetErrors++;
      }
    }

    console.log('\n✅ Echo set migration completed!');
    console.log(`📊 Echo Set Summary:`);
    console.log(`   - Processed: ${echoSetProcessed}`);
    console.log(`   - Errors: ${echoSetErrors}`);

    // ========================================================================
    // FINAL SUMMARY
    // ========================================================================
    console.log('\n🎉 All entity migrations completed!');
    console.log(`📊 Total Summary:`);
    console.log(
      `   - Echoes: ${echoProcessed} processed, ${echoSkipped} skipped, ${echoErrors} errors`,
    );
    console.log(`   - Weapons: ${weaponProcessed} processed, ${weaponErrors} errors`);
    console.log(
      `   - Characters: ${characterProcessed} processed, ${characterErrors} errors`,
    );
    console.log(
      `   - Echo Sets: ${echoSetProcessed} processed, ${echoSetErrors} errors`,
    );
    console.log(
      `   - Skills: ${echoSkillsProcessed} echo, ${echoSetSkillsProcessed} echo set, ${weaponSkillsProcessed} weapon, ${characterSkillsProcessed} character, ${resonantChainSkillsProcessed} resonant chain, ${skillTreeNodesProcessed} skill tree`,
    );
  } catch (error) {
    console.error('\n❌ Error during migration:', error);
    process.exit(1);
  }
};

await main();

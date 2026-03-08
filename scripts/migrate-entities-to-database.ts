#!/usr/bin/env tsx

/**
 * Script to migrate echo, weapon, character, and echo set data from encore.moe JSON files into the entities table
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { and, eq } from 'drizzle-orm';

import { database as database } from '../src/db/client';
import { capabilities, entities, skills } from '../src/db/schema';
import { EntityType, OriginType } from '../src/services/game-data';
import { CharacterStat, Tag } from '../src/types';

import type { TransformedCharacter } from './transform-character-jsons';
import type { TransformedEcho, TransformedEchoSet } from './transform-echo-jsons';
import type { TransformedWeaponData } from './transform-weapon-jsons';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ECHO_DATA_DIR = path.join(
  __dirname,
  '../.local/data/encore.moe/transformed/echo',
);
const ECHO_SET_DATA_DIR = path.join(
  __dirname,
  '../.local/data/encore.moe/transformed/echo-set',
);
const WEAPON_DATA_DIR = path.join(
  __dirname,
  '../.local/data/encore.moe/transformed/weapon',
);
const CHARACTER_DATA_DIR = path.join(
  __dirname,
  '../.local/data/encore.moe/transformed/character',
);

const insertedCounts = { entities: 0, skills: 0, capabilities: 0 };

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Map resonance chain index to sequence value (s1-s6)
 */
const mapResonanceChainIndexToSequence = (index: number): string => {
  return `s${index + 1}`;
};

// ============================================================================
// Data Processing
// ============================================================================

const loadEchoJSON = async (filePath: string): Promise<TransformedEcho | undefined> => {
  try {
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content) as TransformedEcho;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return undefined;
  }
};

const upsertEchoEntity = async (echo: TransformedEcho): Promise<void> => {
  const gameId = echo.id;
  const name = echo.name;
  const iconUrl = echo.iconUrl; // Already processed in transform
  const description = echo.skill?.simpleDescription;
  const cost = echo.cost; // Already mapped in transform
  const echoSetIds = echo.echoSetIds;

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
    insertedCounts.entities++;
    console.log(`Inserted echo: ${name} (ID: ${gameId})`);
  }
};

const upsertEchoSkill = async (echo: TransformedEcho): Promise<number> => {
  if (!echo.skill) {
    return 0;
  }

  const skillGameId = echo.skill.id;
  const name = echo.name;
  const description = echo.skill.description; // Already stripped in transform
  const iconUrl = echo.skill.battleViewIcon; // Already processed in transform
  const originType = OriginType.ECHO;

  // Find the entity ID for this echo
  const entityRecord = await database
    .select({ id: entities.id })
    .from(entities)
    .where(eq(entities.gameId, echo.id))
    .limit(1);

  if (entityRecord.length === 0) {
    console.error(`Entity not found for echo ID: ${echo.id}`);
    return 0;
  }

  const entityId = entityRecord[0].id;

  // Check if skill already exists
  const existing = await database
    .select()
    .from(skills)
    .where(
      and(
        eq(skills.gameId, skillGameId),
        eq(skills.originType, originType),
        eq(skills.entityId, entityId),
      ),
    )
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
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(skills.gameId, skillGameId),
          eq(skills.originType, originType),
          eq(skills.entityId, entityId),
        ),
      );
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
    insertedCounts.skills++;
    console.log(`  Inserted echo skill: ${name} (ID: ${skillGameId})`);
  }

  return 1;
};

// Load raw echo data from API directory for echo set skills processing
const loadEchoSetJSON = async (
  filePath: string,
): Promise<TransformedEchoSet | undefined> => {
  try {
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content) as TransformedEchoSet;
  } catch (error) {
    console.error(`Error reading echoSet ${filePath}:`, error);
    return undefined;
  }
};

const upsertEchoSetSkills = async (echoSet: TransformedEchoSet): Promise<number> => {
  let skillsProcessed = 0;
  const echoSetGameId = echoSet.id;
  for (const skill of echoSet.skills) {
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
    let skillId: number;

    // Check if skill already exists (by name and entity ID since no game ID)
    const existing = await database
      .select()
      .from(skills)
      .where(and(eq(skills.entityId, entityId), eq(skills.name, skill.name)))
      .limit(1);

    if (existing.length > 0) {
      skillId = existing[0].id;
      // Update existing skill
      await database
        .update(skills)
        .set({
          name: skill.name,
          description: skill.description,
          originType: OriginType.ECHO_SET,
        })
        .where(eq(skills.id, skillId));
      console.log(`  Updated echo set skill: ${skill.name}`);
    } else {
      // Insert new skill
      const result = await database
        .insert(skills)
        .values({
          entityId,
          name: skill.name,
          description: skill.description,
          originType: OriginType.ECHO_SET,
        })
        .returning({ id: skills.id });
      skillId = result[0].id;
      insertedCounts.skills++;
      console.log(`  Inserted echo set skill: ${skill.name}`);
    }

    // Process passive stats if present (for 2-piece bonuses)
    if (skill.value !== undefined && skill.stat !== undefined && skill.tags) {
      const statName = `${skill.name} Stat`;
      const existingStat = await database
        .select()
        .from(capabilities)
        .where(and(eq(capabilities.skillId, skillId), eq(capabilities.name, statName)))
        .limit(1);

      if (existingStat.length > 0) {
        await database
          .update(capabilities)
          .set({
            description: skill.description ?? '',
            capabilityJson: {
              type: 'permanent_stat',
              stat: skill.stat,
              value: skill.value,
              tags: skill.tags,
            },
          })
          .where(eq(capabilities.id, existingStat[0].id));
        console.log(`    Updated echo set stat: ${statName}`);
      } else {
        await database.insert(capabilities).values({
          skillId,
          name: statName,
          description: skill.description ?? '',
          capabilityJson: {
            type: 'permanent_stat',
            stat: skill.stat,
            value: skill.value,
            tags: skill.tags,
          },
        });
        insertedCounts.capabilities++;
        console.log(`    Inserted echo set stat: ${statName}`);
      }
    }

    skillsProcessed++;
  }

  return skillsProcessed;
};

const loadWeaponJSON = async (
  filePath: string,
): Promise<TransformedWeaponData | undefined> => {
  try {
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content) as TransformedWeaponData;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return undefined;
  }
};

const upsertWeaponEntity = async (weapon: TransformedWeaponData): Promise<void> => {
  const gameId = weapon.id;
  const name = weapon.name;
  const iconUrl = weapon.iconUrl; // Already processed in transform
  const rank = weapon.rank;
  const weaponType = weapon.weaponType;

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
    insertedCounts.entities++;
    console.log(`Inserted weapon: ${name} (ID: ${gameId})`);
  }
};

const upsertWeaponSkill = async (weapon: TransformedWeaponData): Promise<number> => {
  if (!weapon.description) {
    return 0;
  }

  const name = weapon.name;
  const description = weapon.description; // Already stripped and collapsed in transform
  const originType = OriginType.WEAPON;

  // Find the entity ID for this weapon
  const entityRecord = await database
    .select({ id: entities.id })
    .from(entities)
    .where(eq(entities.gameId, weapon.id))
    .limit(1);

  if (entityRecord.length === 0) {
    console.error(`Entity not found for weapon ID: ${weapon.id}`);
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
    insertedCounts.skills++;
    console.log(`  Inserted weapon skill: ${name}`);
  }

  return 1;
};

const upsertWeaponProperties = async (
  weapon: TransformedWeaponData,
): Promise<number> => {
  if (!weapon.properties) {
    return 0;
  }

  // Find the entity ID for this weapon
  const entityRecord = await database
    .select({ id: entities.id })
    .from(entities)
    .where(eq(entities.gameId, weapon.id))
    .limit(1);

  if (entityRecord.length === 0) {
    return 0;
  }

  const entityId = entityRecord[0].id;

  // Find the weapon skill (it shares the name with the weapon)
  const skillRecord = await database
    .select({ id: skills.id })
    .from(skills)
    .where(and(eq(skills.entityId, entityId), eq(skills.name, weapon.name)))
    .limit(1);

  if (skillRecord.length === 0) {
    console.error(`Skill not found for weapon: ${weapon.name}`);
    return 0;
  }

  const skillId = skillRecord[0].id;
  let statsProcessed = 0;

  for (const property of weapon.properties) {
    const { name, description, stat, value, tags } = property;

    // Check if permanent stat already exists
    const existing = await database
      .select()
      .from(capabilities)
      .where(and(eq(capabilities.skillId, skillId), eq(capabilities.name, name)))
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      await database
        .update(capabilities)
        .set({
          description,
          capabilityJson: {
            type: 'permanent_stat',
            stat: stat,
            value,
            tags: tags,
          },
        })
        .where(eq(capabilities.id, existing[0].id));
      console.log(`  Updated weapon property: ${name}`);
    } else {
      // Insert new
      await database.insert(capabilities).values({
        skillId,
        name,
        description,
        capabilityJson: {
          type: 'permanent_stat',
          stat: stat,
          value,
          tags: tags,
        },
      });
      insertedCounts.capabilities++;
      console.log(`  Inserted weapon property: ${name}`);
    }
    statsProcessed++;
  }

  return statsProcessed;
};

const loadCharacterJSON = async (
  characterId: number,
): Promise<TransformedCharacter | undefined> => {
  const filePath = path.join(CHARACTER_DATA_DIR, `${characterId}.json`);
  try {
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content) as TransformedCharacter;
  } catch (error) {
    console.error(`Error reading character ${characterId}:`, error);
    return undefined;
  }
};

const upsertCharacterEntity = async (
  character: TransformedCharacter,
): Promise<void> => {
  const gameId = character.id;
  const name = character.name;
  const iconUrl = character.iconUrl;
  const rank = character.rank;
  const weaponType = character.weaponType;
  const attribute = character.attribute;

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
    insertedCounts.entities++;
    console.log(`Inserted character: ${name} (ID: ${gameId})`);
  }
};

const upsertCharacterSkills = async (characterId: number): Promise<number> => {
  const characterData = await loadCharacterJSON(characterId);
  if (!characterData?.skills) {
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

  for (const skill of characterData.skills) {
    const skillGameId = skill.id;
    const name = skill.name;
    const description = skill.description; // Already stripped and processed in transform
    const iconUrl = skill.iconUrl; // Already processed in transform
    // type from the data matches OriginType values like "Normal Attack", "Resonance Skill", etc.
    const originType = skill.type as OriginType;

    // Check if skill already exists
    const existing = await database
      .select()
      .from(skills)
      .where(and(eq(skills.gameId, skillGameId), eq(skills.originType, originType)))
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
          updatedAt: new Date(),
        })
        .where(and(eq(skills.gameId, skillGameId), eq(skills.originType, originType)));
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
      insertedCounts.skills++;
      console.log(`  Inserted character skill: ${name} (${originType})`);
    }

    skillsProcessed++;
  }

  return skillsProcessed;
};

const upsertResonantChainSkills = async (
  characterData: TransformedCharacter,
): Promise<number> => {
  if (!characterData.resonantChain) {
    return 0;
  }

  let skillsProcessed = 0;

  // Find the entity ID for this character
  const entityRecord = await database
    .select({ id: entities.id })
    .from(entities)
    .where(eq(entities.gameId, characterData.id))
    .limit(1);

  if (entityRecord.length === 0) {
    console.error(`Entity not found for character ID: ${characterData.id}`);
    return 0;
  }

  const entityId = entityRecord[0].id;

  for (const [index, node] of characterData.resonantChain.entries()) {
    const skillGameId = node.id;
    const name = node.name; // Already cleaned in transform
    const description = node.description; // Already stripped in transform
    const iconUrl = node.iconUrl; // Already processed in transform
    // Map resonance chain index (1-6) to sequence (s1-s6)
    const originType = mapResonanceChainIndexToSequence(index) as OriginType;

    // Check if skill already exists
    const existing = await database
      .select()
      .from(skills)
      .where(and(eq(skills.gameId, skillGameId), eq(skills.originType, originType)))
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
          updatedAt: new Date(),
        })
        .where(and(eq(skills.gameId, skillGameId), eq(skills.originType, originType)));
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
      insertedCounts.skills++;
      console.log(`  Inserted resonant chain: ${name} (${originType})`);
    }

    skillsProcessed++;
  }

  return skillsProcessed;
};

const upsertCharacterBaseStatsRow = async (
  characterData: TransformedCharacter,
): Promise<number> => {
  if (!characterData.skillTree) {
    return 0;
  }

  // Find the entity ID and name for this character
  const entityRecord = await database
    .select({ id: entities.id, name: entities.name })
    .from(entities)
    .where(eq(entities.gameId, characterData.id))
    .limit(1);

  if (entityRecord.length === 0) {
    console.error(`Entity not found for character ID: ${characterData.id}`);
    return 0;
  }

  const entityId = entityRecord[0].id;
  const entityName = entityRecord[0].name;

  // Create a single "Base Stats" row for this entity
  const name = `${entityName} Base Stats`;
  const description = `Base Stats for ${entityName}`;
  const originType = OriginType.BASE_STATS;

  // Check if skill already exists (by entity ID and origin type)
  const existing = await database
    .select()
    .from(skills)
    .where(and(eq(skills.entityId, entityId), eq(skills.originType, originType)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing skill
    await database
      .update(skills)
      .set({
        name,
        description,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, existing[0].id));
    console.log(`  Updated base stats skill: ${name}`);
  } else {
    // Insert new skill
    await database.insert(skills).values({
      gameId: undefined,
      entityId,
      name,
      description,
      iconUrl: undefined,
      originType,
    });
    insertedCounts.skills++;
    console.log(`  Inserted base stats skill: ${name}`);
  }

  return 1;
};

const upsertCharacterProperties = async (
  characterData: TransformedCharacter,
): Promise<number> => {
  // Find the entity ID, name, and Base Stats skill ID
  const entityRecord = await database
    .select({ id: entities.id, name: entities.name })
    .from(entities)
    .where(eq(entities.gameId, characterData.id))
    .limit(1);

  if (entityRecord.length === 0) {
    console.error(`Entity not found for character ID: ${characterData.id}`);
    return 0;
  }

  const entityId = entityRecord[0].id;
  const entityName = entityRecord[0].name;

  // Get the Base Stats skill ID
  const baseStatsSkill = await database
    .select({ id: skills.id })
    .from(skills)
    .where(
      and(eq(skills.entityId, entityId), eq(skills.originType, OriginType.BASE_STATS)),
    )
    .limit(1);

  if (baseStatsSkill.length === 0) {
    console.error(`Base Stats skill not found for entity: ${entityName}`);
    return 0;
  }

  const skillId = baseStatsSkill[0].id;
  let statsProcessed = 0;

  for (const property of characterData.properties ?? []) {
    const name = property.name; // Already formatted in transform
    const description = property.description; // Already formatted in transform
    const stat = property.stat;
    const value = property.value;
    const tags = property.tags;

    // Check if permanent stat already exists (by skill ID and name)
    const existing = await database
      .select()
      .from(capabilities)
      .where(and(eq(capabilities.skillId, skillId), eq(capabilities.name, name)))
      .limit(1);

    if (existing.length > 0) {
      // Update existing permanent stat
      await database
        .update(capabilities)
        .set({
          description,
          capabilityJson: {
            type: 'permanent_stat',
            stat: stat as any,
            value,
            tags: tags as any,
          },
        })
        .where(eq(capabilities.id, existing[0].id));
      console.log(`  Updated property: ${name}`);
    } else {
      // Insert new permanent stat
      await database.insert(capabilities).values({
        skillId,
        name,
        description,
        capabilityJson: {
          type: 'permanent_stat',
          stat: stat as any,
          value,
          tags: tags as any,
        },
      });
      insertedCounts.capabilities++;
      console.log(`  Inserted property: ${name}`);
    }

    statsProcessed++;
  }

  return statsProcessed;
};

const upsertCharacterSkillTreeNodes = async (
  characterData: TransformedCharacter,
): Promise<number> => {
  // Find the entity ID, name, and Base Stats skill ID
  const entityRecord = await database
    .select({ id: entities.id, name: entities.name })
    .from(entities)
    .where(eq(entities.gameId, characterData.id))
    .limit(1);

  if (entityRecord.length === 0) {
    console.error(`Entity not found for character ID: ${characterData.id}`);
    return 0;
  }

  const entityId = entityRecord[0].id;
  const entityName = entityRecord[0].name;

  // Get the Base Stats skill ID
  const baseStatsSkill = await database
    .select({ id: skills.id })
    .from(skills)
    .where(
      and(eq(skills.entityId, entityId), eq(skills.originType, OriginType.BASE_STATS)),
    )
    .limit(1);

  if (baseStatsSkill.length === 0) {
    console.error(`Base Stats skill not found for entity: ${entityName}`);
    return 0;
  }

  const skillId = baseStatsSkill[0].id;
  let statsProcessed = 0;

  for (const node of characterData.skillTree ?? []) {
    const name = node.name;
    const description = node.description;
    const stat = node.stat;
    const value = node.value;
    const tags = node.tags;

    // Check if permanent stat already exists (by skill ID and name)
    const existing = await database
      .select()
      .from(capabilities)
      .where(and(eq(capabilities.skillId, skillId), eq(capabilities.name, name)))
      .limit(1);

    if (existing.length > 0) {
      // Update existing permanent stat
      await database
        .update(capabilities)
        .set({
          description,
          capabilityJson: {
            type: 'permanent_stat',
            stat: stat,
            value,
            tags: tags,
          },
        })
        .where(eq(capabilities.id, existing[0].id));
      console.log(`  Updated skill tree node: ${name}`);
    } else {
      // Insert new permanent stat
      await database.insert(capabilities).values({
        skillId,
        name,
        description,
        capabilityJson: {
          type: 'permanent_stat',
          stat: stat,
          value,
          tags: tags,
        },
      });
      insertedCounts.capabilities++;
      console.log(`  Inserted skill tree node: ${name}`);
    }

    statsProcessed++;
  }

  return statsProcessed;
};

const upsertCharacterDefaultBaseStats = async (
  characterData: TransformedCharacter,
): Promise<number> => {
  const entityRecord = await database
    .select({ id: entities.id, name: entities.name })
    .from(entities)
    .where(eq(entities.gameId, characterData.id))
    .limit(1);

  if (entityRecord.length === 0) {
    console.error(`Entity not found for character ID: ${characterData.id}`);
    return 0;
  }

  const entityId = entityRecord[0].id;
  const entityName = entityRecord[0].name;

  const baseStatsSkill = await database
    .select({ id: skills.id })
    .from(skills)
    .where(
      and(eq(skills.entityId, entityId), eq(skills.originType, OriginType.BASE_STATS)),
    )
    .limit(1);

  if (baseStatsSkill.length === 0) {
    console.error(`Base Stats skill not found for entity: ${entityName}`);
    return 0;
  }

  const skillId = baseStatsSkill[0].id;
  const defaultBaseStats = [
    {
      label: 'Crit. Rate',
      stat: CharacterStat.CRITICAL_RATE,
      value: 0.05,
    },
    {
      label: 'Crit. DMG',
      stat: CharacterStat.CRITICAL_DAMAGE,
      value: 0.5,
    },
    {
      label: 'Energy Regen',
      stat: CharacterStat.ENERGY_REGEN,
      value: 1,
    },
  ] as const;

  let processedCount = 0;

  for (const baseStat of defaultBaseStats) {
    const name = `${entityName} Base ${baseStat.label}`;
    const description = `Base ${baseStat.label} for ${entityName} at level 90.`;

    const existing = await database
      .select()
      .from(capabilities)
      .where(and(eq(capabilities.skillId, skillId), eq(capabilities.name, name)))
      .limit(1);

    if (existing.length > 0) {
      await database
        .update(capabilities)
        .set({
          description,
          capabilityJson: {
            type: 'permanent_stat',
            stat: baseStat.stat,
            value: baseStat.value,
            tags: [Tag.ALL],
          },
        })
        .where(eq(capabilities.id, existing[0].id));
      console.log(`  Updated default base stat: ${name}`);
    } else {
      await database.insert(capabilities).values({
        skillId,
        name,
        description,
        capabilityJson: {
          type: 'permanent_stat',
          stat: baseStat.stat,
          value: baseStat.value,
          tags: [Tag.ALL],
        },
      });
      insertedCounts.capabilities++;
      console.log(`  Inserted default base stat: ${name}`);
    }

    processedCount++;
  }

  return processedCount;
};

const upsertEchoSetEntity = async (echoSet: TransformedEchoSet): Promise<void> => {
  const gameId = echoSet.id;
  const name = echoSet.name;
  const iconUrl = echoSet.iconUrl;
  const setBonusThresholds = echoSet.setBonusThresholds;

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
    insertedCounts.entities++;
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
    let echoErrors = 0;
    let echoSkillsProcessed = 0;

    for (const file of echoJsonFiles) {
      const filePath = path.join(ECHO_DATA_DIR, file);
      const echo = await loadEchoJSON(filePath);

      if (!echo) {
        echoErrors++;
        continue;
      }

      try {
        await upsertEchoEntity(echo);
        echoSkillsProcessed += await upsertEchoSkill(echo);
        echoProcessed++;
      } catch (error) {
        console.error(`Error processing ${echo.name}:`, error, file);
        echoErrors++;
      }
    }

    console.log('\n✅ Echo migration completed!');
    console.log(`📊 Echo Summary:`);
    console.log(`   - Processed: ${echoProcessed}`);
    console.log(`   - Errors: ${echoErrors}`);
    console.log(`   - Echo Skills: ${echoSkillsProcessed}`);

    // ========================================================================
    // WEAPONS
    // ========================================================================
    console.log('\n=== Processing Weapons ===\n');

    const weaponFiles = await readdir(WEAPON_DATA_DIR);
    const weaponJsonFiles = weaponFiles.filter((file) => file.endsWith('.json'));

    console.log(`Found ${weaponJsonFiles.length} weapon files\n`);

    let weaponProcessed = 0;
    let weaponErrors = 0;
    let weaponSkillsProcessed = 0;
    let weaponPropertiesProcessed = 0;

    for (const file of weaponJsonFiles) {
      const filePath = path.join(WEAPON_DATA_DIR, file);
      const weapon = await loadWeaponJSON(filePath);

      if (!weapon) {
        weaponErrors++;
        continue;
      }

      try {
        await upsertWeaponEntity(weapon);
        weaponSkillsProcessed += await upsertWeaponSkill(weapon);
        weaponPropertiesProcessed += await upsertWeaponProperties(weapon);
        weaponProcessed++;
      } catch (error) {
        console.error(`Error processing ${weapon.name}:`, error, file);
        weaponErrors++;
      }
    }

    console.log('\n✅ Weapon migration completed!');
    console.log(`📊 Weapon Summary:`);
    console.log(`   - Processed: ${weaponProcessed}`);
    console.log(`   - Errors: ${weaponErrors}`);
    console.log(`   - Weapon Skills: ${weaponSkillsProcessed}`);
    console.log(`   - Weapon Properties: ${weaponPropertiesProcessed}`);

    // ========================================================================
    // CHARACTERS
    // ========================================================================
    console.log('\n=== Processing Characters ===\n');

    const characterFiles = await readdir(CHARACTER_DATA_DIR);
    const characterJsonFiles = characterFiles.filter((file) => file.endsWith('.json'));

    console.log(`Found ${characterJsonFiles.length} character files\n`);

    let characterProcessed = 0;
    let characterErrors = 0;
    let characterSkillsProcessed = 0;
    let resonantChainSkillsProcessed = 0;
    let skillTreeNodesProcessed = 0;
    let propertiesProcessed = 0;
    let skillTreePermanentStatsProcessed = 0;
    let defaultBaseStatsProcessed = 0;

    for (const file of characterJsonFiles) {
      const filePath = path.join(CHARACTER_DATA_DIR, file);

      let character: TransformedCharacter;
      try {
        const content = await readFile(filePath, 'utf8');
        character = JSON.parse(content) as TransformedCharacter;
      } catch (error) {
        console.error(`Error reading ${file}:`, error);
        characterErrors++;
        continue;
      }

      // Skip specific characters
      if ([1605, 1408, 1502].includes(character.id)) {
        console.log(`⏭️  Skipping character: ${character.name} (${character.id})`);
        continue;
      }

      try {
        await upsertCharacterEntity(character);
        characterSkillsProcessed += await upsertCharacterSkills(character.id);
        resonantChainSkillsProcessed += await upsertResonantChainSkills(character);
        skillTreeNodesProcessed += await upsertCharacterBaseStatsRow(character);
        propertiesProcessed += await upsertCharacterProperties(character);
        skillTreePermanentStatsProcessed +=
          await upsertCharacterSkillTreeNodes(character);
        defaultBaseStatsProcessed += await upsertCharacterDefaultBaseStats(character);
        characterProcessed++;
      } catch (error) {
        console.error(`Error processing ${character.name}:`, error, file);
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
    console.log(`   - Properties (Permanent Stats): ${propertiesProcessed}`);
    console.log(
      `   - Skill Tree (Permanent Stats): ${skillTreePermanentStatsProcessed}`,
    );
    console.log(`   - Default Base Stats: ${defaultBaseStatsProcessed}`);

    // ========================================================================
    // ECHO SETS
    // ========================================================================
    console.log('\n=== Processing Echo Sets ===\n');
    const echoSetFiles = await readdir(ECHO_SET_DATA_DIR);
    const echoSetJsonFiles = echoSetFiles.filter((file) => file.endsWith('.json'));

    console.log(`Found ${echoSetJsonFiles.length} character files\n`);

    let echoSetProcessed = 0;
    let echoSetErrors = 0;
    let echoSetSkillsProcessed = 0;

    for (const file of echoSetJsonFiles) {
      const filePath = path.join(ECHO_SET_DATA_DIR, file);
      const echoSet = await loadEchoSetJSON(filePath);
      if (!echoSet) {
        continue;
      }

      try {
        await upsertEchoSetEntity(echoSet);
        echoSetSkillsProcessed += await upsertEchoSetSkills(echoSet);
        echoSetProcessed++;
      } catch (error) {
        console.error(`Error processing ${echoSet.name}:`, error, file);
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
    console.log(`📊 Inserted (new records only):`);
    console.log(`   - Entities:      ${insertedCounts.entities}`);
    console.log(`   - Skills:        ${insertedCounts.skills}`);
    console.log(`   - Capabilities:  ${insertedCounts.capabilities}`);
    console.log(`📊 Total Summary:`);
    console.log(`   - Echoes: ${echoProcessed} processed, ${echoErrors} errors`);
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
    console.log(
      `   - Permanent Stats: ${propertiesProcessed} properties, ${skillTreePermanentStatsProcessed} skill tree nodes, ${weaponPropertiesProcessed} weapon properties`,
    );
    console.log(`   - Default Base Stats: ${defaultBaseStatsProcessed}`);
  } catch (error) {
    console.error('\n❌ Error during migration:', error);
    process.exit(1);
  }
};

await main();

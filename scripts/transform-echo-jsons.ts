#!/usr/bin/env tsx

/**
 * Transform echo JSON files
 *
 * This script processes raw echo JSON files from encore.moe API and transforms them
 * to include only the fields needed for the database:
 * - Entity: MonsterId (gameId), MonsterName (name), IconSmall (iconUrl), Rarity (cost)
 * - Skill: Id, DescriptionEx (description), SimplyDescription, BattleViewIcon, LevelDescStrArray (descriptionParams)
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  collapseArrayValues,
  convertValueToNumber,
  processIconPath,
  stripHtmlTags,
} from './transform-helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ECHO_DATA_DIR = path.join(__dirname, '../.local/data/encore.moe/api/en/echo');
const ECHO_INDEX_PATH = path.join(ECHO_DATA_DIR, 'index.json');
const OUTPUT_DIR = path.join(__dirname, '../.local/data/encore.moe/transformed/echo');
const ECHO_SET_OUTPUT_DIR = path.join(
  __dirname,
  '../.local/data/encore.moe/transformed/echo-set',
);

// ============================================================================
// Types - Input (encore.moe API structure)
// ============================================================================

interface DescParameter {
  ArrayString: Array<string>;
}

interface EchoSkill {
  Id: number;
  DescriptionEx?: string;
  SimplyDescription?: string;
  BattleViewIcon?: string;
  LevelDescStrArray?: Array<DescParameter>;
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
  PhantomType?: number;
  FetterGroup?: Array<number>;
  Skill?: EchoSkill;
  FetterGroupDetails?: Array<{
    Group: {
      Id: number;
      FetterGroupName: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
  FetterDetails?: Record<string, FetterDetailsEntry>;
  [key: string]: unknown;
}

// Echo index types
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
// Types - Output (transformed structure)
// ============================================================================

export interface TransformedDescParameter {
  values: Array<number>;
}

export interface TransformedEchoSkill {
  id: number;
  description?: string;
  simpleDescription?: string;
  battleViewIcon?: string;
  descriptionParams?: Array<TransformedDescParameter>;
}

export interface TransformedEcho {
  id: number;
  name: string;
  iconUrl?: string;
  cost: number;
  echoSetIds?: Array<number>;
  skill?: TransformedEchoSkill;
}

export interface TransformedEchoSetSkill {
  name: string;
  threshold: number;
  description?: string;
}

export interface TransformedEchoSet {
  id: number;
  name: string;
  iconUrl?: string;
  setBonusThresholds: Array<number>;
  skills: Array<TransformedEchoSetSkill>;
}

// ============================================================================
// Constants
// ============================================================================

const RARITY_TO_COST_MAP: Record<number, number> = {
  0: 1,
  1: 3,
  2: 4,
};

const mapRarityToCost = (rarity: number): number => {
  return RARITY_TO_COST_MAP[rarity] ?? 1;
};

// ============================================================================
// Main Processing
// ============================================================================

const transformEchoJSON = async (
  inputFilePath: string,
  outputFilePath: string,
  echo: EchoData,
): Promise<void> => {
  try {
    // Extract only the fields we want
    const transformed: TransformedEcho = {
      id: echo.MonsterId,
      name: echo.MonsterName,
      iconUrl: processIconPath(echo.IconSmall),
      cost: mapRarityToCost(echo.Rarity),
    };

    // Add echo set IDs if available
    if (echo.FetterGroup !== undefined && Array.isArray(echo.FetterGroup)) {
      transformed.echoSetIds = echo.FetterGroup;
    }

    // Transform Skill if available
    if (echo.Skill !== undefined) {
      const skill = echo.Skill;

      transformed.skill = {
        id: skill.Id,
        description: stripHtmlTags(skill.DescriptionEx),
        simpleDescription: skill.SimplyDescription,
        battleViewIcon: processIconPath(skill.BattleViewIcon),
      };

      // Transform LevelDescStrArray: take the last element and convert values to numbers
      if (
        skill.LevelDescStrArray !== undefined &&
        Array.isArray(skill.LevelDescStrArray)
      ) {
        const lastElement = skill.LevelDescStrArray.at(-1);

        if (lastElement) {
          transformed.skill.descriptionParams = [
            {
              values: collapseArrayValues(
                lastElement.ArrayString.map((value) => convertValueToNumber(value)),
              ),
            },
          ];
        }
      }
    }

    // Write to output directory
    await writeFile(outputFilePath, JSON.stringify(transformed, undefined, 2) + '\n');
    console.log(`✓ Transformed: ${path.basename(inputFilePath)}`);
  } catch (error) {
    console.error(`✗ Error transforming ${path.basename(inputFilePath)}:`, error);
    throw error;
  }
};

const shouldSkipEcho = (echo: EchoData): boolean => {
  return (
    echo.TypeDescription === 'Phantom Appearance' ||
    echo.MonsterName.startsWith('Phantom:') ||
    echo.PhantomType === 2
  );
};

// ============================================================================
// Echo Set Processing
// ============================================================================

const loadEchoIndex = async (): Promise<EchoIndex | undefined> => {
  try {
    const content = await readFile(ECHO_INDEX_PATH, 'utf8');
    return JSON.parse(content) as EchoIndex;
  } catch (error) {
    console.error('Error reading echo index:', error);
    return undefined;
  }
};

const transformEchoSet = (
  fetterGroup: FetterGroup,
  echoSetSkillsMap: Map<number, Array<TransformedEchoSetSkill>>,
): TransformedEchoSet => {
  const transformed: TransformedEchoSet = {
    id: fetterGroup.Id,
    name: fetterGroup.Name,
    iconUrl: processIconPath(fetterGroup.Icon),
    setBonusThresholds: fetterGroup.Fetters.length === 2 ? [2, 5] : [3],
    skills: echoSetSkillsMap.get(fetterGroup.Id) ?? [],
  };

  return transformed;
};

// ============================================================================
// Main Entry Point
// ============================================================================

const main = async () => {
  console.log('Starting echo and echo set transformation...\n');

  try {
    // Create output directories if they don't exist
    await mkdir(OUTPUT_DIR, { recursive: true });
    await mkdir(ECHO_SET_OUTPUT_DIR, { recursive: true });

    // Load echo index for FetterGroup data
    console.log('Loading echo index...');
    const echoIndex = await loadEchoIndex();
    if (!echoIndex) {
      console.error('Failed to load echo index');
      process.exit(1);
    }

    // Collect all unique FetterGroups from the echo index
    const fetterGroupMap = new Map<number, FetterGroup>();
    for (const echo of echoIndex.Echo) {
      if (!echo.FetterGroups || echo.FetterGroups.length === 0) {
        continue;
      }
      for (const fetterGroup of echo.FetterGroups) {
        if (!fetterGroupMap.has(fetterGroup.Id)) {
          fetterGroupMap.set(fetterGroup.Id, fetterGroup);
        }
      }
    }

    console.log(`Found ${fetterGroupMap.size} unique echo sets\n`);

    // Map to collect FetterDetails for each echo set: setId -> setName -> skills
    const echoSetDetailsMap = new Map<
      number,
      Map<string, Array<TransformedEchoSetSkill>>
    >();

    // Read all JSON files from input directory
    const files = await readdir(ECHO_DATA_DIR);
    const jsonFiles = files.filter(
      (file) => file.endsWith('.json') && file !== 'index.json',
    );

    console.log(`Found ${jsonFiles.length} echo files\n`);

    let echoProcessed = 0;
    let echoSkipped = 0;
    let echoErrors = 0;

    for (const file of jsonFiles) {
      const inputPath = path.join(ECHO_DATA_DIR, file);
      const outputPath = path.join(OUTPUT_DIR, file);

      try {
        // Read the file to check if we should skip it
        const content = await readFile(inputPath, 'utf8');
        const echo = JSON.parse(content) as EchoData;

        if (shouldSkipEcho(echo)) {
          console.log(`⏭️  Skipping: ${echo.MonsterName} (${file})`);
          echoSkipped++;
          continue;
        }

        // Collect FetterDetails for echo sets
        if (echo.FetterGroupDetails && echo.FetterDetails) {
          for (const fetterGroupDetail of echo.FetterGroupDetails) {
            const setId = fetterGroupDetail.Group.Id;
            const setName = fetterGroupDetail.Group.FetterGroupName;

            if (!(setName in echo.FetterDetails)) {
              continue;
            }

            const fetterDetails = echo.FetterDetails[setName];
            const thresholds =
              fetterDetails.EffectDescriptions.length === 2 ? [2, 5] : [3];

            // Create skills for this echo set
            const skills: Array<TransformedEchoSetSkill> = thresholds.map(
              (threshold, index) => ({
                name: `${setName} - ${threshold}`,
                threshold,
                description: stripHtmlTags(fetterDetails.EffectDescriptions[index]),
              }),
            );

            // Store in map (setId -> setName -> skills)
            if (!echoSetDetailsMap.has(setId)) {
              echoSetDetailsMap.set(setId, new Map());
            }
            const setDetailsMap = echoSetDetailsMap.get(setId)!;
            if (!setDetailsMap.has(setName)) {
              setDetailsMap.set(setName, skills);
            }
          }
        }

        await transformEchoJSON(inputPath, outputPath, echo);
        echoProcessed++;
      } catch (error) {
        console.error(`✗ Error processing ${file}:`, error);
        echoErrors++;
      }
    }

    console.log('\n✅ Echo transformation completed!');
    console.log(`📊 Echo Summary:`);
    console.log(`   - Processed: ${echoProcessed}`);
    console.log(`   - Skipped: ${echoSkipped}`);
    console.log(`   - Errors: ${echoErrors}`);
    console.log(`\n📁 Output files saved to: ${OUTPUT_DIR}`);

    // ========================================================================
    // ECHO SETS
    // ========================================================================
    console.log('\n=== Processing Echo Sets ===\n');

    let echoSetProcessed = 0;
    let echoSetErrors = 0;

    for (const fetterGroup of fetterGroupMap.values()) {
      try {
        // Get all skills for this echo set from all collected FetterDetails
        const allSkills: Array<TransformedEchoSetSkill> = [];
        const setDetailsMap = echoSetDetailsMap.get(fetterGroup.Id);

        if (setDetailsMap) {
          // Take skills from the first entry (they should all be the same)
          const firstSkills = [...setDetailsMap.values()][0];
          allSkills.push(...firstSkills);
        }

        const transformed = await transformEchoSet(
          fetterGroup,
          new Map([[fetterGroup.Id, allSkills]]),
        );

        const outputPath = path.join(ECHO_SET_OUTPUT_DIR, `${fetterGroup.Id}.json`);
        await writeFile(outputPath, JSON.stringify(transformed, undefined, 2) + '\n');

        console.log(`✓ Transformed echo set: ${fetterGroup.Name} (${fetterGroup.Id})`);
        echoSetProcessed++;
      } catch (error) {
        console.error(`✗ Error processing echo set ${fetterGroup.Name}:`, error);
        echoSetErrors++;
      }
    }

    console.log('\n✅ Echo set transformation completed!');
    console.log(`📊 Echo Set Summary:`);
    console.log(`   - Processed: ${echoSetProcessed}`);
    console.log(`   - Errors: ${echoSetErrors}`);
    console.log(`\n📁 Output files saved to: ${ECHO_SET_OUTPUT_DIR}`);
  } catch (error) {
    console.error('\n❌ Error during transformation:', error);
    process.exit(1);
  }
};

await main();

#!/usr/bin/env tsx

/**
 * Transform character JSON files for AI consumption
 *
 * This script takes the output from transform-character-jsons.ts and
 * further optimizes it by removing fields not needed for AI processing:
 * - Properties field (base stats)
 * - SkillTree field (stat bonuses)
 * - iconUrl, id from ResonantChain
 * - type, name, iconUrl from Skills
 * - rank, weaponType, attribute, iconUrl from Character
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  TransformedCharacter,
  TransformedSkillAttribute,
} from './transform-character-jsons';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIR = path.join(
  __dirname,
  '../.local/data/encore.moe/transformed/character',
);
const OUTPUT_DIR = path.join(
  __dirname,
  '../.local/data/encore.moe/transformed/character-ai',
);

// ============================================================================
// Output Types (AI-optimized)
// ============================================================================

interface AISkill {
  id: number;
  description?: string;
  attributes?: Array<TransformedSkillAttribute>;
}

interface AIResonantChainNode {
  id: number;
  name: string;
  description?: string;
  descriptionParams?: Array<number>;
}

interface AICharacterData {
  id: number;
  name: string;
  skills?: Array<AISkill>;
  resonantChain?: Array<AIResonantChainNode>;
}

// ============================================================================
// Transformation Functions
// ============================================================================

/**
 * Transform character data for AI consumption
 */
const transformForAI = (input: TransformedCharacter): AICharacterData => {
  const output: AICharacterData = {
    id: input.id,
    name: input.name,
  };

  // Transform Skills: remove type, name, iconUrl
  if (input.skills !== undefined && Array.isArray(input.skills)) {
    output.skills = input.skills.map((skill) => ({
      id: skill.id,
      description: skill.description,
      attributes: skill.attributes,
    }));
  }

  // Transform ResonantChain: remove iconUrl
  if (input.resonantChain !== undefined && Array.isArray(input.resonantChain)) {
    output.resonantChain = input.resonantChain.map((node) => ({
      id: node.id,
      name: node.name,
      description: node.description,
      descriptionParams: node.descriptionParams,
    }));
  }

  // Properties and skillTree are excluded (not added to output)
  // rank, weaponType, attribute, iconUrl are also excluded

  return output;
};

// ============================================================================
// Main Entry Point
// ============================================================================

const main = async () => {
  console.log('Starting AI-optimized character transformation...\n');

  try {
    // Create output directory if it doesn't exist
    await mkdir(OUTPUT_DIR, { recursive: true });

    // Read all JSON files from input directory
    const files = await readdir(INPUT_DIR);
    const jsonFiles = files.filter((file) => file.endsWith('.json'));

    console.log(`Found ${jsonFiles.length} character files to transform\n`);

    let processed = 0;
    let errors = 0;

    for (const file of jsonFiles) {
      const inputPath = path.join(INPUT_DIR, file);
      const outputPath = path.join(OUTPUT_DIR, file);

      try {
        // Read input file
        const content = await readFile(inputPath, 'utf8');
        const inputData = JSON.parse(content) as TransformedCharacter;

        // Transform for AI
        const outputData = transformForAI(inputData);

        // Write output file
        await writeFile(outputPath, JSON.stringify(outputData, undefined, 2) + '\n');

        console.log(`✓ Processed: ${inputData.name} (${file})`);
        processed++;
      } catch (error) {
        console.error(`✗ Error processing ${file}:`, error);
        errors++;
      }
    }

    console.log('\n✅ AI-optimized transformation completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Processed: ${processed}`);
    console.log(`   - Errors: ${errors}`);
    console.log(`\n📁 Output files saved to: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('\n❌ Error during transformation:', error);
    process.exit(1);
  }
};

await main();

#!/usr/bin/env tsx

/**
 * Transform weapon JSON files for AI consumption
 *
 * This script takes the output from transform-weapon-jsons.ts and
 * further optimizes it by removing fields not needed for AI processing:
 * - iconUrl
 * - weaponType
 * - rank
 * - properties
 * - descriptionParams
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  TransformedDescParameter,
  TransformedWeaponData,
} from './transform-weapon-jsons';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIR = path.join(__dirname, '../.local/data/encore.moe/transformed/weapon');
const OUTPUT_DIR = path.join(
  __dirname,
  '../.local/data/encore.moe/transformed/weapon-ai',
);

// ============================================================================
// Output Types (AI-optimized)
// ============================================================================

interface AIWeaponData {
  id: number;
  name: string;
  description?: string;
  descriptionParams?: Array<TransformedDescParameter>;
}

// ============================================================================
// Transformation Functions
// ============================================================================

/**
 * Transform weapon data for AI consumption
 */
const transformForAI = (input: TransformedWeaponData): AIWeaponData => {
  const output: AIWeaponData = {
    id: input.id,
    name: input.name,
    description: input.description,
    descriptionParams: input.descriptionParams,
  };

  return output;
};

// ============================================================================
// Main Entry Point
// ============================================================================

const main = async () => {
  console.log(String.raw`Starting AI-optimized weapon transformation...\n`);

  try {
    // Create output directory if it doesn't exist
    await mkdir(OUTPUT_DIR, { recursive: true });

    // Read all JSON files from input directory
    const files = await readdir(INPUT_DIR);
    const jsonFiles = files.filter((file) => file.endsWith('.json'));

    console.log(String.raw`Found ${jsonFiles.length} weapon files to transform\n`);

    let processed = 0;
    let errors = 0;

    for (const file of jsonFiles) {
      const inputPath = path.join(INPUT_DIR, file);
      const outputPath = path.join(OUTPUT_DIR, file);

      try {
        // Read input file
        const content = await readFile(inputPath, 'utf8');
        const inputData = JSON.parse(content) as TransformedWeaponData;

        // Transform for AI
        const outputData = transformForAI(inputData);

        // Write output file
        await writeFile(outputPath, JSON.stringify(outputData, undefined, 2));

        console.log(`✓ Processed: ${inputData.name} (${file})`);
        processed++;
      } catch (error) {
        console.error(`✗ Error processing ${file}:`, error);
        errors++;
      }
    }

    console.log(String.raw`\n✅ AI-optimized transformation completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Processed: ${processed}`);
    console.log(`   - Errors: ${errors}`);
    console.log(String.raw`\n📁 Output files saved to: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error(String.raw`\n❌ Error during transformation:`, error);
    process.exit(1);
  }
};

await main();

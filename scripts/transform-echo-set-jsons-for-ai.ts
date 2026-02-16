#!/usr/bin/env tsx

/**
 * Transform echo set JSON files for AI consumption
 *
 * This script takes the output from transform-echo-jsons.ts (specifically for sets) and
 * further optimizes it by removing fields not needed for AI processing:
 * - iconUrl
 * - setBonusThresholds
 * - 2-piece effects (filter skills by threshold)
 * - passiveStatBonuses (handled by removal of 2-piece skill or specific field if present)
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { TransformedEchoSet } from './transform-echo-jsons';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIR = path.join(
  __dirname,
  '../.local/data/encore.moe/transformed/echo-set',
);
const OUTPUT_DIR = path.join(
  __dirname,
  '../.local/data/encore.moe/transformed/echo-set-ai',
);

// ============================================================================
// Output Types (AI-optimized)
// ============================================================================

interface AIEchoSetSkill {
  name: string;
  threshold: number;
  description?: string;
}

interface AIEchoSetData {
  id: number;
  name: string;
  skills: Array<AIEchoSetSkill>;
}

// ============================================================================
// Transformation Functions
// ============================================================================

/**
 * Transform echo set data for AI consumption
 */
const transformForAI = (input: TransformedEchoSet): AIEchoSetData => {
  // Filter out 2-piece effects (keep threshold > 2)
  const skills = input.skills
    .filter((skill) => skill.threshold > 2)
    .map((skill) => ({
      name: skill.name,
      threshold: skill.threshold,
      description: skill.description,
    }));

  const output: AIEchoSetData = {
    id: input.id,
    name: input.name,
    skills: skills,
  };

  return output;
};

// ============================================================================
// Main Entry Point
// ============================================================================

const main = async () => {
  console.log(String.raw`Starting AI-optimized echo set transformation...\n`);

  try {
    // Create output directory if it doesn't exist
    await mkdir(OUTPUT_DIR, { recursive: true });

    // Read all JSON files from input directory
    const files = await readdir(INPUT_DIR);
    const jsonFiles = files.filter((file) => file.endsWith('.json'));

    console.log(String.raw`Found ${jsonFiles.length} echo set files to transform\n`);

    let processed = 0;
    let errors = 0;

    for (const file of jsonFiles) {
      const inputPath = path.join(INPUT_DIR, file);
      const outputPath = path.join(OUTPUT_DIR, file);

      try {
        // Read input file
        const content = await readFile(inputPath, 'utf8');
        const inputData = JSON.parse(content) as TransformedEchoSet;

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

#!/usr/bin/env tsx

/**
 * Script to transform weapon JSON files from encore.moe to keep only essential fields:
 * - ItemId
 * - WeaponName
 * - QualityId
 * - WeaponType
 * - Desc (with HTML stripped and repeated values collapsed)
 * - DescParams (with values collapsed)
 * - Properties
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { WeaponType } from '../src/types/weapon';

import {
  collapseArrayValues,
  collapseRepeatedValues,
  convertValueToNumber,
  mapWeaponType,
  processIconPath,
  stripHtmlTags,
} from './transform-helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEAPON_DATA_DIR = path.join(__dirname, '../.local/data/encore.moe/api/en/weapon');
const OUTPUT_DIR = path.join(__dirname, '../.local/data/encore.moe/transformed/weapon');

// ============================================================================
// Types
// ============================================================================

interface GrowthValue {
  Level: number;
  Value: string;
}

interface Property {
  Name: string;
  Icon?: string;
  BaseValue?: number;
  GrowthValues: Array<GrowthValue>;
  [key: string]: unknown;
}

interface TransformedProperty {
  name: string;
  maxValue: number;
}

interface DescParameter {
  ArrayString: Array<string>;
}

interface TransformedDescParameter {
  values: Array<number>;
}

interface WeaponData {
  ItemId: number;
  WeaponName: string;
  QualityId: number;
  WeaponType: number;
  IconSmall?: string;
  Desc?: string;
  DescParams?: Array<DescParameter>;
  Properties?: Array<Property>;
  [key: string]: unknown;
}

export interface TransformedWeaponData {
  id: number;
  name: string;
  rank: number;
  weaponType: WeaponType;
  iconUrl?: string;
  description?: string;
  descriptionParams?: Array<TransformedDescParameter>;
  properties?: Array<TransformedProperty>;
}

// ============================================================================
// Main Processing
// ============================================================================

const transformWeaponJSON = async (
  inputFilePath: string,
  outputFilePath: string,
): Promise<void> => {
  try {
    const content = await readFile(inputFilePath, 'utf8');
    const fullData = JSON.parse(content) as WeaponData;

    // Extract only the fields we want
    const transformed: TransformedWeaponData = {
      id: fullData.ItemId,
      name: fullData.WeaponName,
      rank: fullData.QualityId,
      weaponType: mapWeaponType(fullData.WeaponType),
      iconUrl: processIconPath(fullData.IconSmall),
    };

    // Transform description: strip HTML tags and collapse repeated values
    if (fullData.Desc !== undefined) {
      let desc = stripHtmlTags(fullData.Desc);
      desc = collapseRepeatedValues(desc);
      transformed.description = desc;
    }

    // Transform descriptionParams: convert to numbers and collapse repeated values
    if (fullData.DescParams !== undefined && Array.isArray(fullData.DescParams)) {
      transformed.descriptionParams = fullData.DescParams.map((parameter) => ({
        values: collapseArrayValues(
          parameter.ArrayString.map((value) => convertValueToNumber(value)),
        ),
      }));
    }

    // Transform properties to only include name and maxValue
    if (fullData.Properties !== undefined && Array.isArray(fullData.Properties)) {
      transformed.properties = fullData.Properties.map((property) => {
        const lastGrowthValue = property.GrowthValues.at(-1);

        return {
          name: property.Name,
          maxValue: convertValueToNumber(lastGrowthValue!.Value),
        };
      });
    }

    // Write to output directory
    await writeFile(outputFilePath, JSON.stringify(transformed, undefined, 2) + '\n');
    console.log(`✓ Transformed: ${path.basename(inputFilePath)}`);
  } catch (error) {
    console.error(`✗ Error transforming ${inputFilePath}:`, error);
  }
};

const main = async () => {
  console.log('🔄 Starting weapon JSON transformation...\n');
  console.log(`Input directory:  ${WEAPON_DATA_DIR}`);
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  try {
    // Create output directory if it doesn't exist
    await mkdir(OUTPUT_DIR, { recursive: true });

    // Read all files in the weapon directory
    const files = await readdir(WEAPON_DATA_DIR);

    // Filter for JSON files (excluding index.json)
    const weaponJsonFiles = files.filter(
      (file) => file.endsWith('.json') && file !== 'index.json',
    );

    console.log(`Found ${weaponJsonFiles.length} weapon files\n`);

    let processed = 0;
    let errors = 0;

    // Process each weapon file
    for (const file of weaponJsonFiles) {
      const inputFilePath = path.join(WEAPON_DATA_DIR, file);
      const outputFilePath = path.join(OUTPUT_DIR, file);
      try {
        await transformWeaponJSON(inputFilePath, outputFilePath);
        processed++;
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
        errors++;
      }
    }

    console.log('\n✅ Transformation completed!');
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

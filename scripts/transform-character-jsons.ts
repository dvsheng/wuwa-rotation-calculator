#!/usr/bin/env tsx

/**
 * Script to transform character JSON files from encore.moe to keep only essential fields:
 * - Id
 * - Properties
 * - Skills
 * - SkillTree
 * - ResonantChain
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Attribute } from '../src/types/attribute';
import { CharacterStat } from '../src/types/character';
import { Tag } from '../src/types/tag';
import type { WeaponType } from '../src/types/weapon';

import {
  convertValueToNumber,
  mapElementNameToAttribute,
  mapStatNameToCharacterStat,
  mapWeaponType,
  processIconPath,
  stripHtmlTags,
} from './transform-helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHARACTER_DATA_DIR = path.join(
  __dirname,
  '../.local/data/encore.moe/api/en/character',
);
const OUTPUT_DIR = path.join(
  __dirname,
  '../.local/data/encore.moe/transformed/character',
);

// ============================================================================
// Types
// ============================================================================

interface GrowthValue {
  growthId: number;
  level: number;
  value: number;
}

interface Property {
  Icon?: string;
  Name: string;
  BaseValue?: number;
  GrowthValues: Array<GrowthValue>;
  [key: string]: unknown;
}

export interface TransformedProperty {
  name: string;
  description: string;
  value: number;
  stat: CharacterStat;
  tags: Array<string>;
}

export interface SkillAttribute {
  attributeId: number;
  attributeName: string;
  values: Array<string>;
  Description?: string;
  SkillDetailNum?: unknown; // Will be excluded in transformation
  [key: string]: unknown;
}

interface DamageListItem {
  EntryNumber: number;
  Id: number;
  Type: string;
  DmgType: string;
  PropertyName: string;
  RateLv: Array<string>;
  Energy?: Array<number>;
  [key: string]: unknown;
}

interface Skill {
  SkillId: number;
  SkillType: string;
  SkillName: string;
  SkillDescribe?: string;
  Icon?: string;
  SkillMedia?: string;
  SkillAttributes?: Array<SkillAttribute>;
  DamageList?: Array<DamageListItem>; // Will be excluded in transformation
  SkillDetailNum?: unknown; // Will be excluded in transformation
  [key: string]: unknown;
}

export interface TransformedSkillAttribute {
  id: number;
  name: string;
  value: Array<number>;
}

export interface TransformedSkill {
  id: number;
  type: string;
  name: string;
  description?: string;
  iconUrl?: string;
  attributes?: Array<TransformedSkillAttribute>;
}

interface SkillTreeNode {
  Id: number;
  PropertyNodeTitle: string;
  PropertyNodeDescribe?: string;
  PropertyNodeIcon?: string;
  Consume?: Array<unknown>;
  [key: string]: unknown;
}

interface TransformedSkillTreeNode {
  id: number;
  name: string;
  description?: string;
  iconUrl?: string;
  stat: CharacterStat;
  value: number;
  tags: Array<string>;
}

interface ResonantChainNode {
  Id: number;
  NodeName: string;
  AttributesDescription?: string;
  AttributesDescriptionParams?: Array<string | number>;
  NodeIcon?: string;
  GroupIndex?: number;
  NodeType?: string | number;
  NodeIndex?: number;
  BgDescription?: string;
  BuffIds?: unknown;
  AddProp?: unknown;
  ActivateConsume?: unknown;
  [key: string]: unknown;
}

interface TransformedResonantChainNode {
  id: number;
  name: string;
  description?: string;
  descriptionParams?: Array<number>;
  iconUrl?: string;
}

export interface TransformedCharacter {
  id: number;
  name: string;
  rank: number;
  weaponType: WeaponType;
  attribute?: Attribute;
  iconUrl?: string;
  properties?: Array<TransformedProperty>;
  skills?: Array<TransformedSkill>;
  skillTree?: Array<TransformedSkillTreeNode>;
  resonantChain?: Array<TransformedResonantChainNode>;
}

// ============================================================================
// Constants
// ============================================================================

const ATTRIBUTE_MAP: Record<number, Attribute> = {
  1: Attribute.GLACIO,
  2: Attribute.FUSION,
  3: Attribute.ELECTRO,
  4: Attribute.AERO,
  5: Attribute.SPECTRO,
  6: Attribute.HAVOC,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Map ElementId to Attribute enum value
 */
const mapAttribute = (attributeId: number): Attribute | undefined => {
  return ATTRIBUTE_MAP[attributeId];
};

/**
 * Map property names from encore.moe to CharacterStat enum values (for base Properties)
 */
const mapPropertyNameToStat = (propertyName: string): CharacterStat | undefined => {
  const mapping: Record<string, CharacterStat> = {
    HP: CharacterStat.HP_FLAT,
    ATK: CharacterStat.ATTACK_FLAT,
    DEF: CharacterStat.DEFENSE_FLAT,
    'Crit. Rate': CharacterStat.CRITICAL_RATE,
    'Crit. DMG': CharacterStat.CRITICAL_DAMAGE,
    'Energy Regen': CharacterStat.ENERGY_REGEN,
    'Healing Bonus': CharacterStat.HEALING_BONUS,
  };

  return mapping[propertyName];
};

/**
 * Parse SkillTree node description to extract stat, value, and tags
 * Examples:
 * - "HP increased by 1.80%." => { stat: "hpScalingBonus", value: 0.018, tags: ["all"] }
 * - "Glacio DMG Bonus increased by 1.80%." => { stat: "damageBonus", value: 0.018, tags: ["glacio"] }
 */
const parseSkillTreeNode = (
  description: string | undefined,
): { stat: CharacterStat; value: number; tags: Array<string> } | undefined => {
  if (!description) return undefined;

  // Match pattern: "{Stat Name} increased by {value}%."
  const match = description.match(/^(.+?)\s+increased\s+by\s+([\d.]+)%/);
  if (!match) return undefined;

  const statName = match[1].trim();
  // Round to 3 decimal places to avoid floating point precision issues
  const value = Math.round((Number.parseFloat(match[2]) / 100) * 1000) / 1000;

  // Check if it's an elemental DMG Bonus
  const elementalDmgMatch = statName.match(
    /^(Glacio|Fusion|Electro|Aero|Spectro|Havoc)\s+DMG\s+Bonus$/,
  );
  if (elementalDmgMatch) {
    const elementName = elementalDmgMatch[1];
    const element = mapElementNameToAttribute(elementName);
    if (!element) return undefined;

    return {
      stat: CharacterStat.DAMAGE_BONUS,
      value,
      tags: [element],
    };
  }

  const stat = mapStatNameToCharacterStat(statName);
  if (!stat) return undefined;

  return { stat, value, tags: [Tag.ALL] };
};

/**
 * Parse skill attribute value string into an array of numbers
 * Examples:
 * - "28.81%" => [0.2881]
 * - "33.82%*2" => [0.3382, 0.3382]
 * - "13.99%*7" => [0.1399, 0.1399, 0.1399, 0.1399, 0.1399, 0.1399, 0.1399]
 * - "14.68%*7+44.02%" => [0.1468, 0.1468, 0.1468, 0.1468, 0.1468, 0.1468, 0.1468, 0.4402]
 * - "25" => [25]
 */
const parseSkillAttributeValue = (value: string): Array<number> => {
  // Split by '+' to handle addition operations
  const terms = value.split('+');
  const result: Array<number> = [];

  for (const term of terms) {
    // Check if there's a multiplier (e.g., "*2", "*7")
    const multiplierMatch = term.match(/\*(\d+)$/);
    const multiplier = multiplierMatch ? Number.parseInt(multiplierMatch[1], 10) : 1;

    // Remove the multiplier part to get the base value
    const baseValueString = multiplierMatch ? term.replace(/\*\d+$/, '') : term;

    // Check if it's a percentage
    const isPercentage = baseValueString.includes('%');

    // Parse the numeric value
    const numericValue = Number.parseFloat(baseValueString.replace('%', ''));

    // Convert to decimal if it's a percentage
    const finalValue = isPercentage ? numericValue / 100 : numericValue;

    // Round to 4 decimal places to avoid floating point precision issues
    const roundedValue = Math.round(finalValue * 10_000) / 10_000;

    // Add the values to the result array
    for (let index = 0; index < multiplier; index++) {
      result.push(roundedValue);
    }
  }

  return result;
};

// ============================================================================
// Main Processing
// ============================================================================

const transformCharacterJSON = async (
  inputFilePath: string,
  outputFilePath: string,
): Promise<void> => {
  try {
    const content = await readFile(inputFilePath, 'utf8');
    const fullData = JSON.parse(content);

    // Extract only the fields we want
    const transformed: TransformedCharacter = {
      id: fullData.Id,
      name: fullData.Name?.Content ?? '',
      rank: fullData.QualityId,
      weaponType: mapWeaponType(fullData.WeaponType),
      attribute: mapAttribute(fullData.ElementId),
      iconUrl: fullData.RoleHeadIconCircle,
    };

    // Transform Properties to only include name and final GrowthValues value
    if (fullData.Properties !== undefined && Array.isArray(fullData.Properties)) {
      transformed.properties = fullData.Properties.map((property: Property) => {
        const lastGrowthValue = property.GrowthValues.at(-1);
        const stat = mapPropertyNameToStat(property.Name);

        if (!stat) {
          console.warn(`Unknown property name: ${property.Name}`);
          return;
        }

        const characterName = transformed.name;
        const propertyName = property.Name;

        return {
          name: `${characterName} Base ${propertyName}`,
          description: `Base ${propertyName} for ${characterName} at level 90.`,
          value: convertValueToNumber(lastGrowthValue?.value ?? 0),
          stat,
          tags: [Tag.ALL],
        };
      }).filter((property): property is TransformedProperty => property !== undefined);
    }

    // Transform Skills to process attributes
    if (fullData.Skills !== undefined && Array.isArray(fullData.Skills)) {
      transformed.skills = fullData.Skills.filter(
        (skill: Skill) =>
          !skill.SkillDescribe?.includes(
            'Has a chance to produce special dishes when cooking',
          ) &&
          skill.Icon !==
            'https://api-v2.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Atlas/SkillIcon/SkillIconNor/SP_IconRun.png',
      ).map((skill: Skill): TransformedSkill => {
        return {
          id: skill.SkillId,
          type: skill.SkillType,
          name: skill.SkillName,
          // Strip HTML tags from description (preserve section headers for character skills)
          description: stripHtmlTags(skill.SkillDescribe, {
            preserveSectionHeaders: true,
          }),
          // Process icon path
          iconUrl: processIconPath(skill.Icon),
          // Transform attributes to only include the 10th value (values[9])
          // Filter out attributes whose name ends with "STA Cost", "Duration", "Shield", or "Healing", or includes "Cooldown", "Concerto Regen", or "Resonance Cost"
          attributes:
            skill.SkillAttributes !== undefined && Array.isArray(skill.SkillAttributes)
              ? skill.SkillAttributes.filter(
                  (attribute: SkillAttribute) =>
                    !attribute.attributeName.endsWith('STA Cost') &&
                    !attribute.attributeName.endsWith('Duration') &&
                    !attribute.attributeName.endsWith('Shield') &&
                    !attribute.attributeName.endsWith('Healing') &&
                    !attribute.attributeName.includes('Cooldown') &&
                    !attribute.attributeName.includes('Concerto Regen') &&
                    !attribute.attributeName.includes('Resonance Cost'),
                ).map((attribute: SkillAttribute) => ({
                  id: attribute.attributeId,
                  name: attribute.attributeName,
                  value: parseSkillAttributeValue(attribute.values[9]), // Parse the 10th value into array of numbers
                }))
              : undefined,
        };
      });
    }

    // Transform SkillTree to exclude Consume field and process icon
    if (fullData.SkillTree !== undefined && Array.isArray(fullData.SkillTree)) {
      transformed.skillTree = fullData.SkillTree.map((node: SkillTreeNode) => {
        const parsed = parseSkillTreeNode(node.PropertyNodeDescribe);

        if (!parsed) {
          console.warn(`Failed to parse SkillTree node: ${node.PropertyNodeTitle}`);
          return;
        }

        const transformedNode: TransformedSkillTreeNode = {
          id: node.Id,
          name: node.PropertyNodeTitle,
          description: node.PropertyNodeDescribe,
          iconUrl: processIconPath(node.PropertyNodeIcon),
          stat: parsed.stat,
          value: parsed.value,
          tags: parsed.tags,
        };

        return transformedNode;
      }).filter((node): node is TransformedSkillTreeNode => node !== undefined);
    }

    // Transform ResonantChain to strip HTML tags from description and process icon
    if (fullData.ResonantChain !== undefined && Array.isArray(fullData.ResonantChain)) {
      transformed.resonantChain = fullData.ResonantChain.map(
        (node: ResonantChainNode) => {
          const {
            GroupIndex,
            NodeType,
            NodeIndex,
            BgDescription,
            BuffIds,
            AddProp,
            ActivateConsume,
            ...nodeWithoutExcluded
          } = node;
          const transformedNode: TransformedResonantChainNode = {
            id: nodeWithoutExcluded.Id,
            // Clean up name by replacing newlines with spaces
            name: nodeWithoutExcluded.NodeName.replaceAll('\n', ' '),
            // Strip HTML tags from description
            description: stripHtmlTags(nodeWithoutExcluded.AttributesDescription, {
              preserveSectionHeaders: true,
            }),
            // Process icon path
            iconUrl: processIconPath(nodeWithoutExcluded.NodeIcon),
            // Convert descriptionParams to numbers
            descriptionParams:
              nodeWithoutExcluded.AttributesDescriptionParams !== undefined &&
              Array.isArray(nodeWithoutExcluded.AttributesDescriptionParams)
                ? nodeWithoutExcluded.AttributesDescriptionParams.map((parameter) =>
                    convertValueToNumber(parameter),
                  )
                : undefined,
          };
          return transformedNode;
        },
      );
    }

    // Write to output directory
    await writeFile(outputFilePath, JSON.stringify(transformed, undefined, 2) + '\n');
    console.log(`✓ Transformed: ${path.basename(inputFilePath)}`);
  } catch (error) {
    console.error(`✗ Error transforming ${inputFilePath}:`, error);
  }
};

const main = async () => {
  console.log('🔄 Starting character JSON transformation...\n');
  console.log(`Input directory:  ${CHARACTER_DATA_DIR}`);
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  try {
    // Create output directory if it doesn't exist
    await mkdir(OUTPUT_DIR, { recursive: true });

    // Read all files in the character directory
    const files = await readdir(CHARACTER_DATA_DIR);

    // Filter for JSON files (excluding index.json)
    const characterJsonFiles = files.filter(
      (file) => file.endsWith('.json') && file !== 'index.json',
    );

    console.log(`Found ${characterJsonFiles.length} character files\n`);

    let processed = 0;
    let errors = 0;

    // Process each character file
    for (const file of characterJsonFiles) {
      const inputFilePath = path.join(CHARACTER_DATA_DIR, file);
      const outputFilePath = path.join(OUTPUT_DIR, file);
      try {
        await transformCharacterJSON(inputFilePath, outputFilePath);
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

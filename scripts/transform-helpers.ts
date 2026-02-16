/**
 * Common helper functions for transformation scripts
 */

import { Attribute } from '../src/types/attribute';
import { CharacterStat } from '../src/types/character';
import { WeaponType } from '../src/types/weapon';

// ============================================================================
// Constants
// ============================================================================

export const ENCORE_MOE_IMAGE_ASSETS_URL = 'https://api-v2.encore.moe/resource/Data/';

// ============================================================================
// Attribute Mapping
// ============================================================================

/**
 * Map element names from encore.moe to Attribute enum values
 */
export const mapElementNameToAttribute = (
  elementName: string,
): Attribute | undefined => {
  const mapping: Record<string, Attribute> = {
    Glacio: Attribute.GLACIO,
    Fusion: Attribute.FUSION,
    Electro: Attribute.ELECTRO,
    Aero: Attribute.AERO,
    Spectro: Attribute.SPECTRO,
    Havoc: Attribute.HAVOC,
  };

  return mapping[elementName];
};

// ============================================================================
// Stat Mapping
// ============================================================================

/**
 * Map stat names to CharacterStat enum values (uses scaling bonus stats for %)
 */
export const mapStatNameToCharacterStat = (
  statName: string,
): CharacterStat | undefined => {
  const mapping: Record<string, CharacterStat> = {
    HP: CharacterStat.HP_SCALING_BONUS,
    ATK: CharacterStat.ATTACK_SCALING_BONUS,
    DEF: CharacterStat.DEFENSE_SCALING_BONUS,
    'Crit. Rate': CharacterStat.CRITICAL_RATE,
    'Crit. DMG': CharacterStat.CRITICAL_DAMAGE,
    'Energy Regen': CharacterStat.ENERGY_REGEN,
    'Healing Bonus': CharacterStat.HEALING_BONUS,
  };

  return mapping[statName];
};

// ============================================================================
// Weapon Type Mapping
// ============================================================================

const WEAPON_TYPE_MAP: Partial<Record<number, WeaponType>> = {
  1: WeaponType.BROADBLADE,
  2: WeaponType.SWORD,
  3: WeaponType.PISTOLS,
  4: WeaponType.GAUNTLETS,
  5: WeaponType.RECTIFIER,
};

export const mapWeaponType = (weaponTypeId: number): WeaponType => {
  const weaponType = WEAPON_TYPE_MAP[weaponTypeId];
  if (!weaponType) {
    throw new Error(`Unknown weapon type ID: ${weaponTypeId}`);
  }
  return weaponType;
};

// ============================================================================
// HTML and Text Processing
// ============================================================================

/**
 * Strip HTML tags from a string
 *
 * For character descriptions, this reformats tags at the beginning of sentences
 * by adding ": " after their content.
 *
 * Examples:
 * - "<span>Heavy Attack</span>Deals damage" => "Heavy Attack: Deals damage"
 * - "Text<br><br><span>Section</span>More text" => "Text. Section: More text"
 */
export const stripHtmlTags = (
  html: string | undefined,
  options: { preserveSectionHeaders?: boolean } = {},
): string | undefined => {
  if (!html) return undefined;

  let result = html;

  // Step 1: Remove noise tags like <size=...> and their content
  result = result.replaceAll(/<size[^>]*>.*?<\/span>/gi, '');

  if (options.preserveSectionHeaders) {
    // Step 2: Handle section headers at the start of the string
    // Pattern: ^<span...>Header Text</span></span><br><br>
    result = result.replace(
      /^(?:<[^>]*>)+([^<>]+?)(?:<\/[^>]+>)+(?:<br\s*\/?>)+/i,
      '$1: ',
    );

    // Step 3: Handle section headers after content
    // Pattern: <br><br><span...>Header Text</span></span><br><br>
    // Replace with ". Header Text: "
    result = result.replaceAll(
      /(?:<br\s*\/?>)+(?:<[^>]*>)+([^<>]+?)(?:<\/[^>]+>)+(?:<br\s*\/?>)+/gi,
      (_match, content) => {
        const trimmedContent = content.trim();
        if (trimmedContent) {
          return ` ${trimmedContent}: `;
        }
        return ' ';
      },
    );
  }

  // Step 4: Replace remaining <br> tags with spaces
  result = result.replaceAll(/<br\s*\/?>/gi, ' ');

  // Step 5: Strip all remaining HTML tags
  result = result.replaceAll(/<[^>]*>/g, '');

  // Step 6: Clean up multiple spaces
  result = result.replaceAll(/[\s]+/g, ' ');

  return result.trim();
};

/**
 * Collapse repeated values in text (e.g., "15/15/15/15/15" -> "15")
 */
export const collapseRepeatedValues = (
  text: string | undefined,
): string | undefined => {
  if (!text) return undefined;
  // Match patterns like "15/15/15/15/15" where all 5 values are identical
  // Supports numbers with decimals and optional % sign
  return text.replaceAll(/(\d+(?:\.\d+)?%?)\/\1\/\1\/\1\/\1/g, '$1');
};

// ============================================================================
// Number Conversion
// ============================================================================

/**
 * Convert a value string to a number
 * Examples:
 * - "25%" => 0.25
 * - "2.5" => 2.5
 * - "100" => 100
 */
export const convertValueToNumber = (value: string | number): number => {
  if (typeof value === 'number') {
    return value;
  }

  const stringValue = value.toString();

  // Check if it's a percentage
  if (stringValue.includes('%')) {
    const numericValue = Number.parseFloat(stringValue.replace('%', ''));
    // Round to 4 decimal places to avoid floating point precision issues
    return Math.round((numericValue / 100) * 10_000) / 10_000;
  }

  // Otherwise just parse as number and round to 4 decimal places
  const numericValue = Number.parseFloat(stringValue);
  return Math.round(numericValue * 10_000) / 10_000;
};

/**
 * Collapse repeated values in an array of numbers
 * If all values are identical, return a single-element array
 */
export const collapseArrayValues = (values: Array<number>): Array<number> => {
  if (values.length === 0) return values;

  // Check if all values are identical
  const firstValue = values[0];
  const allIdentical = values.every((value) => value === firstValue);

  if (allIdentical) {
    return [firstValue];
  }

  return values;
};

// ============================================================================
// Asset Processing
// ============================================================================

/**
 * Converts an icon path to a full encore.moe API URL with .png extension.
 */
export const processIconPath = (iconUrl?: string | null): string | undefined => {
  if (!iconUrl) return undefined;

  // Remove file extension and add .png
  const pathWithPng = iconUrl.replace(/\.[^.]*$/, '.png');

  // Remove leading slash to ensure proper URL concatenation
  const relativePath = pathWithPng.startsWith('/') ? pathWithPng.slice(1) : pathWithPng;

  return new URL(relativePath, ENCORE_MOE_IMAGE_ASSETS_URL).href;
};

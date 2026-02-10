import { intersection } from 'es-toolkit/array';
import { mapValues } from 'es-toolkit/object';

import { Tag } from '@/types';
import type { Character, CharacterStats, Enemy, EnemyStats } from '@/types';

/**
 * Filters stat values in a stats object to only include those matching the given tags.
 * Stats tagged with Tag.ALL are always included.
 *
 * @param stats - The stats object to filter (CharacterStats or EnemyStats)
 * @param tags - The tags to filter by (e.g., attack tags like BASIC_ATTACK, ELECTRO)
 * @returns A new stats object with only matching stat values
 *
 * @example
 * const filtered = filterStatValuesByTags(character.stats, [Tag.BASIC_ATTACK, Tag.ELECTRO]);
 * // Only stats with tags matching BASIC_ATTACK, ELECTRO, or ALL remain
 */
export function filterStatValuesByTags<T extends CharacterStats | EnemyStats>(
  stats: T,
  tags: Array<string>,
): T {
  return mapValues(stats, (statValues) => {
    if (!statValues || !Array.isArray(statValues)) return statValues;
    return statValues.filter((stat) => {
      return intersection(tags, stat.tags).length > 0 || stat.tags.includes(Tag.ALL);
    });
  }) as T;
}

/**
 * Filters a character's stats to only include those matching the given tags.
 * Stats tagged with Tag.ALL are always included.
 *
 * @param character - The character whose stats should be filtered
 * @param tags - The tags to filter by (e.g., attack tags like BASIC_ATTACK, ELECTRO)
 * @returns A new character object with filtered stats
 *
 * @example
 * const filtered = filterCharacterStatsByTags(character, [Tag.BASIC_ATTACK, Tag.ELECTRO]);
 * // Character with only relevant stats for an Electro basic attack
 */
export function filterCharacterStatsByTags(
  character: Character,
  tags: Array<string>,
): Character {
  return {
    ...character,
    stats: filterStatValuesByTags(character.stats, tags),
  };
}

/**
 * Filters an enemy's stats to only include those matching the given tags.
 * Stats tagged with Tag.ALL are always included.
 *
 * @param enemy - The enemy whose stats should be filtered
 * @param tags - The tags to filter by (e.g., attack tags like BASIC_ATTACK, ELECTRO)
 * @returns A new enemy object with filtered stats
 *
 * @example
 * const filtered = filterEnemyStatsByTags(enemy, [Tag.BASIC_ATTACK, Tag.ELECTRO]);
 * // Enemy with only relevant stats for an Electro basic attack
 */
export function filterEnemyStatsByTags(enemy: Enemy, tags: Array<string>): Enemy {
  return {
    ...enemy,
    stats: filterStatValuesByTags(enemy.stats, tags),
  };
}

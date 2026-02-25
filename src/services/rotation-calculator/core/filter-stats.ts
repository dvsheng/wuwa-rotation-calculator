import { intersection } from 'es-toolkit/array';
import { mapValues } from 'es-toolkit/object';

import {
  NEGATIVE_STATUS_TO_ATTRIBUTE,
  Tag,
  isNegativeStatusAbilityAttribute,
} from '@/types';
import type {
  AbilityAttribute,
  Character,
  CharacterStats,
  Enemy,
  EnemyStats,
  NegativeStatus,
} from '@/types';

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

export const filterCharacterStatsByNegativeStatus = (
  character: Character,
  negativeStatus: NegativeStatus,
) => {
  const stats = mapValues(character.stats, (statValues) => {
    if (!Array.isArray(statValues)) return statValues;
    return statValues.filter((stat) => {
      return intersection([negativeStatus], stat.tags).length > 0;
    });
  });
  return {
    ...character,
    stats,
  };
};

export const filterEnemyStatsByNegativeStatus = (
  enemy: Enemy,
  negativeStatus: NegativeStatus,
) => {
  const attribute = NEGATIVE_STATUS_TO_ATTRIBUTE[negativeStatus];
  return filterEnemyStatsByTags(enemy, [attribute, negativeStatus]);
};

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

export interface StatFilteringStrategy {
  filterCharacterStats: (character: Character) => Character;
  filterEnemyStats: (enemy: Enemy) => Enemy;
}

const createTagBasedFilteringStrategy = (
  tags: Array<string>,
): StatFilteringStrategy => ({
  filterCharacterStats: (character: Character) =>
    filterCharacterStatsByTags(character, tags),
  filterEnemyStats: (enemy: Enemy) => filterEnemyStatsByTags(enemy, tags),
});

const createNegativeStatusFilteringStrategy = (
  scalingStat: NegativeStatus,
): StatFilteringStrategy => ({
  filterCharacterStats: (character: Character) =>
    filterCharacterStatsByNegativeStatus(character, scalingStat),
  filterEnemyStats: (enemy: Enemy) =>
    filterEnemyStatsByNegativeStatus(enemy, scalingStat),
});

export const createStatFilteringStrategy = (
  scalingStat: AbilityAttribute,
  tags: Array<string>,
): StatFilteringStrategy => {
  return isNegativeStatusAbilityAttribute(scalingStat)
    ? createNegativeStatusFilteringStrategy(scalingStat)
    : createTagBasedFilteringStrategy(tags);
};

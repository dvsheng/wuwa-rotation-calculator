import { intersection } from 'es-toolkit/array';
import { mapValues } from 'es-toolkit/object';

import type { Enemy, TaggedStatValue, Team } from '@/types';
import { AttackScalingProperty, CharacterStat, EnemyStat, Tag } from '@/types';

/**
 * Declarative mapping of each stat key to the list of tags allowed for that stat
 * in a single damage calculation context.
 */
type StatFilterConfiguration = Record<CharacterStat | EnemyStat, Array<string>>;

const CONDITIONAL_SCALING_PROPERTIES = [
  CharacterStat.CRITICAL_RATE,
  CharacterStat.CRITICAL_DAMAGE,
  CharacterStat.DAMAGE_BONUS,
  CharacterStat.DAMAGE_AMPLIFICATION,
  CharacterStat.DAMAGE_MULTIPLIER_BONUS,
];

/**
 * Filters a stat record using a per-stat tag allowlist configuration.
 *
 * @param stats - Character or enemy stat record to filter.
 * @param configuration - Per-stat tag allowlist.
 * @returns A new stat record containing only entries with at least one matching tag.
 */
const filterStats = <T extends CharacterStat | EnemyStat>(
  stats: Record<T, Array<TaggedStatValue>>,
  configuration: StatFilterConfiguration,
): Record<T, Array<TaggedStatValue>> => {
  return mapValues(stats, (statValues, stat) => {
    const tags = configuration[stat];
    return statValues.filter((statValue) => {
      return intersection(tags, statValue.tags).length > 0;
    });
  });
};

/**
 * Creates a reusable filter function bound to a specific stat filtering configuration.
 *
 * @param configuration - Per-stat tag allowlist for this damage context.
 * @returns Function that filters both team and enemy stats for the same context.
 */
const createStatFilterer = (configuration: StatFilterConfiguration) => {
  return (team: Team, enemy: Enemy) => {
    const filteredTeam = team.map((character) => {
      return {
        ...character,
        stats: filterStats(character.stats, configuration),
      };
    });
    const filteredEnemy = {
      ...enemy,
      stats: filterStats(enemy.stats, configuration),
    };
    return { filteredTeam, filteredEnemy };
  };
};

/**
 * Builds the declarative stat filter configuration for a given attack scaling property.
 *
 * Rules:
 * - Regular scaling (ATK/HP/DEF): keep tag-matching stats plus Tag.ALL.
 * - Fixed scaling: keep no tagged stats.
 * - Negative status scaling: keep most stats by status + attribute + Tag.ALL, but
 *   for non-scaling offensive stats, only keep status-tagged entries.
 *
 * @param attackScalingProperty - Attack scaling key for the current damage instance.
 * @param tags - Damage instance tags used for regular scaling filtering.
 * @returns Per-stat tag allowlist configuration for downstream filtering.
 */
const getStatFilterConfiguration = (
  attackScalingProperty: AttackScalingProperty,
  tags: Array<string>,
): StatFilterConfiguration => {
  const allStats = [...Object.values(CharacterStat), ...Object.values(EnemyStat)];
  switch (attackScalingProperty) {
    case AttackScalingProperty.ATK:
    case AttackScalingProperty.HP:
    case AttackScalingProperty.DEF: {
      const tagsForRegularAttack = [...tags, Tag.ALL];
      return Object.fromEntries(
        allStats.map((stat) => [stat, tagsForRegularAttack]),
      ) as StatFilterConfiguration;
    }
    case AttackScalingProperty.FIXED: {
      const tagsForFixedAttack: Array<string> = [];
      return Object.fromEntries(
        allStats.map((stat) => [stat, tagsForFixedAttack]),
      ) as StatFilterConfiguration;
    }
    case AttackScalingProperty.TUNE_RUPTURE_ATK:
    case AttackScalingProperty.TUNE_RUPTURE_DEF:
    case AttackScalingProperty.TUNE_RUPTURE_HP: {
      return {
        ...Object.fromEntries(allStats.map((stat) => [stat, [...tags, Tag.ALL]])),
        ...Object.fromEntries(
          CONDITIONAL_SCALING_PROPERTIES.map((stat) => [stat, [Tag.TUNE_RUPTURE]]),
        ),
      } as StatFilterConfiguration;
    }
    case AttackScalingProperty.AERO_EROSION:
    case AttackScalingProperty.ELECTRO_FLARE:
    case AttackScalingProperty.FUSION_BURST:
    case AttackScalingProperty.GLACIO_CHAFE:
    case AttackScalingProperty.HAVOC_BANE:
    case AttackScalingProperty.SPECTRO_FRAZZLE: {
      return {
        ...Object.fromEntries(allStats.map((stat) => [stat, [...tags, Tag.ALL]])),
        ...Object.fromEntries(
          CONDITIONAL_SCALING_PROPERTIES.map((stat) => [stat, [attackScalingProperty]]),
        ),
      } as StatFilterConfiguration;
    }
  }
};

/**
 * Filter function returned by {@link getStatFilterer}.
 */
export type StatFilterer = ReturnType<typeof createStatFilterer>;

/**
 * Returns a stat filter function configured for the provided scaling stat and tags.
 *
 * @param scalingStat - Scaling stat of the current damage instance.
 * @param tags - Damage instance tags used for regular stat filtering.
 * @returns A function that filters both team and enemy stats for calculation.
 */
export const getStatFilterer = (
  scalingStat: AttackScalingProperty,
  tags: Array<string>,
): StatFilterer => {
  const statFilterConfiguration = getStatFilterConfiguration(scalingStat, tags);
  return createStatFilterer(statFilterConfiguration);
};

import { describe, expect, it } from 'vitest';

import { CharacterStat, Tag } from '@/types';
import type { Character, CharacterStats, Enemy } from '@/types';

import {
  filterCharacterStatsByTags,
  filterEnemyStatsByTags,
  filterStatValuesByTags,
} from './filter-stats';

describe('filterStatValuesByTags', () => {
  it('includes stats with matching tags', () => {
    const stats: CharacterStats = {
      [CharacterStat.DAMAGE_BONUS]: [
        { tags: [Tag.ELECTRO], value: 0.2 },
        { tags: [Tag.GLACIO], value: 0.15 },
        { tags: [Tag.BASIC_ATTACK], value: 0.1 },
      ],
      [CharacterStat.CRITICAL_RATE]: [{ tags: [Tag.ALL], value: 0.5 }],
      [CharacterStat.ATTACK_FLAT]: [],
      [CharacterStat.ATTACK_SCALING_BONUS]: [],
      [CharacterStat.ATTACK_FLAT_BONUS]: [],
      [CharacterStat.DEFENSE_FLAT]: [],
      [CharacterStat.DEFENSE_SCALING_BONUS]: [],
      [CharacterStat.DEFENSE_FLAT_BONUS]: [],
      [CharacterStat.HP_FLAT]: [],
      [CharacterStat.HP_SCALING_BONUS]: [],
      [CharacterStat.HP_FLAT_BONUS]: [],
      [CharacterStat.CRITICAL_DAMAGE]: [],
      [CharacterStat.DEFENSE_IGNORE]: [],
      [CharacterStat.RESISTANCE_PENETRATION]: [],
      [CharacterStat.DAMAGE_AMPLIFICATION]: [],
      [CharacterStat.DAMAGE_MULTIPLIER_BONUS]: [],
      [CharacterStat.FINAL_DAMAGE_BONUS]: [],
      [CharacterStat.FLAT_DAMAGE]: [],
      [CharacterStat.OFF_TUNE_BUILDUP_RATE]: [],
      [CharacterStat.TUNE_BREAK_BOOST]: [],
      [CharacterStat.ENERGY_REGEN]: [],
      [CharacterStat.HEALING_BONUS]: [],
    };

    const filtered = filterStatValuesByTags(stats, [Tag.ELECTRO, Tag.BASIC_ATTACK]);

    // Should include ELECTRO and BASIC_ATTACK damage bonuses
    expect(filtered[CharacterStat.DAMAGE_BONUS]).toHaveLength(2);
    expect(filtered[CharacterStat.DAMAGE_BONUS]).toContainEqual({
      tags: [Tag.ELECTRO],
      value: 0.2,
    });
    expect(filtered[CharacterStat.DAMAGE_BONUS]).toContainEqual({
      tags: [Tag.BASIC_ATTACK],
      value: 0.1,
    });

    // Should NOT include GLACIO damage bonus
    expect(filtered[CharacterStat.DAMAGE_BONUS]).not.toContainEqual({
      tags: [Tag.GLACIO],
      value: 0.15,
    });
  });

  it('always includes stats tagged with Tag.ALL', () => {
    const stats: CharacterStats = {
      [CharacterStat.DAMAGE_BONUS]: [{ tags: [Tag.ELECTRO], value: 0.2 }],
      [CharacterStat.CRITICAL_RATE]: [{ tags: [Tag.ALL], value: 0.5 }],
      [CharacterStat.CRITICAL_DAMAGE]: [{ tags: [Tag.ALL], value: 1.5 }],
      [CharacterStat.ATTACK_FLAT]: [],
      [CharacterStat.ATTACK_SCALING_BONUS]: [],
      [CharacterStat.ATTACK_FLAT_BONUS]: [],
      [CharacterStat.DEFENSE_FLAT]: [],
      [CharacterStat.DEFENSE_SCALING_BONUS]: [],
      [CharacterStat.DEFENSE_FLAT_BONUS]: [],
      [CharacterStat.HP_FLAT]: [],
      [CharacterStat.HP_SCALING_BONUS]: [],
      [CharacterStat.HP_FLAT_BONUS]: [],
      [CharacterStat.DEFENSE_IGNORE]: [],
      [CharacterStat.RESISTANCE_PENETRATION]: [],
      [CharacterStat.DAMAGE_AMPLIFICATION]: [],
      [CharacterStat.DAMAGE_MULTIPLIER_BONUS]: [],
      [CharacterStat.FINAL_DAMAGE_BONUS]: [],
      [CharacterStat.FLAT_DAMAGE]: [],
      [CharacterStat.OFF_TUNE_BUILDUP_RATE]: [],
      [CharacterStat.TUNE_BREAK_BOOST]: [],
      [CharacterStat.ENERGY_REGEN]: [],
      [CharacterStat.HEALING_BONUS]: [],
    };

    const filtered = filterStatValuesByTags(stats, [Tag.GLACIO]);

    // Should NOT include ELECTRO damage bonus (tags don't match)
    expect(filtered[CharacterStat.DAMAGE_BONUS]).toHaveLength(0);

    // Should include ALL-tagged stats even though tags are [GLACIO]
    expect(filtered[CharacterStat.CRITICAL_RATE]).toHaveLength(1);
    expect(filtered[CharacterStat.CRITICAL_RATE][0].value).toBe(0.5);
    expect(filtered[CharacterStat.CRITICAL_DAMAGE]).toHaveLength(1);
    expect(filtered[CharacterStat.CRITICAL_DAMAGE][0].value).toBe(1.5);
  });

  it('handles stats with multiple tags', () => {
    const stats: CharacterStats = {
      [CharacterStat.DAMAGE_BONUS]: [
        { tags: [Tag.ELECTRO, Tag.BASIC_ATTACK], value: 0.25 },
        { tags: [Tag.ELECTRO, Tag.RESONANCE_SKILL], value: 0.3 },
        { tags: [Tag.GLACIO], value: 0.15 },
      ],
      [CharacterStat.ATTACK_FLAT]: [],
      [CharacterStat.ATTACK_SCALING_BONUS]: [],
      [CharacterStat.ATTACK_FLAT_BONUS]: [],
      [CharacterStat.DEFENSE_FLAT]: [],
      [CharacterStat.DEFENSE_SCALING_BONUS]: [],
      [CharacterStat.DEFENSE_FLAT_BONUS]: [],
      [CharacterStat.HP_FLAT]: [],
      [CharacterStat.HP_SCALING_BONUS]: [],
      [CharacterStat.HP_FLAT_BONUS]: [],
      [CharacterStat.CRITICAL_RATE]: [],
      [CharacterStat.CRITICAL_DAMAGE]: [],
      [CharacterStat.DEFENSE_IGNORE]: [],
      [CharacterStat.RESISTANCE_PENETRATION]: [],
      [CharacterStat.DAMAGE_AMPLIFICATION]: [],
      [CharacterStat.DAMAGE_MULTIPLIER_BONUS]: [],
      [CharacterStat.FINAL_DAMAGE_BONUS]: [],
      [CharacterStat.FLAT_DAMAGE]: [],
      [CharacterStat.OFF_TUNE_BUILDUP_RATE]: [],
      [CharacterStat.TUNE_BREAK_BOOST]: [],
      [CharacterStat.ENERGY_REGEN]: [],
      [CharacterStat.HEALING_BONUS]: [],
    };

    const filtered = filterStatValuesByTags(stats, [Tag.ELECTRO, Tag.BASIC_ATTACK]);

    // Should include both ELECTRO bonuses (both have ELECTRO tag)
    expect(filtered[CharacterStat.DAMAGE_BONUS]).toHaveLength(2);
    expect(filtered[CharacterStat.DAMAGE_BONUS]).toContainEqual({
      tags: [Tag.ELECTRO, Tag.BASIC_ATTACK],
      value: 0.25,
    });
    expect(filtered[CharacterStat.DAMAGE_BONUS]).toContainEqual({
      tags: [Tag.ELECTRO, Tag.RESONANCE_SKILL],
      value: 0.3,
    });
  });

  it('returns empty arrays for stats with no matching tags', () => {
    const stats: CharacterStats = {
      [CharacterStat.DAMAGE_BONUS]: [
        { tags: [Tag.GLACIO], value: 0.2 },
        { tags: [Tag.FUSION], value: 0.15 },
      ],
      [CharacterStat.ATTACK_FLAT]: [],
      [CharacterStat.ATTACK_SCALING_BONUS]: [],
      [CharacterStat.ATTACK_FLAT_BONUS]: [],
      [CharacterStat.DEFENSE_FLAT]: [],
      [CharacterStat.DEFENSE_SCALING_BONUS]: [],
      [CharacterStat.DEFENSE_FLAT_BONUS]: [],
      [CharacterStat.HP_FLAT]: [],
      [CharacterStat.HP_SCALING_BONUS]: [],
      [CharacterStat.HP_FLAT_BONUS]: [],
      [CharacterStat.CRITICAL_RATE]: [],
      [CharacterStat.CRITICAL_DAMAGE]: [],
      [CharacterStat.DEFENSE_IGNORE]: [],
      [CharacterStat.RESISTANCE_PENETRATION]: [],
      [CharacterStat.DAMAGE_AMPLIFICATION]: [],
      [CharacterStat.DAMAGE_MULTIPLIER_BONUS]: [],
      [CharacterStat.FINAL_DAMAGE_BONUS]: [],
      [CharacterStat.FLAT_DAMAGE]: [],
      [CharacterStat.OFF_TUNE_BUILDUP_RATE]: [],
      [CharacterStat.TUNE_BREAK_BOOST]: [],
      [CharacterStat.ENERGY_REGEN]: [],
      [CharacterStat.HEALING_BONUS]: [],
    };

    const filtered = filterStatValuesByTags(stats, [Tag.ELECTRO]);

    // No ELECTRO damage bonuses
    expect(filtered[CharacterStat.DAMAGE_BONUS]).toHaveLength(0);
  });
});

describe('filterCharacterStatsByTags', () => {
  it('filters character stats while preserving other properties', () => {
    const character: Character = {
      id: 12_345,
      level: 90,
      stats: {
        [CharacterStat.DAMAGE_BONUS]: [
          { tags: [Tag.ELECTRO], value: 0.2 },
          { tags: [Tag.GLACIO], value: 0.15 },
        ],
        [CharacterStat.CRITICAL_RATE]: [{ tags: [Tag.ALL], value: 0.5 }],
        [CharacterStat.ATTACK_FLAT]: [],
        [CharacterStat.ATTACK_SCALING_BONUS]: [],
        [CharacterStat.ATTACK_FLAT_BONUS]: [],
        [CharacterStat.DEFENSE_FLAT]: [],
        [CharacterStat.DEFENSE_SCALING_BONUS]: [],
        [CharacterStat.DEFENSE_FLAT_BONUS]: [],
        [CharacterStat.HP_FLAT]: [],
        [CharacterStat.HP_SCALING_BONUS]: [],
        [CharacterStat.HP_FLAT_BONUS]: [],
        [CharacterStat.CRITICAL_DAMAGE]: [],
        [CharacterStat.DEFENSE_IGNORE]: [],
        [CharacterStat.RESISTANCE_PENETRATION]: [],
        [CharacterStat.DAMAGE_AMPLIFICATION]: [],
        [CharacterStat.DAMAGE_MULTIPLIER_BONUS]: [],
        [CharacterStat.FINAL_DAMAGE_BONUS]: [],
        [CharacterStat.FLAT_DAMAGE]: [],
        [CharacterStat.OFF_TUNE_BUILDUP_RATE]: [],
        [CharacterStat.TUNE_BREAK_BOOST]: [],
        [CharacterStat.ENERGY_REGEN]: [],
        [CharacterStat.HEALING_BONUS]: [],
      },
    };

    const filtered = filterCharacterStatsByTags(character, [Tag.ELECTRO]);

    // Preserves character properties
    expect(filtered.id).toBe(12_345);
    expect(filtered.level).toBe(90);

    // Filters stats
    expect(filtered.stats[CharacterStat.DAMAGE_BONUS]).toHaveLength(1);
    expect(filtered.stats[CharacterStat.DAMAGE_BONUS][0]).toEqual({
      tags: [Tag.ELECTRO],
      value: 0.2,
    });

    // Includes Tag.ALL stats
    expect(filtered.stats[CharacterStat.CRITICAL_RATE]).toHaveLength(1);
  });
});

describe('filterEnemyStatsByTags', () => {
  it('filters enemy stats while preserving other properties', () => {
    const enemy: Enemy = {
      level: 90,
      stats: {
        baseResistance: [
          { tags: [Tag.ELECTRO], value: 0.1 },
          { tags: [Tag.GLACIO], value: 0.2 },
        ],
        defenseReduction: [{ tags: [Tag.ALL], value: 0.15 }],
        resistanceReduction: [],
        glacioChafe: [],
        spectroFrazzle: [],
        fusionBurst: [],
        havocBane: [],
        aeroErosion: [],
        electroFlare: [],
      },
    };

    const filtered = filterEnemyStatsByTags(enemy, [Tag.ELECTRO]);

    // Preserves enemy properties
    expect(filtered.level).toBe(90);

    // Filters stats
    expect(filtered.stats.baseResistance).toHaveLength(1);
    expect(filtered.stats.baseResistance[0]).toEqual({
      tags: [Tag.ELECTRO],
      value: 0.1,
    });

    // Includes Tag.ALL stats
    expect(filtered.stats.defenseReduction).toHaveLength(1);
  });
});

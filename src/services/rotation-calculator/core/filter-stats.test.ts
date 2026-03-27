import { describe, expect, it } from 'vitest';

import {
  AttackScalingProperty,
  Attribute,
  CharacterStat,
  EnemyStat,
  NegativeStatus,
  Tag,
} from '@/types';

import { getStatFilterer } from './filter-stats';
import type { Character, Enemy, Stat } from './types';

const createStat = (
  stat: CharacterStat | EnemyStat,
  value: number,
  tags: Array<string>,
): Stat => ({
  stat,
  value,
  tags,
});

const getStatsFor = (stats: Array<Stat>, stat: CharacterStat | EnemyStat) =>
  stats.filter((entry) => entry.stat === stat);

const createCharacter = (stats: Array<Stat> = []): Character => ({
  level: 90,
  stats,
});

const createEnemy = (stats: Array<Stat> = []): Enemy => ({
  level: 100,
  stats,
});

describe('getStatFilterer', () => {
  it('keeps tag-matching and Tag.ALL stats for regular scaling', () => {
    const team = [
      createCharacter([
        createStat(CharacterStat.DAMAGE_BONUS, 0.2, [Tag.ELECTRO]),
        createStat(CharacterStat.DAMAGE_BONUS, 0.1, [Tag.GLACIO]),
        createStat(CharacterStat.DAMAGE_BONUS, 0.05, [Tag.ALL]),
      ]),
    ];
    const enemy = createEnemy([
      createStat(EnemyStat.BASE_RESISTANCE, 0.1, [Tag.ELECTRO]),
      createStat(EnemyStat.BASE_RESISTANCE, 0.2, [Tag.GLACIO]),
      createStat(EnemyStat.BASE_RESISTANCE, 0.05, [Tag.ALL]),
    ]);

    const filterStats = getStatFilterer(AttackScalingProperty.ATK, [
      Tag.ELECTRO,
      Tag.BASIC_ATTACK,
    ]);
    const { filteredTeam, filteredEnemy } = filterStats(team, enemy);

    expect(getStatsFor(filteredTeam[0].stats, CharacterStat.DAMAGE_BONUS)).toEqual([
      createStat(CharacterStat.DAMAGE_BONUS, 0.2, [Tag.ELECTRO]),
      createStat(CharacterStat.DAMAGE_BONUS, 0.05, [Tag.ALL]),
    ]);
    expect(getStatsFor(filteredEnemy.stats, EnemyStat.BASE_RESISTANCE)).toEqual([
      createStat(EnemyStat.BASE_RESISTANCE, 0.1, [Tag.ELECTRO]),
      createStat(EnemyStat.BASE_RESISTANCE, 0.05, [Tag.ALL]),
    ]);
  });

  it('removes all tagged stats for fixed scaling', () => {
    const team = [
      createCharacter([createStat(CharacterStat.FINAL_DAMAGE_BONUS, 0.5, [Tag.ALL])]),
    ];
    const enemy = createEnemy([
      createStat(EnemyStat.DEFENSE_REDUCTION, 0.5, [Tag.ALL]),
    ]);

    const filterStats = getStatFilterer(AttackScalingProperty.FIXED, [Tag.ELECTRO]);
    const { filteredTeam, filteredEnemy } = filterStats(team, enemy);

    expect(
      getStatsFor(filteredTeam[0].stats, CharacterStat.FINAL_DAMAGE_BONUS),
    ).toEqual([]);
    expect(getStatsFor(filteredEnemy.stats, EnemyStat.DEFENSE_REDUCTION)).toEqual([]);
  });

  it('uses per-stat declarative negative-status rules for character stats', () => {
    const team = [
      createCharacter([
        createStat(CharacterStat.DEFENSE_IGNORE, 0.3, [Attribute.AERO]),
        createStat(CharacterStat.DEFENSE_IGNORE, 0.9, [Attribute.FUSION]),
        createStat(CharacterStat.DAMAGE_AMPLIFICATION, 1, [Attribute.AERO]),
        createStat(CharacterStat.DAMAGE_AMPLIFICATION, 2, [
          NegativeStatus.AERO_EROSION,
        ]),
      ]),
    ];
    const enemy = createEnemy();

    const filterStats = getStatFilterer(AttackScalingProperty.AERO_EROSION, [
      Tag.ALL,
      Attribute.AERO,
      NegativeStatus.AERO_EROSION,
    ]);
    const { filteredTeam } = filterStats(team, enemy);

    expect(getStatsFor(filteredTeam[0].stats, CharacterStat.DEFENSE_IGNORE)).toEqual([
      createStat(CharacterStat.DEFENSE_IGNORE, 0.3, [Attribute.AERO]),
    ]);
    expect(
      getStatsFor(filteredTeam[0].stats, CharacterStat.DAMAGE_AMPLIFICATION),
    ).toEqual([
      createStat(CharacterStat.DAMAGE_AMPLIFICATION, 2, [NegativeStatus.AERO_EROSION]),
    ]);
  });

  it('keeps negative-status enemy stats for both attribute and status tags', () => {
    const team = [createCharacter()];
    const enemy = createEnemy([
      createStat(EnemyStat.BASE_RESISTANCE, 0.1, [Attribute.AERO]),
      createStat(EnemyStat.BASE_RESISTANCE, 0.2, [Attribute.FUSION]),
      createStat(EnemyStat.AERO_EROSION, 9, [NegativeStatus.AERO_EROSION]),
      createStat(EnemyStat.AERO_EROSION, 4, [NegativeStatus.FUSION_BURST]),
    ]);

    const filterStats = getStatFilterer(AttackScalingProperty.AERO_EROSION, [
      Tag.ALL,
      Attribute.AERO,
      NegativeStatus.AERO_EROSION,
    ]);
    const { filteredEnemy } = filterStats(team, enemy);

    expect(getStatsFor(filteredEnemy.stats, EnemyStat.BASE_RESISTANCE)).toEqual([
      createStat(EnemyStat.BASE_RESISTANCE, 0.1, [Attribute.AERO]),
    ]);
    expect(getStatsFor(filteredEnemy.stats, EnemyStat.AERO_EROSION)).toEqual([
      createStat(EnemyStat.AERO_EROSION, 9, [NegativeStatus.AERO_EROSION]),
    ]);
  });

  it('matches tune rupture atk conditional offensive stats only on the tune rupture tag', () => {
    const team = [
      createCharacter([
        createStat(CharacterStat.DAMAGE_BONUS, 0.3, [Tag.TUNE_RUPTURE]),
        createStat(CharacterStat.DAMAGE_BONUS, 0.2, [Tag.ELECTRO]),
        createStat(CharacterStat.DAMAGE_BONUS, 0.1, [Tag.ALL]),
        createStat(CharacterStat.CRITICAL_DAMAGE, 0.5, [Tag.TUNE_RUPTURE]),
        createStat(CharacterStat.CRITICAL_DAMAGE, 0.25, [Tag.BASIC_ATTACK]),
      ]),
    ];
    const enemy = createEnemy();

    const filterStats = getStatFilterer(AttackScalingProperty.TUNE_RUPTURE_ATK, [
      Tag.ELECTRO,
      Tag.BASIC_ATTACK,
      Tag.TUNE_RUPTURE,
    ]);
    const { filteredTeam } = filterStats(team, enemy);

    expect(getStatsFor(filteredTeam[0].stats, CharacterStat.DAMAGE_BONUS)).toEqual([
      createStat(CharacterStat.DAMAGE_BONUS, 0.3, [Tag.TUNE_RUPTURE]),
    ]);
    expect(getStatsFor(filteredTeam[0].stats, CharacterStat.CRITICAL_DAMAGE)).toEqual([
      createStat(CharacterStat.CRITICAL_DAMAGE, 0.5, [Tag.TUNE_RUPTURE]),
    ]);
  });

  it('still applies non-conditional stats generally for tune rupture atk', () => {
    const team = [
      createCharacter([
        createStat(CharacterStat.FINAL_DAMAGE_BONUS, 0.15, [Tag.TUNE_RUPTURE]),
        createStat(CharacterStat.FINAL_DAMAGE_BONUS, 0.25, [Tag.ELECTRO]),
        createStat(CharacterStat.FINAL_DAMAGE_BONUS, 0.05, [Tag.ALL]),
        createStat(CharacterStat.FINAL_DAMAGE_BONUS, 0.9, [Tag.GLACIO]),
        createStat(CharacterStat.TUNE_BREAK_BOOST, 0.4, [Tag.TUNE_RUPTURE]),
        createStat(CharacterStat.TUNE_BREAK_BOOST, 0.2, [Tag.ALL]),
        createStat(CharacterStat.TUNE_BREAK_BOOST, 0.8, [Tag.GLACIO]),
      ]),
    ];
    const enemy = createEnemy([
      createStat(EnemyStat.BASE_RESISTANCE, 0.1, [Tag.ELECTRO]),
      createStat(EnemyStat.BASE_RESISTANCE, 0.05, [Tag.TUNE_RUPTURE]),
      createStat(EnemyStat.BASE_RESISTANCE, 0.02, [Tag.ALL]),
      createStat(EnemyStat.BASE_RESISTANCE, 0.2, [Tag.GLACIO]),
    ]);

    const filterStats = getStatFilterer(AttackScalingProperty.TUNE_RUPTURE_ATK, [
      Tag.ELECTRO,
      Tag.BASIC_ATTACK,
      Tag.TUNE_RUPTURE,
    ]);
    const { filteredTeam, filteredEnemy } = filterStats(team, enemy);

    expect(
      getStatsFor(filteredTeam[0].stats, CharacterStat.FINAL_DAMAGE_BONUS),
    ).toEqual([
      createStat(CharacterStat.FINAL_DAMAGE_BONUS, 0.15, [Tag.TUNE_RUPTURE]),
      createStat(CharacterStat.FINAL_DAMAGE_BONUS, 0.25, [Tag.ELECTRO]),
      createStat(CharacterStat.FINAL_DAMAGE_BONUS, 0.05, [Tag.ALL]),
    ]);
    expect(getStatsFor(filteredTeam[0].stats, CharacterStat.TUNE_BREAK_BOOST)).toEqual([
      createStat(CharacterStat.TUNE_BREAK_BOOST, 0.4, [Tag.TUNE_RUPTURE]),
      createStat(CharacterStat.TUNE_BREAK_BOOST, 0.2, [Tag.ALL]),
    ]);
    expect(getStatsFor(filteredEnemy.stats, EnemyStat.BASE_RESISTANCE)).toEqual([
      createStat(EnemyStat.BASE_RESISTANCE, 0.1, [Tag.ELECTRO]),
      createStat(EnemyStat.BASE_RESISTANCE, 0.05, [Tag.TUNE_RUPTURE]),
      createStat(EnemyStat.BASE_RESISTANCE, 0.02, [Tag.ALL]),
    ]);
  });
});

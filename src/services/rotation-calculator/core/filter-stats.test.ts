import { describe, expect, it } from 'vitest';

import {
  AttackScalingProperty,
  Attribute,
  CharacterStat,
  EnemyStat,
  NegativeStatus,
  Tag,
} from '@/types';
import type {
  Character,
  CharacterStats,
  Enemy,
  EnemyStats,
  TaggedStatValue,
} from '@/types';

import { getStatFilterer } from './filter-stats';

const createEmptyCharacterStats = (): CharacterStats => {
  return Object.fromEntries(
    Object.values(CharacterStat).map((stat) => [stat, [] as Array<TaggedStatValue>]),
  ) as CharacterStats;
};

const createEmptyEnemyStats = (): EnemyStats => {
  return Object.fromEntries(
    Object.values(EnemyStat).map((stat) => [stat, [] as Array<TaggedStatValue>]),
  ) as EnemyStats;
};

const createCharacter = (stats: Partial<CharacterStats> = {}): Character => ({
  id: 1,
  level: 90,
  stats: {
    ...createEmptyCharacterStats(),
    ...stats,
  },
});

const createEnemy = (stats: Partial<EnemyStats> = {}): Enemy => ({
  level: 100,
  stats: {
    ...createEmptyEnemyStats(),
    ...stats,
  },
});

describe('getStatFilterer', () => {
  it('keeps tag-matching and Tag.ALL stats for regular scaling', () => {
    const team = [
      createCharacter({
        [CharacterStat.DAMAGE_BONUS]: [
          { tags: [Tag.ELECTRO], value: 0.2 },
          { tags: [Tag.GLACIO], value: 0.1 },
          { tags: [Tag.ALL], value: 0.05 },
        ],
      }),
    ];
    const enemy = createEnemy({
      [EnemyStat.BASE_RESISTANCE]: [
        { tags: [Tag.ELECTRO], value: 0.1 },
        { tags: [Tag.GLACIO], value: 0.2 },
        { tags: [Tag.ALL], value: 0.05 },
      ],
    });

    const filterStats = getStatFilterer(AttackScalingProperty.ATK, [
      Tag.ELECTRO,
      Tag.BASIC_ATTACK,
    ]);
    const { filteredTeam, filteredEnemy } = filterStats(team, enemy);

    expect(filteredTeam[0].stats[CharacterStat.DAMAGE_BONUS]).toEqual([
      { tags: [Tag.ELECTRO], value: 0.2 },
      { tags: [Tag.ALL], value: 0.05 },
    ]);
    expect(filteredEnemy.stats[EnemyStat.BASE_RESISTANCE]).toEqual([
      { tags: [Tag.ELECTRO], value: 0.1 },
      { tags: [Tag.ALL], value: 0.05 },
    ]);
  });

  it('treats legacy flat stat keys as regular scaling in declarative config', () => {
    const team = [
      createCharacter({
        [CharacterStat.DAMAGE_BONUS]: [
          { tags: [Tag.ELECTRO], value: 0.2 },
          { tags: [Tag.ALL], value: 0.1 },
        ],
      }),
    ];
    const enemy = createEnemy();

    const filterStats = getStatFilterer(
      CharacterStat.ATTACK_FLAT as unknown as AttackScalingProperty,
      [Tag.ELECTRO],
    );
    const { filteredTeam } = filterStats(team, enemy);

    expect(filteredTeam[0].stats[CharacterStat.DAMAGE_BONUS]).toEqual([
      { tags: [Tag.ELECTRO], value: 0.2 },
      { tags: [Tag.ALL], value: 0.1 },
    ]);
  });

  it('removes all tagged stats for fixed scaling', () => {
    const team = [
      createCharacter({
        [CharacterStat.FINAL_DAMAGE_BONUS]: [{ tags: [Tag.ALL], value: 0.5 }],
      }),
    ];
    const enemy = createEnemy({
      [EnemyStat.DEFENSE_REDUCTION]: [{ tags: [Tag.ALL], value: 0.5 }],
    });

    const filterStats = getStatFilterer(AttackScalingProperty.FIXED, [Tag.ELECTRO]);
    const { filteredTeam, filteredEnemy } = filterStats(team, enemy);

    expect(filteredTeam[0].stats[CharacterStat.FINAL_DAMAGE_BONUS]).toEqual([]);
    expect(filteredEnemy.stats[EnemyStat.DEFENSE_REDUCTION]).toEqual([]);
  });

  it('uses per-stat declarative negative-status rules for character stats', () => {
    const team = [
      createCharacter({
        [CharacterStat.DEFENSE_IGNORE]: [
          { tags: [Attribute.AERO], value: 0.3 },
          { tags: [Attribute.FUSION], value: 0.9 },
        ],
        [CharacterStat.DAMAGE_AMPLIFICATION]: [
          { tags: [Attribute.AERO], value: 1 },
          { tags: [NegativeStatus.AERO_EROSION], value: 2 },
        ],
      }),
    ];
    const enemy = createEnemy();

    const filterStats = getStatFilterer(AttackScalingProperty.AERO_EROSION, [
      Tag.ALL,
      Attribute.AERO,
      NegativeStatus.AERO_EROSION,
    ]);
    const { filteredTeam } = filterStats(team, enemy);

    expect(filteredTeam[0].stats[CharacterStat.DEFENSE_IGNORE]).toEqual([
      { tags: [Attribute.AERO], value: 0.3 },
    ]);
    expect(filteredTeam[0].stats[CharacterStat.DAMAGE_AMPLIFICATION]).toEqual([
      { tags: [NegativeStatus.AERO_EROSION], value: 2 },
    ]);
  });

  it('keeps negative-status enemy stats for both attribute and status tags', () => {
    const team = [createCharacter()];
    const enemy = createEnemy({
      [EnemyStat.BASE_RESISTANCE]: [
        { tags: [Attribute.AERO], value: 0.1 },
        { tags: [Attribute.FUSION], value: 0.2 },
      ],
      [EnemyStat.AERO_EROSION]: [
        { tags: [NegativeStatus.AERO_EROSION], value: 9 },
        { tags: [NegativeStatus.FUSION_BURST], value: 4 },
      ],
    });

    const filterStats = getStatFilterer(AttackScalingProperty.AERO_EROSION, [
      Tag.ALL,
      Attribute.AERO,
      NegativeStatus.AERO_EROSION,
    ]);
    const { filteredEnemy } = filterStats(team, enemy);

    expect(filteredEnemy.stats[EnemyStat.BASE_RESISTANCE]).toEqual([
      { tags: [Attribute.AERO], value: 0.1 },
    ]);
    expect(filteredEnemy.stats[EnemyStat.AERO_EROSION]).toEqual([
      { tags: [NegativeStatus.AERO_EROSION], value: 9 },
    ]);
  });
});

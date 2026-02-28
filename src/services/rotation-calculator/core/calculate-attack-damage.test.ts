import { describe, expect, it } from 'vitest';

import { AttackScalingProperty, CharacterStat, EnemyStat, Tag } from '@/types';
import type { CharacterStats, Enemy, EnemyStats, TaggedStatValue, Team } from '@/types';

import { calculateAttackDamage } from './calculate-attack-damage';
import type { ResolveRuntimeStatType } from './resolve-runtime-stat-values';

const createEmptyCharacterStats = (): CharacterStats<number> => {
  return Object.fromEntries(
    Object.values(CharacterStat).map((stat) => [
      stat,
      [] as Array<TaggedStatValue<number>>,
    ]),
  ) as CharacterStats<number>;
};

const createEmptyEnemyStats = (): EnemyStats<number> => {
  return Object.fromEntries(
    Object.values(EnemyStat).map((stat) => [
      stat,
      [] as Array<TaggedStatValue<number>>,
    ]),
  ) as EnemyStats<number>;
};

const createCharacter = (
  stats: Partial<CharacterStats<number>> = {},
): ResolveRuntimeStatType<Team>[number] => ({
  id: 1,
  level: 90,
  stats: {
    ...createEmptyCharacterStats(),
    ...stats,
  },
});

const createEnemy = (
  stats: Partial<EnemyStats<number>> = {},
): ResolveRuntimeStatType<Enemy> => ({
  level: 90,
  stats: {
    ...createEmptyEnemyStats(),
    ...stats,
  },
});

describe('calculateAttackDamage', () => {
  it('uses atk scaling and applies tune break boost for tune rupture atk', () => {
    const team = [
      createCharacter({
        [CharacterStat.ATTACK_FLAT]: [{ tags: [Tag.ALL], value: 1000 }],
        [CharacterStat.TUNE_BREAK_BOOST]: [{ tags: [Tag.TUNE_RUPTURE], value: 25 }],
      }),
    ];
    const enemy = createEnemy({
      [EnemyStat.BASE_RESISTANCE]: [{ tags: [Tag.ALL], value: 0 }],
    });

    const { result, inputs } = calculateAttackDamage(
      {
        scalingStat: AttackScalingProperty.TUNE_RUPTURE_ATK,
        motionValue: 1,
        tags: [Tag.TUNE_RUPTURE, Tag.ELECTRO],
      },
      0,
      team,
      enemy,
    );

    expect(inputs.character.attackScalingPropertyValue).toBe(1000);
    expect(inputs.baseDamage).toBe(1000);
    expect(result).toBeCloseTo(626.65, 2);
  });

  it('uses the matching underlying hp and def scaling stats for tune rupture variants', () => {
    const team = [
      createCharacter({
        [CharacterStat.HP_FLAT]: [{ tags: [Tag.ALL], value: 2000 }],
        [CharacterStat.DEFENSE_FLAT]: [{ tags: [Tag.ALL], value: 500 }],
      }),
    ];
    const enemy = createEnemy({
      [EnemyStat.BASE_RESISTANCE]: [{ tags: [Tag.ALL], value: 0 }],
    });

    const hpResult = calculateAttackDamage(
      {
        scalingStat: AttackScalingProperty.TUNE_RUPTURE_HP,
        motionValue: 1,
        tags: [Tag.TUNE_RUPTURE],
      },
      0,
      team,
      enemy,
    );
    const defenseResult = calculateAttackDamage(
      {
        scalingStat: AttackScalingProperty.TUNE_RUPTURE_DEF,
        motionValue: 1,
        tags: [Tag.TUNE_RUPTURE],
      },
      0,
      team,
      enemy,
    );

    expect(hpResult.inputs.character.attackScalingPropertyValue).toBe(2000);
    expect(hpResult.inputs.baseDamage).toBe(2000);
    expect(defenseResult.inputs.character.attackScalingPropertyValue).toBe(500);
    expect(defenseResult.inputs.baseDamage).toBe(500);
  });
});

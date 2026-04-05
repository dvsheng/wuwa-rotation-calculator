import { describe, expect, it } from 'vitest';

import { AttackScalingProperty, CharacterStat, EnemyStat } from '@/types';

import { calculateAttackDamage } from './calculate-attack-damage';

const createCharacterStats = (
  overrides: Partial<Record<CharacterStat | 'level', number>> = {},
): Record<CharacterStat | 'level', number> => ({
  level: 90,
  [CharacterStat.ATTACK_FLAT]: 0,
  [CharacterStat.ATTACK_SCALING_BONUS]: 0,
  [CharacterStat.ATTACK_FLAT_BONUS]: 0,
  [CharacterStat.DEFENSE_FLAT]: 0,
  [CharacterStat.DEFENSE_SCALING_BONUS]: 0,
  [CharacterStat.DEFENSE_FLAT_BONUS]: 0,
  [CharacterStat.HP_FLAT]: 0,
  [CharacterStat.HP_SCALING_BONUS]: 0,
  [CharacterStat.HP_FLAT_BONUS]: 0,
  [CharacterStat.DAMAGE_BONUS]: 0,
  [CharacterStat.CRITICAL_RATE]: 0,
  [CharacterStat.CRITICAL_DAMAGE]: 0,
  [CharacterStat.DEFENSE_IGNORE]: 0,
  [CharacterStat.RESISTANCE_PENETRATION]: 0,
  [CharacterStat.DAMAGE_AMPLIFICATION]: 0,
  [CharacterStat.DAMAGE_MULTIPLIER_BONUS]: 0,
  [CharacterStat.FINAL_DAMAGE_BONUS]: 0,
  [CharacterStat.OFF_TUNE_BUILDUP_RATE]: 0,
  [CharacterStat.TUNE_BREAK_BOOST]: 0,
  [CharacterStat.TUNE_STRAIN_DAMAGE_BONUS]: 0,
  [CharacterStat.ENERGY_REGEN]: 0,
  [CharacterStat.HEALING_BONUS]: 0,
  ...overrides,
});

const createEnemyStats = (
  overrides: Partial<Record<EnemyStat | 'level', number>> = {},
): Record<EnemyStat | 'level', number> => ({
  level: 90,
  [EnemyStat.BASE_RESISTANCE]: 0,
  [EnemyStat.DEFENSE_REDUCTION]: 0,
  [EnemyStat.RESISTANCE_REDUCTION]: 0,
  [EnemyStat.GLACIO_CHAFE]: 0,
  [EnemyStat.SPECTRO_FRAZZLE]: 0,
  [EnemyStat.FUSION_BURST]: 0,
  [EnemyStat.HAVOC_BANE]: 0,
  [EnemyStat.AERO_EROSION]: 0,
  [EnemyStat.ELECTRO_FLARE]: 0,
  [EnemyStat.TUNE_STRAIN_STACKS]: 0,
  ...overrides,
});

describe('calculateAttackDamage', () => {
  it('uses atk scaling and applies tune break boost for tune rupture atk', () => {
    const characterStats = createCharacterStats({
      [CharacterStat.ATTACK_FLAT]: 1000,
      [CharacterStat.TUNE_BREAK_BOOST]: 0.25,
    });
    const enemyStats = createEnemyStats({
      [EnemyStat.BASE_RESISTANCE]: 0,
    });

    const { result, inputs } = calculateAttackDamage(
      {
        scalingStat: AttackScalingProperty.TUNE_RUPTURE_ATK,
        motionValue: 1,
      },
      characterStats,
      enemyStats,
    );

    expect(inputs.baseDamage).toBe(1000);
    expect(result).toBeCloseTo(626.65, 2);
  });

  it('uses the matching underlying hp and def scaling stats for tune rupture variants', () => {
    const characterStats = createCharacterStats({
      [CharacterStat.HP_FLAT]: 2000,
      [CharacterStat.DEFENSE_FLAT]: 500,
    });
    const enemyStats = createEnemyStats({
      [EnemyStat.BASE_RESISTANCE]: 0,
    });

    const hpResult = calculateAttackDamage(
      {
        scalingStat: AttackScalingProperty.TUNE_RUPTURE_HP,
        motionValue: 1,
      },
      characterStats,
      enemyStats,
    );
    const defenseResult = calculateAttackDamage(
      {
        scalingStat: AttackScalingProperty.TUNE_RUPTURE_DEF,
        motionValue: 1,
      },
      characterStats,
      enemyStats,
    );

    expect(hpResult.inputs.baseDamage).toBe(2000);
    expect(defenseResult.inputs.baseDamage).toBe(500);
  });
});

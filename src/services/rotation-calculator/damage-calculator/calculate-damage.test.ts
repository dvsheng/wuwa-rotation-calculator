import { describe, expect, it } from 'vitest';

import { CharacterStat, EnemyStat } from '@/types';

import { calculateDamage } from './calculate-damage';
import type { CalculateDamageProperties } from './types';

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
  [CharacterStat.CRITICAL_DAMAGE]: 0.5,
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
  [EnemyStat.BASE_RESISTANCE]: 0.1,
  [EnemyStat.RESISTANCE_REDUCTION]: 0,
  [EnemyStat.DEFENSE_REDUCTION]: 0,
  [EnemyStat.SPECTRO_FRAZZLE]: 0,
  [EnemyStat.AERO_EROSION]: 0,
  [EnemyStat.FUSION_BURST]: 0,
  [EnemyStat.GLACIO_CHAFE]: 0,
  [EnemyStat.HAVOC_BANE]: 0,
  [EnemyStat.ELECTRO_FLARE]: 0,
  [EnemyStat.TUNE_STRAIN_STACKS]: 0,
  ...overrides,
});

describe('calculateDamage', () => {
  const baseProperties: CalculateDamageProperties = {
    character: createCharacterStats(),
    enemy: createEnemyStats(),
    baseDamage: 1000,
  };

  it('calculates basic damage correctly', () => {
    // baseDamage = 1000 * 1 + 0 = 1000
    // multipliers = 1 (bonus) * 1 (amplify) * 1 (multBonus) * 1 (finalBonus) * 1 (crit)
    // playerDefense = 8 * 90 + 800 = 1520
    // enemyDefense = 8 * 90 + 792 = 1512
    // defenseMultiplier = 1520 / (1520 + 1512) = 1520 / 3032 ≈ 0.50131926
    // resistanceMultiplier = 1 - 0.1 = 0.9
    // expected = 1000 * 0.50131926 * 0.9 = 451.187334
    const result = calculateDamage(baseProperties);
    expect(result).toBeCloseTo(451.19, 2);
  });

  it('uses the provided precomputed baseDamage', () => {
    const properties = {
      ...baseProperties,
      baseDamage: 700,
    };
    // baseDamage is provided by the caller after scaling logic
    // defense/res = 0.50131926 * 0.9 = 0.451187334
    // expected = 700 * 0.451187334 = 315.8311338
    const result = calculateDamage(properties);
    expect(result).toBeCloseTo(315.83, 2);
  });

  it('applies damageBonusFinal correctly', () => {
    const properties = {
      ...baseProperties,
      character: {
        ...baseProperties.character,
        finalDamageBonus: 0.1, // 10% final damage bonus
      },
    };
    // expected = 451.187 * 1.1 = 496.306
    const result = calculateDamage(properties);
    expect(result).toBeCloseTo(496.31, 2);
  });

  it('applies damageMultiplierBonus correctly', () => {
    const properties = {
      ...baseProperties,
      character: {
        ...baseProperties.character,
        damageMultiplierBonus: 0.2, // 20% multiplier bonus
      },
    };
    // defense/res = 0.50131926 * 0.9 = 0.451187334
    // expected = 1000 * 1.2 * 0.451187334 = 541.42
    const result = calculateDamage(properties);
    expect(result).toBeCloseTo(541.42, 2);
  });

  it('combines multiple multipliers correctly', () => {
    const properties = {
      ...baseProperties,
      baseDamage: 700,
      character: {
        ...baseProperties.character,
        damageBonus: 0.5,
        finalDamageBonus: 0.1,
      },
    };
    // baseDamage is provided by the caller after scaling logic
    // multipliers:
    // (1 + 0.5) * (1 + 0.1) = 1.5 * 1.1 = 1.65
    // defense/res = 0.50131926 * 0.9 = 0.451187334
    // expected = 700 * 1.65 * 0.451187334 = 521.12137
    const result = calculateDamage(properties);
    expect(result).toBeCloseTo(521.12, 2);
  });
});

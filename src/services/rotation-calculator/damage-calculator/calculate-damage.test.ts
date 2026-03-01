import { describe, expect, it } from 'vitest';

import { calculateDamage } from './calculate-damage';
import type { CalculateDamageProperties } from './calculate-damage.types';

describe('calculateDamage', () => {
  const baseProperties: CalculateDamageProperties = {
    character: {
      level: 90,
      damageBonus: 0,
      damageMultiplierBonus: 0,
      damageAmplification: 0,
      tuneStrainDamageBonus: 0,
      finalDamageBonus: 0,
      criticalRate: 0,
      criticalDamage: 0.5,
      defenseIgnore: 0,
      resistancePenetration: 0,
    },
    enemy: {
      level: 90,
      baseResistance: 0.1,
      resistanceReduction: 0,
      defenseReduction: 0,
      spectroFrazzle: 0,
      aeroErosion: 0,
      fusionBurst: 0,
      glacioChafe: 0,
      havocBane: 0,
      electroFlare: 0,
      tuneStrainStacks: 0,
    },
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

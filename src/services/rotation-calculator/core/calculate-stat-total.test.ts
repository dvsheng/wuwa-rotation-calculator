import { describe, expect, it } from 'vitest';

import { AttackScalingProperty, CharacterStat } from '@/types';

import {
  calculateAttackScalingPropertyValue,
  sumStatValues,
} from './calculate-stat-total';

const createMockStats = (
  attackFlat: number,
  attackScalingBonus: number,
  attackFlatBonus: number,
  defenseFlat: number,
  defenseScalingBonus: number,
  defenseFlatBonus: number,
  hpFlat: number,
  hpScalingBonus: number,
  hpFlatBonus: number,
): Record<CharacterStat, number> => ({
  [CharacterStat.ATTACK_FLAT]: attackFlat,
  [CharacterStat.ATTACK_SCALING_BONUS]: attackScalingBonus,
  [CharacterStat.ATTACK_FLAT_BONUS]: attackFlatBonus,
  [CharacterStat.DEFENSE_FLAT]: defenseFlat,
  [CharacterStat.DEFENSE_SCALING_BONUS]: defenseScalingBonus,
  [CharacterStat.DEFENSE_FLAT_BONUS]: defenseFlatBonus,
  [CharacterStat.HP_FLAT]: hpFlat,
  [CharacterStat.HP_SCALING_BONUS]: hpScalingBonus,
  [CharacterStat.HP_FLAT_BONUS]: hpFlatBonus,
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
});

describe('sumStatValues', () => {
  it('sums stat values correctly', () => {
    const statValues = [{ value: 5 }, { value: 7 }, { value: 3 }];
    expect(sumStatValues(statValues)).toBe(15);
  });

  it('returns 0 for empty array', () => {
    expect(sumStatValues([])).toBe(0);
  });

  it('handles single value', () => {
    expect(sumStatValues([{ value: 42 }])).toBe(42);
  });
});

describe('calculateAttackScalingPropertyValue', () => {
  describe('ATK calculation', () => {
    it('calculates ATK with flat only', () => {
      const stats = createMockStats(100, 0, 0, 0, 0, 0, 0, 0, 0);
      expect(
        calculateAttackScalingPropertyValue(stats, AttackScalingProperty.ATK),
      ).toBe(100);
    });

    it('calculates ATK with scaling bonus', () => {
      const stats = createMockStats(100, 0.5, 0, 0, 0, 0, 0, 0, 0);
      expect(
        calculateAttackScalingPropertyValue(stats, AttackScalingProperty.ATK),
      ).toBe(150);
    });

    it('calculates ATK with flat bonus', () => {
      const stats = createMockStats(100, 0, 50, 0, 0, 0, 0, 0, 0);
      expect(
        calculateAttackScalingPropertyValue(stats, AttackScalingProperty.ATK),
      ).toBe(150);
    });

    it('calculates ATK with all components', () => {
      const stats = createMockStats(100, 0.5, 50, 0, 0, 0, 0, 0, 0);
      expect(
        calculateAttackScalingPropertyValue(stats, AttackScalingProperty.ATK),
      ).toBe(200);
    });
  });

  describe('DEF calculation', () => {
    it('calculates DEF with flat only', () => {
      const stats = createMockStats(0, 0, 0, 100, 0, 0, 0, 0, 0);
      expect(
        calculateAttackScalingPropertyValue(stats, AttackScalingProperty.DEF),
      ).toBe(100);
    });

    it('calculates DEF with scaling bonus', () => {
      const stats = createMockStats(0, 0, 0, 100, 0.5, 0, 0, 0, 0);
      expect(
        calculateAttackScalingPropertyValue(stats, AttackScalingProperty.DEF),
      ).toBe(150);
    });

    it('calculates DEF with flat bonus', () => {
      const stats = createMockStats(0, 0, 0, 100, 0, 50, 0, 0, 0);
      expect(
        calculateAttackScalingPropertyValue(stats, AttackScalingProperty.DEF),
      ).toBe(150);
    });

    it('calculates DEF with all components', () => {
      const stats = createMockStats(0, 0, 0, 100, 0.5, 50, 0, 0, 0);
      expect(
        calculateAttackScalingPropertyValue(stats, AttackScalingProperty.DEF),
      ).toBe(200);
    });
  });

  describe('HP calculation', () => {
    it('calculates HP with flat only', () => {
      const stats = createMockStats(0, 0, 0, 0, 0, 0, 100, 0, 0);
      expect(calculateAttackScalingPropertyValue(stats, AttackScalingProperty.HP)).toBe(
        100,
      );
    });

    it('calculates HP with scaling bonus', () => {
      const stats = createMockStats(0, 0, 0, 0, 0, 0, 100, 0.5, 0);
      expect(calculateAttackScalingPropertyValue(stats, AttackScalingProperty.HP)).toBe(
        150,
      );
    });

    it('calculates HP with flat bonus', () => {
      const stats = createMockStats(0, 0, 0, 0, 0, 0, 100, 0, 50);
      expect(calculateAttackScalingPropertyValue(stats, AttackScalingProperty.HP)).toBe(
        150,
      );
    });

    it('calculates HP with all components', () => {
      const stats = createMockStats(0, 0, 0, 0, 0, 0, 100, 0.5, 50);
      expect(calculateAttackScalingPropertyValue(stats, AttackScalingProperty.HP)).toBe(
        200,
      );
    });
  });
});

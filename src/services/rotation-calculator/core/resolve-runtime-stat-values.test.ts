import { describe, expect, it } from 'vitest';

import { CharacterStat, Tag } from '@/types';
import type { Character, CharacterStats, Enemy, Team } from '@/types';

import { createRuntimeStatResolver } from './resolve-runtime-stat-values';

/**
 * Creates a minimal character for testing with specific stats.
 */
const createTestCharacter = (
  id: number,
  stats: Partial<CharacterStats> = {},
): Character => ({
  id,
  level: 90,
  stats: {
    [CharacterStat.ATTACK_FLAT]: [{ tags: [Tag.ALL], value: 1000 }],
    [CharacterStat.ATTACK_SCALING_BONUS]: [{ tags: [Tag.ALL], value: 0.5 }],
    [CharacterStat.ATTACK_FLAT_BONUS]: [],
    [CharacterStat.DEFENSE_FLAT]: [{ tags: [Tag.ALL], value: 500 }],
    [CharacterStat.DEFENSE_SCALING_BONUS]: [],
    [CharacterStat.DEFENSE_FLAT_BONUS]: [],
    [CharacterStat.HP_FLAT]: [{ tags: [Tag.ALL], value: 10_000 }],
    [CharacterStat.HP_SCALING_BONUS]: [],
    [CharacterStat.HP_FLAT_BONUS]: [],
    [CharacterStat.CRITICAL_RATE]: [{ tags: [Tag.ALL], value: 0.05 }],
    [CharacterStat.CRITICAL_DAMAGE]: [{ tags: [Tag.ALL], value: 0.5 }],
    [CharacterStat.DEFENSE_IGNORE]: [],
    [CharacterStat.RESISTANCE_PENETRATION]: [],
    [CharacterStat.DAMAGE_BONUS]: [],
    [CharacterStat.DAMAGE_AMPLIFICATION]: [],
    [CharacterStat.DAMAGE_MULTIPLIER_BONUS]: [],
    [CharacterStat.FINAL_DAMAGE_BONUS]: [],
    [CharacterStat.FLAT_DAMAGE]: [],
    [CharacterStat.OFF_TUNE_BUILDUP_RATE]: [],
    [CharacterStat.TUNE_BREAK_BOOST]: [],
    [CharacterStat.ENERGY_REGEN]: [{ tags: [Tag.ALL], value: 1 }],
    [CharacterStat.HEALING_BONUS]: [],
    ...stats,
  },
});

/**
 * Creates a minimal enemy for testing.
 */
const createTestEnemy = (): Enemy => ({
  level: 90,
  stats: {
    baseResistance: [{ tags: [Tag.GLACIO], value: 0.1 }],
    defenseReduction: [],
    resistanceReduction: [],
    glacioChafe: [],
    spectroFrazzle: [],
    fusionBurst: [],
    havocBane: [],
    aeroErosion: [],
    electroFlare: [],
  },
});

describe('createRuntimeStatResolver', () => {
  it('resolves literal number values', () => {
    const team: Team = [
      createTestCharacter(12_345),
      createTestCharacter(11_111),
      createTestCharacter(99_999),
    ];
    const enemy = createTestEnemy();

    const resolver = createRuntimeStatResolver(team, enemy);
    const result = resolver(100);

    expect(result).toBe(100);
  });

  it('resolves RotationRuntimeResolvableNumber using character at index 0', () => {
    const team: Team = [
      createTestCharacter(12_345, {
        [CharacterStat.ENERGY_REGEN]: [{ tags: [Tag.ALL], value: 1.5 }],
      }),
      createTestCharacter(11_111),
      createTestCharacter(99_999),
    ];
    const enemy = createTestEnemy();

    const resolver = createRuntimeStatResolver(team, enemy);
    const result = resolver({
      resolveWith: 0,
      parameterConfigs: {
        energyRegen: {
          scale: 2,
        },
      },
    });

    // Character has 1.5 energy regen, scaled by 2.0 = 3.0
    expect(result).toBe(3);
  });

  it('resolves RotationRuntimeResolvableNumber using character at index 1', () => {
    const team: Team = [
      createTestCharacter(12_345),
      createTestCharacter(11_111, {
        [CharacterStat.ENERGY_REGEN]: [{ tags: [Tag.ALL], value: 1.2 }],
      }),
      createTestCharacter(99_999),
    ];
    const enemy = createTestEnemy();

    const resolver = createRuntimeStatResolver(team, enemy);
    const result = resolver({
      resolveWith: 1,
      parameterConfigs: {
        energyRegen: {
          scale: 1,
        },
      },
    });

    // Character has 1.2 energy regen, scaled by 1.0 = 1.2
    expect(result).toBe(1.2);
  });

  it('resolves RotationRuntimeResolvableNumber using character at index 2', () => {
    const team: Team = [
      createTestCharacter(12_345),
      createTestCharacter(11_111),
      createTestCharacter(99_999, {
        [CharacterStat.ENERGY_REGEN]: [{ tags: [Tag.ALL], value: 0.8 }],
      }),
    ];
    const enemy = createTestEnemy();

    const resolver = createRuntimeStatResolver(team, enemy);
    const result = resolver({
      resolveWith: 2,
      parameterConfigs: {
        energyRegen: {
          scale: 2.5,
        },
      },
    });

    // Character has 0.8 energy regen, scaled by 2.5 = 2.0
    expect(result).toBe(2);
  });

  it('applies parameterConfig minimum threshold (stat below threshold)', () => {
    const team: Team = [
      createTestCharacter(12_345, {
        [CharacterStat.ENERGY_REGEN]: [{ tags: [Tag.ALL], value: 0.8 }],
      }),
      createTestCharacter(11_111),
      createTestCharacter(99_999),
    ];
    const enemy = createTestEnemy();

    const resolver = createRuntimeStatResolver(team, enemy);
    const result = resolver({
      resolveWith: 0,
      parameterConfigs: {
        energyRegen: {
          scale: 2,
          minimum: 1,
        },
      },
    });

    // energyRegen is 0.8, below minimum 1.0, so contribution is 0
    expect(result).toBe(0);
  });

  it('applies parameterConfig maximum cap', () => {
    const team: Team = [
      createTestCharacter(12_345, {
        [CharacterStat.ENERGY_REGEN]: [{ tags: [Tag.ALL], value: 2.5 }],
      }),
      createTestCharacter(11_111),
      createTestCharacter(99_999),
    ];
    const enemy = createTestEnemy();

    const resolver = createRuntimeStatResolver(team, enemy);
    const result = resolver({
      resolveWith: 0,
      parameterConfigs: {
        energyRegen: {
          scale: 1,
          maximum: 2,
        },
      },
    });

    // energyRegen is 2.5, but capped at maximum 2.0, so contribution is 1 * 2.0 = 2.0
    expect(result).toBe(2);
  });

  it('applies offset to resolved value', () => {
    const team: Team = [
      createTestCharacter(12_345, {
        [CharacterStat.ENERGY_REGEN]: [{ tags: [Tag.ALL], value: 1 }],
      }),
      createTestCharacter(11_111),
      createTestCharacter(99_999),
    ];
    const enemy = createTestEnemy();

    const resolver = createRuntimeStatResolver(team, enemy);
    const result = resolver({
      resolveWith: 0,
      parameterConfigs: {
        energyRegen: {
          scale: 1,
        },
      },
      offset: 0.5,
    });

    // 1.0 * 1.0 + 0.5 = 1.5
    expect(result).toBe(1.5);
  });
});

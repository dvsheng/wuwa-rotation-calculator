import { describe, expect, it } from 'vitest';

import { isRefineScalableNumber, resolveRefineScaling } from './get-weapon-details';

describe('isRefineScalableNumber', () => {
  it('returns true for valid RefineScalableNumber', () => {
    expect(isRefineScalableNumber({ base: 0.1, increment: 0.02 })).toBe(true);
    expect(isRefineScalableNumber({ base: 0, increment: 0 })).toBe(true);
  });

  it('returns false for plain numbers', () => {
    expect(isRefineScalableNumber(0.1)).toBe(false);
    expect(isRefineScalableNumber(0)).toBe(false);
  });

  it('returns false for objects without required properties', () => {
    expect(isRefineScalableNumber({ base: 0.1 })).toBe(false);
    expect(isRefineScalableNumber({ increment: 0.02 })).toBe(false);
    expect(isRefineScalableNumber({})).toBe(false);
    expect(isRefineScalableNumber({ base: '0.1', increment: 0.02 })).toBe(false);
  });

  it('returns false for null and undefined', () => {
    // eslint-disable-next-line unicorn/no-null
    expect(isRefineScalableNumber(null)).toBe(false);
    // eslint-disable-next-line unicorn/no-useless-undefined
    expect(isRefineScalableNumber(undefined)).toBe(false);
  });
});

describe('resolveRefineScaling', () => {
  describe('plain numbers', () => {
    it('passes through plain numbers unchanged', () => {
      expect(resolveRefineScaling(0.5, 1)).toBe(0.5);
      expect(resolveRefineScaling(0.5, 5)).toBe(0.5);
    });
  });

  describe('RefineScalableNumber', () => {
    it('resolves to base at refine level 1', () => {
      const value = { base: 0.1, increment: 0.02 };
      expect(resolveRefineScaling(value, 1)).toBe(0.1);
    });

    it('resolves correctly at refine level 3', () => {
      const value = { base: 0.1, increment: 0.02 };
      // 0.1 + (3-1) * 0.02 = 0.1 + 0.04 = 0.14
      expect(resolveRefineScaling(value, 3)).toBeCloseTo(0.14);
    });

    it('resolves correctly at refine level 5', () => {
      const value = { base: 0.1, increment: 0.02 };
      // 0.1 + (5-1) * 0.02 = 0.1 + 0.08 = 0.18
      expect(resolveRefineScaling(value, 5)).toBeCloseTo(0.18);
    });
  });

  describe('UserParameterizedNumber', () => {
    it('resolves scale inside parameterConfigs', () => {
      const value = {
        parameterConfigs: {
          Stacks: {
            scale: { base: 0.3, increment: 0.075 },
          },
        },
        minimum: 0,
        maximum: 2,
      };

      const result = resolveRefineScaling(value, 3);
      // 0.3 + (3-1) * 0.075 = 0.3 + 0.15 = 0.45
      expect(result.parameterConfigs.Stacks.scale).toBeCloseTo(0.45);
      expect(result.minimum).toBe(0);
      expect(result.maximum).toBe(2);
    });

    it('preserves structure with multiple parameter configs', () => {
      const value = {
        parameterConfigs: {
          '0': {
            scale: { base: 0.04, increment: 0.01 },
            minimum: 0,
            maximum: 4,
          },
        },
      };

      const result = resolveRefineScaling(value, 5);
      // 0.04 + (5-1) * 0.01 = 0.04 + 0.04 = 0.08
      expect(result.parameterConfigs['0'].scale).toBeCloseTo(0.08);
      expect(result.parameterConfigs['0'].minimum).toBe(0);
      expect(result.parameterConfigs['0'].maximum).toBe(4);
    });
  });

  describe('RotationRuntimeResolvableNumber', () => {
    it('resolves scale while preserving resolveWith', () => {
      const value = {
        parameterConfigs: {
          energyRegen: {
            scale: { base: 0.5, increment: 0.1 },
          },
        },
        resolveWith: 'self',
      };

      const result = resolveRefineScaling(value, 4);
      // 0.5 + (4-1) * 0.1 = 0.5 + 0.3 = 0.8
      expect(result.parameterConfigs.energyRegen.scale).toBeCloseTo(0.8);
      expect(result.resolveWith).toBe('self');
    });
  });

  describe('arrays', () => {
    it('resolves arrays of numbers', () => {
      const value = [0.1, { base: 0.2, increment: 0.05 }, 0.3];

      const result = resolveRefineScaling(value, 3);
      expect(result[0]).toBe(0.1);
      // 0.2 + (3-1) * 0.05 = 0.2 + 0.1 = 0.3
      expect(result[1]).toBeCloseTo(0.3);
      expect(result[2]).toBe(0.3);
    });
  });

  describe('nested objects', () => {
    it('resolves deeply nested RefineScalableNumbers', () => {
      const capabilities = {
        attacks: [],
        modifiers: [
          {
            id: 'mod-1',
            description: 'Test modifier',
            target: 'self',
            modifiedStats: [
              {
                stat: 'damageBonus',
                value: { base: 0.2, increment: 0.05 },
                tags: ['all'],
              },
            ],
          },
        ],
        permanentStats: [
          {
            id: 'perm-1',
            stat: 'attackScalingBonus',
            value: { base: 0.12, increment: 0.03 },
            tags: ['all'],
          },
        ],
      };

      const result = resolveRefineScaling(capabilities, 5);

      // Modifier value: 0.2 + (5-1) * 0.05 = 0.2 + 0.2 = 0.4
      expect(result.modifiers[0].modifiedStats[0].value).toBeCloseTo(0.4);

      // PermanentStat value: 0.12 + (5-1) * 0.03 = 0.12 + 0.12 = 0.24
      expect(result.permanentStats[0].value).toBeCloseTo(0.24);

      // Strings should be preserved
      expect(result.modifiers[0].id).toBe('mod-1');
      expect(result.modifiers[0].target).toBe('self');
      expect(result.permanentStats[0].tags).toEqual(['all']);
    });
  });
});

import { describe, expect, it } from 'vitest';

import {
  isRefineScalableNumber,
  resolveStoreNumberType,
} from './database-type-adapters';

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
      expect(resolveStoreNumberType(0.5, 1)).toBe(0.5);
      expect(resolveStoreNumberType(0.5, 5)).toBe(0.5);
    });
  });

  describe('RefineScalableNumber', () => {
    it('resolves to base at refine level 1', () => {
      const value = { base: 0.1, increment: 0.02 };
      expect(resolveStoreNumberType(value, 1)).toBe(0.1);
    });

    it('resolves correctly at refine level 3', () => {
      const value = { base: 0.1, increment: 0.02 };
      // 0.1 + (3-1) * 0.02 = 0.1 + 0.04 = 0.14
      expect(resolveStoreNumberType(value, 3)).toBeCloseTo(0.14);
    });

    it('resolves correctly at refine level 5', () => {
      const value = { base: 0.1, increment: 0.02 };
      // 0.1 + (5-1) * 0.02 = 0.1 + 0.08 = 0.18
      expect(resolveStoreNumberType(value, 5)).toBeCloseTo(0.18);
    });
  });

  describe('arrays', () => {
    it('resolves arrays of numbers', () => {
      const value = [0.1, { base: 0.2, increment: 0.05 }, 0.3];

      const result = resolveStoreNumberType(value, 3);
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
            modifiedStats: [
              {
                target: 'self',
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

      const result = resolveStoreNumberType(capabilities, 5);

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

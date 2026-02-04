import { describe, expect, it } from 'vitest';

import { Tag } from '@/types';

import { getCalculateStatValueFunction } from './calculate-stat-total';

describe('getCalculateStatValueFn', () => {
  const mockTags = ['Basic Attack', 'Glacio'];

  it('includes stats with Tag.ALL', () => {
    const statValues = [{ tags: [Tag.ALL], value: 10 }];
    const calcFunction = getCalculateStatValueFunction(mockTags);
    expect(calcFunction(statValues)).toBe(10);
  });

  it('includes stats with matching tags (intersection)', () => {
    const statValues = [
      { tags: ['Basic Attack'], value: 5 },
      { tags: ['Glacio'], value: 7 },
      { tags: ['Heavy Attack'], value: 100 }, // Should be excluded
    ];
    const calcFunction = getCalculateStatValueFunction(mockTags);
    expect(calcFunction(statValues)).toBe(12);
  });

  it('includes stats when multiple tags match', () => {
    const statValues = [{ tags: ['Basic Attack', 'Glacio'], value: 15 }];
    const calcFunction = getCalculateStatValueFunction(mockTags);
    expect(calcFunction(statValues)).toBe(15);
  });

  it('handles overlapping but non-identical tags correctly', () => {
    // This tests the change from isSubset to intersection
    // If we have tags ['Basic Attack', 'Resonance Skill'] on the stat
    // and the attack has ['Basic Attack', 'Glacio']
    // intersection should be ['Basic Attack'], which is > 0, so it applies.
    const statValues = [{ tags: ['Basic Attack', 'Resonance Skill'], value: 20 }];
    const calcFunction = getCalculateStatValueFunction(mockTags);
    expect(calcFunction(statValues)).toBe(20);
  });

  it('returns 0 for no matches', () => {
    const statValues = [{ tags: ['Resonance Liberation'], value: 50 }];
    const calcFunction = getCalculateStatValueFunction(mockTags);
    expect(calcFunction(statValues)).toBe(0);
  });

  it('returns 0 for undefined statValues', () => {
    const calcFunction = getCalculateStatValueFunction(mockTags);
    // eslint-disable-next-line unicorn/no-useless-undefined
    expect(calcFunction(undefined)).toBe(0);
  });

  it('handles non-numeric values gracefully', () => {
    const statValues = [{ tags: ['Basic Attack'], value: 'invalid' as any }];
    const calcFunction = getCalculateStatValueFunction(mockTags);
    expect(calcFunction(statValues)).toBe(0);
  });
});

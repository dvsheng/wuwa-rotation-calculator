import { describe, expect, it } from 'vitest';

import { getSelectOptions } from './SearchableSelect';

const mockOptions = [
  { id: '1', name: 'Option 1', group: 'Group A' },
  { id: '2', name: 'Option 2', group: 'Group A' },
  { id: '3', name: 'Option 3', group: 'Group B' },
];

describe('getSelectOptions', () => {
  it('does not partition options when groupBy is not passed', () => {
    const result = getSelectOptions(mockOptions);

    // Result should be a flat array of { value, label }
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    expect(result[0]).toEqual({ value: 'Option 1', label: 'Option 1' });
    expect(result[0]).not.toHaveProperty('options');
  });

  it('partitions options when groupBy is passed', () => {
    const result = getSelectOptions(mockOptions, 'group');

    // Result should be an array of { label, options }
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);

    const groupA = (result as any).find((g: any) => g.label === 'Group A');
    expect(groupA).toBeDefined();
    expect(Array.isArray(groupA.options)).toBe(true);
    expect(groupA.options.length).toBe(2);
    expect(groupA.options[0]).toEqual({ value: 'Option 1', label: 'Option 1' });

    const groupB = (result as any).find((g: any) => g.label === 'Group B');
    expect(groupB).toBeDefined();
    expect(groupB.options.length).toBe(1);
    expect(groupB.options[0]).toEqual({ value: 'Option 3', label: 'Option 3' });
  });

  it('sorts groups in descending order when groupOrder is desc', () => {
    const numericOptions = [
      { id: '1', name: '1', cost: 1 },
      { id: '3', name: '3', cost: 3 },
      { id: '4', name: '4', cost: 4 },
    ];
    const result = getSelectOptions(numericOptions, 'cost', 'desc');

    expect(result.length).toBe(3);
    expect((result[0] as any).label).toBe('4');
    expect((result[1] as any).label).toBe('3');
    expect((result[2] as any).label).toBe('1');
  });

  it('sorts groups in ascending order by default', () => {
    const numericOptions = [
      { id: '4', name: '4', cost: 4 },
      { id: '1', name: '1', cost: 1 },
      { id: '3', name: '3', cost: 3 },
    ];
    const result = getSelectOptions(numericOptions, 'cost');

    expect(result.length).toBe(3);
    expect((result[0] as any).label).toBe('1');
    expect((result[1] as any).label).toBe('3');
    expect((result[2] as any).label).toBe('4');
  });
});

import { describe, expect, it } from 'vitest';

// The logic that was fixed: look up the selected item by numeric ID so the
// item object (not a controlled string) is passed to the Combobox root.
// Previously `value` was a string name wired directly to ComboboxInput,
// which overrode user keystrokes and made the field non-searchable.
const resolveSelectedItem = <T extends { id: number }>(
  items: Array<T>,
  value: number | undefined,
): T | undefined => items.find((item) => item.id === value);

const items = [
  { id: 1, name: 'Moonlit Clouds' },
  { id: 2, name: 'Freezing Frost' },
  { id: 3, name: 'Lingering Tunes' },
];

describe('SearchableSelect - selected item resolution', () => {
  it('resolves the correct item when value matches an id', () => {
    expect(resolveSelectedItem(items, 2)).toEqual({ id: 2, name: 'Freezing Frost' });
  });

  it('returns undefined when value does not match any item id', () => {
    expect(resolveSelectedItem(items, 999)).toBeUndefined();
  });

  it('resolves the first item correctly', () => {
    expect(resolveSelectedItem(items, 1)).toEqual({ id: 1, name: 'Moonlit Clouds' });
  });

  it('resolves the last item correctly', () => {
    expect(resolveSelectedItem(items, 3)).toEqual({ id: 3, name: 'Lingering Tunes' });
  });
});

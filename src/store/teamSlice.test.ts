import { describe, expect, it } from 'vitest';

import { useStore } from './index';

describe('useStore - setCharacter', () => {
  // Store is automatically reset after each test via vitest.setup.ts

  it('updates the character id', () => {
    useStore.getState().setCharacter(0, 484);
    expect(useStore.getState().team[0].id).toBe(484);
  });

  it('does not affect other team slots', () => {
    const initialId1 = useStore.getState().team[1].id;
    useStore.getState().setCharacter(0, 484);
    expect(useStore.getState().team[1].id).toBe(initialId1);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SavedRotationData } from '@/schemas/library';

const mocks = vi.hoisted(() => {
  const returning = vi.fn();
  const values = vi.fn(() => ({ returning }));
  const insert = vi.fn(() => ({ values }));

  const database = {
    insert,
  };

  return {
    insert,
    values,
    returning,
    database,
  };
});

vi.mock('@/db/client', () => ({
  database: mocks.database,
}));

describe('createRotationHandler', () => {
  beforeEach(() => {
    mocks.insert.mockClear();
    mocks.values.mockClear();
    mocks.returning.mockClear();
  });

  it('inserts and returns the created rotation', async () => {
    const { createRotationHandler } = await import('./create-rotation.server');

    mocks.returning.mockResolvedValue([
      {
        id: 1,
        ownerId: 'dev-local-owner',
        name: 'My Rotation',
        description: 'desc',
        totalDamage: 1234,
        visibility: 'private',
        data: {
          team: [],
          enemy: {},
          attacks: [],
          buffs: [],
        } as unknown as SavedRotationData,
        createdAt: new Date(100),
        updatedAt: new Date(100),
      },
    ]);

    const result = await createRotationHandler(
      {
        name: 'My Rotation',
        description: 'desc',
        totalDamage: 1234,
        data: {
          team: [],
          enemy: {},
          attacks: [],
          buffs: [],
        } as unknown as SavedRotationData,
      },
      'dev-local-owner',
    );

    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.values).toHaveBeenCalledTimes(1);
    expect(mocks.returning).toHaveBeenCalledTimes(1);
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 'dev-local-owner',
        visibility: 'private',
      }),
    );
    expect(result).toEqual({
      id: 1,
      ownerId: 'dev-local-owner',
      name: 'My Rotation',
      description: 'desc',
      totalDamage: 1234,
      visibility: 'private',
      data: { team: [], enemy: {}, attacks: [], buffs: [] },
      createdAt: new Date(100),
      updatedAt: new Date(100),
    });
  });
});

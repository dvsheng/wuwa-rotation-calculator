import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SavedRotationData } from '@/schemas/library';

const mocks = vi.hoisted(() => {
  const findFirst = vi.fn();
  const returning = vi.fn();
  const where = vi.fn(() => ({ returning }));
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));

  const database = {
    query: {
      rotations: {
        findFirst,
      },
    },
    update,
  };

  return {
    findFirst,
    update,
    set,
    where,
    returning,
    database,
  };
});

vi.mock('@/db/client', () => ({
  database: mocks.database,
}));

describe('updateRotationHandler', () => {
  beforeEach(() => {
    mocks.findFirst.mockClear();
    mocks.update.mockClear();
    mocks.set.mockClear();
    mocks.where.mockClear();
    mocks.returning.mockClear();
  });

  it('updates and returns an existing rotation', async () => {
    const { updateRotationHandler } = await import('./update-rotation.server');

    mocks.findFirst.mockResolvedValue({
      id: 1,
      ownerId: 'dev-local-owner',
      name: 'Old Name',
      description: undefined,
      totalDamage: undefined,
      data: {
        team: [],
        enemy: {},
        attacks: [],
        buffs: [],
      } as unknown as SavedRotationData,
      createdAt: new Date(100),
      updatedAt: new Date(100),
    });
    mocks.returning.mockResolvedValue([
      {
        id: 1,
        ownerId: 'dev-local-owner',
        name: 'New Name',
        description: 'Updated',
        totalDamage: 5000,
        data: {
          team: [],
          enemy: {},
          attacks: [],
          buffs: [],
        } as unknown as SavedRotationData,
        createdAt: new Date(100),
        updatedAt: new Date(200),
      },
    ]);

    const result = await updateRotationHandler(
      { id: 1, name: 'New Name', description: 'Updated', totalDamage: 5000 },
      'dev-local-owner',
    );

    expect(mocks.findFirst).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.set).toHaveBeenCalledTimes(1);
    expect(mocks.where).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      id: 1,
      ownerId: 'dev-local-owner',
      name: 'New Name',
      description: 'Updated',
      totalDamage: 5000,
      data: { team: [], enemy: {}, attacks: [], buffs: [] },
      createdAt: new Date(100),
      updatedAt: new Date(200),
    });
  });

  it('throws when the rotation does not exist for the owner', async () => {
    const { updateRotationHandler } = await import('./update-rotation.server');

    mocks.findFirst.mockResolvedValue(undefined as any);

    await expect(
      updateRotationHandler({ id: 999, name: 'New Name' }, 'dev-local-owner'),
    ).rejects.toThrow('Rotation not found for ID 999');
  });

  it('supports partial updates and preserves falsy numeric values', async () => {
    const { updateRotationHandler } = await import('./update-rotation.server');

    mocks.findFirst.mockResolvedValue({
      id: 1,
      ownerId: 'dev-local-owner',
      name: 'Existing',
      description: 'Existing description',
      totalDamage: 1234,
      data: {
        team: [],
        enemy: {},
        attacks: [],
        buffs: [],
      } as unknown as SavedRotationData,
      createdAt: new Date(100),
      updatedAt: new Date(100),
    });
    mocks.returning.mockResolvedValue([
      {
        id: 1,
        ownerId: 'dev-local-owner',
        name: 'Existing',
        description: 'Existing description',
        totalDamage: 0,
        data: {
          team: [],
          enemy: {},
          attacks: [],
          buffs: [],
        } as unknown as SavedRotationData,
        createdAt: new Date(100),
        updatedAt: new Date(300),
      },
    ]);

    await updateRotationHandler({ id: 1, totalDamage: 0 }, 'dev-local-owner');

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        totalDamage: 0,
      }),
    );
    expect(mocks.set).toHaveBeenCalledWith(
      expect.not.objectContaining({
        name: expect.anything(),
      }),
    );
    expect(mocks.set).toHaveBeenCalledWith(
      expect.not.objectContaining({
        description: expect.anything(),
      }),
    );
  });
});

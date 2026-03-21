import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SavedRotationData } from '@/schemas/library';

const mocks = vi.hoisted(() => {
  const findFirst = vi.fn();

  const database = {
    query: {
      rotations: {
        findFirst,
      },
    },
  };

  return {
    findFirst,
    database,
  };
});

vi.mock('@/db/client', () => ({
  database: mocks.database,
}));

describe('getRotationByIdHandler', () => {
  beforeEach(() => {
    mocks.findFirst.mockReset();
  });

  it('returns a public rotation for guests', async () => {
    const { getRotationByIdHandler } = await import('./get-rotation-by-id.server');

    mocks.findFirst.mockResolvedValue({
      id: 7,
      ownerId: 'other-user',
      name: 'Shared Rotation',
      description: 'Shared',
      totalDamage: 1234,
      visibility: 'public',
      data: {
        team: [],
        enemy: {},
        attacks: [],
        buffs: [],
      } as unknown as SavedRotationData,
      createdAt: new Date(100),
      updatedAt: new Date(200),
    });

    await expect(getRotationByIdHandler({ id: 7 })).resolves.toEqual({
      id: 7,
      ownerId: 'other-user',
      name: 'Shared Rotation',
      description: 'Shared',
      totalDamage: 1234,
      visibility: 'public',
      data: { team: [], enemy: {}, attacks: [], buffs: [] },
      createdAt: new Date(100),
      updatedAt: new Date(200),
    });
  });

  it('returns a private rotation for its owner', async () => {
    const { getRotationByIdHandler } = await import('./get-rotation-by-id.server');

    mocks.findFirst.mockResolvedValue({
      id: 8,
      ownerId: 'dev-local-owner',
      name: 'Private Rotation',
      description: undefined,
      totalDamage: undefined,
      visibility: 'private',
      data: {
        team: [],
        enemy: {},
        attacks: [],
        buffs: [],
      } as unknown as SavedRotationData,
      createdAt: new Date(100),
      updatedAt: new Date(200),
    });

    await expect(getRotationByIdHandler({ id: 8 }, 'dev-local-owner')).resolves.toEqual(
      {
        id: 8,
        ownerId: 'dev-local-owner',
        name: 'Private Rotation',
        description: undefined,
        totalDamage: undefined,
        visibility: 'private',
        data: { team: [], enemy: {}, attacks: [], buffs: [] },
        createdAt: new Date(100),
        updatedAt: new Date(200),
      },
    );
  });

  it('throws when the rotation does not exist', async () => {
    const { getRotationByIdHandler } = await import('./get-rotation-by-id.server');

    mocks.findFirst.mockImplementation(async () => {});

    await expect(getRotationByIdHandler({ id: 999 })).rejects.toThrow(
      'Rotation not found for ID 999',
    );
  });

  it('throws when a guest requests a private rotation they do not own', async () => {
    const { getRotationByIdHandler } = await import('./get-rotation-by-id.server');

    mocks.findFirst.mockResolvedValue({
      id: 9,
      ownerId: 'other-user',
      visibility: 'private',
    });

    await expect(getRotationByIdHandler({ id: 9 })).rejects.toThrow('Unauthorized');
  });
});

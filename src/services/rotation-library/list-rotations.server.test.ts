import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SavedRotationData } from '@/schemas/library';

const mocks = vi.hoisted(() => {
  const findMany = vi.fn();

  const database = {
    query: {
      rotations: {
        findMany,
      },
    },
  };

  return {
    findMany,
    database,
  };
});

vi.mock('@/db/client', () => ({
  database: mocks.database,
}));

describe('listRotationsHandler', () => {
  beforeEach(() => {
    mocks.findMany.mockClear();
  });

  it('returns saved rotations ordered by updatedAt and mapped to API shape', async () => {
    const { listRotationsHandler } = await import('./list-rotations.server');

    mocks.findMany.mockResolvedValue([
      {
        id: 1,
        ownerId: 'dev-local-owner',
        name: 'Rotation 1',
        description: undefined,
        totalDamage: undefined,
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

    const result = await listRotationsHandler({ ownerId: 'dev-local-owner' });

    expect(mocks.findMany).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        id: 1,
        ownerId: 'dev-local-owner',
        name: 'Rotation 1',
        description: undefined,
        totalDamage: undefined,
        data: { team: [], enemy: {}, attacks: [], buffs: [] },
        createdAt: new Date(100),
        updatedAt: new Date(200),
      },
    ]);
  });
});

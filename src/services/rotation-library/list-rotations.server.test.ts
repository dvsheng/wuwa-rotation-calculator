import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SavedRotationData } from '@/schemas/library';

const mocks = vi.hoisted(() => {
  const findMany = vi.fn();
  const selectWhere = vi.fn();
  const selectFrom = vi.fn(() => ({ where: selectWhere }));
  const select = vi.fn(() => ({ from: selectFrom }));

  const database = {
    query: {
      rotations: {
        findMany,
      },
    },
    select,
  };

  return {
    findMany,
    select,
    selectFrom,
    selectWhere,
    database,
  };
});

vi.mock('@/db/client', () => ({
  database: mocks.database,
}));

describe('listRotationsHandler', () => {
  beforeEach(() => {
    mocks.findMany.mockClear();
    mocks.select.mockClear();
    mocks.selectFrom.mockClear();
    mocks.selectWhere.mockClear();
  });

  it('returns owned rotations for the current user', async () => {
    const { listRotationsHandler } = await import('./list-rotations.server');

    mocks.findMany.mockResolvedValue([
      {
        id: 1,
        ownerId: 'dev-local-owner',
        name: 'Rotation 1',
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
      },
    ]);

    const result = await listRotationsHandler(
      { scope: 'owned', offset: 0, limit: 20 },
      'dev-local-owner',
    );

    expect(mocks.findMany).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      items: [
        {
          id: 1,
          ownerId: 'dev-local-owner',
          name: 'Rotation 1',
          description: undefined,
          totalDamage: undefined,
          visibility: 'private',
          isOwner: true,
          data: { team: [], enemy: {}, attacks: [], buffs: [] },
          createdAt: new Date(100),
          updatedAt: new Date(200),
        },
      ],
      total: 1,
      offset: 0,
      limit: 1,
    });
  });

  it('applies character filters to owned rotations too', async () => {
    const { listRotationsHandler } = await import('./list-rotations.server');

    mocks.findMany.mockResolvedValue([
      {
        id: 3,
        ownerId: 'dev-local-owner',
        name: 'Filtered Rotation',
        description: undefined,
        totalDamage: 999,
        visibility: 'private',
        data: {
          team: [{ id: 101 }, { id: 0 }, { id: 0 }],
          enemy: {},
          attacks: [],
          buffs: [],
        } as unknown as SavedRotationData,
        createdAt: new Date(100),
        updatedAt: new Date(300),
      },
    ]);

    const result = await listRotationsHandler(
      { scope: 'owned', offset: 0, limit: 20, characterIds: [101] },
      'dev-local-owner',
    );

    expect(mocks.findMany).toHaveBeenCalledTimes(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.name).toBe('Filtered Rotation');
  });

  it('returns public rotations with ownership metadata', async () => {
    const { listRotationsHandler } = await import('./list-rotations.server');

    mocks.selectWhere.mockResolvedValue([{ count: 2 }]);
    mocks.findMany.mockResolvedValue([
      {
        id: 1,
        ownerId: 'dev-local-owner',
        name: 'My Public Rotation',
        description: undefined,
        totalDamage: 1111,
        visibility: 'public',
        data: {
          team: [],
          enemy: {},
          attacks: [],
          buffs: [],
        } as unknown as SavedRotationData,
        createdAt: new Date(100),
        updatedAt: new Date(200),
      },
      {
        id: 2,
        ownerId: 'other-user',
        name: 'Community Rotation',
        description: 'Shared',
        totalDamage: 2222,
        visibility: 'public',
        data: {
          team: [],
          enemy: {},
          attacks: [],
          buffs: [],
        } as unknown as SavedRotationData,
        createdAt: new Date(150),
        updatedAt: new Date(250),
      },
    ]);

    const result = await listRotationsHandler(
      { scope: 'public', offset: 20, limit: 20, characterIds: [101] },
      'dev-local-owner',
    );

    expect(mocks.select).toHaveBeenCalledTimes(1);
    expect(mocks.findMany).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      items: [
        {
          id: 1,
          ownerId: 'dev-local-owner',
          name: 'My Public Rotation',
          description: undefined,
          totalDamage: 1111,
          visibility: 'public',
          isOwner: true,
          data: { team: [], enemy: {}, attacks: [], buffs: [] },
          createdAt: new Date(100),
          updatedAt: new Date(200),
        },
        {
          id: 2,
          ownerId: 'other-user',
          name: 'Community Rotation',
          description: 'Shared',
          totalDamage: 2222,
          visibility: 'public',
          isOwner: false,
          data: { team: [], enemy: {}, attacks: [], buffs: [] },
          createdAt: new Date(150),
          updatedAt: new Date(250),
        },
      ],
      total: 2,
      offset: 20,
      limit: 20,
    });
  });

  it('marks guest callers as non-owners for public rows', async () => {
    const { listRotationsHandler } = await import('./list-rotations.server');

    mocks.selectWhere.mockResolvedValue([{ count: 1 }]);
    mocks.findMany.mockResolvedValue([
      {
        id: 2,
        ownerId: 'other-user',
        name: 'Community Rotation',
        description: undefined,
        totalDamage: undefined,
        visibility: 'public',
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

    const result = await listRotationsHandler({
      scope: 'public',
      offset: 0,
      limit: 20,
    });

    expect(result.items[0]?.isOwner).toBe(false);
  });

  it('throws when an owned query is requested without a session', async () => {
    const { listRotationsHandler } = await import('./list-rotations.server');

    await expect(
      listRotationsHandler({ scope: 'owned', offset: 0, limit: 20 }),
    ).rejects.toThrow('Unauthorized');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const queryBuilder = {
    where: vi.fn(),
    groupBy: vi.fn(),
    orderBy: vi.fn(),
  };

  queryBuilder.where.mockReturnValue(queryBuilder);
  queryBuilder.groupBy.mockReturnValue(queryBuilder);

  const leftJoin = vi.fn(() => queryBuilder);
  const from = vi.fn(() => ({ leftJoin }));
  const select = vi.fn(() => ({ from }));

  const database = {
    select,
  };

  return {
    queryBuilder,
    leftJoin,
    from,
    select,
    database,
  };
});

vi.mock('@/db/client', () => ({
  database: mocks.database,
}));

describe('listAdminEntitiesHandler', () => {
  beforeEach(() => {
    mocks.select.mockClear();
    mocks.from.mockClear();
    mocks.leftJoin.mockClear();
    mocks.queryBuilder.where.mockClear();
    mocks.queryBuilder.groupBy.mockClear();
    mocks.queryBuilder.orderBy.mockClear();
    mocks.queryBuilder.orderBy.mockResolvedValue([]);
  });

  it('returns entities with computed skill counts', async () => {
    const { listAdminEntitiesHandler } = await import('./list-admin-entities.server');

    mocks.queryBuilder.orderBy.mockResolvedValue([
      {
        entity: {
          id: 101,
          createdAt: new Date(),
          updatedAt: new Date(),
          gameId: 1101,
          name: 'Aalto',
          type: 'character',
        },
        skillCount: 7,
      },
    ]);

    const result = await listAdminEntitiesHandler();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Aalto');
    expect(result[0].skillCount).toBe(7);
  });
});

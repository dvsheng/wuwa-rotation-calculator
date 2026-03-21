import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const orderBy = vi.fn();
  const from = vi.fn(() => ({ orderBy }));
  const select = vi.fn(() => ({ from }));

  const database = {
    select,
  };

  return {
    orderBy,
    from,
    select,
    database,
  };
});

vi.mock('@/db/client', () => ({
  database: mocks.database,
}));

describe('listEntitiesHandler', () => {
  beforeEach(() => {
    mocks.select.mockClear();
    mocks.from.mockClear();
    mocks.orderBy.mockClear();
    mocks.orderBy.mockResolvedValue([]);
  });

  it('returns ordered entities without skill counts', async () => {
    const { listEntitiesHandler } = await import('./list-entities.server');

    mocks.orderBy.mockResolvedValue([
      {
        entity: {
          id: 101,
          createdAt: new Date(),
          updatedAt: new Date(),
          gameId: 1101,
          name: 'Aalto',
          type: 'character',
        },
      },
    ]);

    const result = await listEntitiesHandler();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Aalto');
    expect(result[0]).not.toHaveProperty('skillCount');
  });
});

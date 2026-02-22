import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const queryBuilder = {
    where: vi.fn(),
    orderBy: vi.fn(),
  };

  queryBuilder.where.mockReturnValue(queryBuilder);

  const from = vi.fn(() => queryBuilder);
  const select = vi.fn(() => ({ from }));
  const findFirst = vi.fn();

  const database = {
    select,
    query: {
      entities: {
        findFirst,
      },
    },
  };

  return {
    queryBuilder,
    from,
    select,
    findFirst,
    database,
  };
});

vi.mock('@/db/client', () => ({
  database: mocks.database,
}));

describe('getAdminEntityDetailsHandler', () => {
  beforeEach(() => {
    mocks.select.mockClear();
    mocks.from.mockClear();
    mocks.queryBuilder.where.mockClear();
    mocks.queryBuilder.orderBy.mockClear();
    mocks.findFirst.mockClear();
  });

  it('returns raw full_capabilities rows when capabilities exist', async () => {
    const { getAdminEntityDetailsHandler } =
      await import('./get-admin-entity-details.server');

    const sampleRow = {
      capabilityId: 1,
      capabilityName: 'Strike',
      capabilityDescription: undefined,
      capabilityType: 'attack',
      capabilityJson: { type: 'attack', motionValues: [1] },
      skillId: 12,
      skillName: 'Normal Attack',
      skillDescription: undefined,
      skillIconUrl: undefined,
      skillOriginType: 'Normal Attack',
      entityId: 100,
      entityName: 'Aalto',
      entityType: 'character',
      entityIconUrl: undefined,
      entityDescription: undefined,
      rank: 5,
      weaponType: 'pistols',
      attribute: 'aero',
      echoSetIds: undefined,
      cost: undefined,
      setBonusThresholds: undefined,
    };

    mocks.queryBuilder.orderBy.mockResolvedValue([sampleRow]);

    const result = await getAdminEntityDetailsHandler({ id: 100 });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].skillId).toBe(12);
    expect(result.entity).toBeUndefined();
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it('returns empty rows with entity metadata when entity exists without capabilities', async () => {
    const { getAdminEntityDetailsHandler } =
      await import('./get-admin-entity-details.server');

    mocks.queryBuilder.orderBy.mockResolvedValue([]);
    mocks.findFirst.mockResolvedValue({
      id: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      gameId: 1100,
      name: 'Empty Entity',
      type: 'echo_set',
    });

    const result = await getAdminEntityDetailsHandler({ id: 100 });

    expect(result.rows).toEqual([]);
    expect(result.entity?.name).toBe('Empty Entity');
    expect(mocks.findFirst).toHaveBeenCalledTimes(1);
  });

  it('throws when the entity does not exist', async () => {
    const { getAdminEntityDetailsHandler } =
      await import('./get-admin-entity-details.server');

    mocks.queryBuilder.orderBy.mockResolvedValue([]);
    mocks.findFirst.mockImplementation(() => {});

    await expect(getAdminEntityDetailsHandler({ id: 999_999 })).rejects.toThrow(
      'Entity not found for ID 999999',
    );
  });
});

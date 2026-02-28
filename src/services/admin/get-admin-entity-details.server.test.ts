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
  const findManySkills = vi.fn();

  const database = {
    select,
    query: {
      entities: {
        findFirst,
      },
      skills: {
        findMany: findManySkills,
      },
    },
  };

  return {
    queryBuilder,
    from,
    select,
    findFirst,
    findManySkills,
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
    mocks.findManySkills.mockClear();
  });

  it('returns raw full_capabilities rows when capabilities exist', async () => {
    const { getAdminEntityDetailsHandler } =
      await import('./get-admin-entity-details.server');

    const sampleRow = {
      capabilityId: 1,
      capabilityName: 'Strike',
      capabilityDescription: undefined,
      capabilityType: 'attack',
      capabilityJson: {
        type: 'attack',
        attribute: 'aero',
        damageInstances: [
          { motionValue: 1, tags: ['basicAttack'], scalingStat: 'atk' },
        ],
      },
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

    mocks.findFirst.mockResolvedValue({
      id: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      gameId: 1100,
      name: 'Aalto',
      type: 'character',
    });
    mocks.findManySkills.mockResolvedValue([
      {
        id: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
        gameId: 12,
        entityId: 100,
        name: 'Normal Attack',
        description: undefined,
        iconUrl: undefined,
        originType: 'Normal Attack',
      },
    ]);
    mocks.queryBuilder.orderBy.mockResolvedValue([sampleRow]);

    const result = await getAdminEntityDetailsHandler({ id: 100 });

    expect(result.rows).toHaveLength(1);
    expect(result.skills).toHaveLength(1);
    expect(result.entity?.id).toBe(100);
    expect(result.rows[0].skillId).toBe(12);
    expect(mocks.findFirst).toHaveBeenCalledTimes(1);
    expect(mocks.findManySkills).toHaveBeenCalledTimes(1);
  });

  it('returns skills when entity exists without capability rows', async () => {
    const { getAdminEntityDetailsHandler } =
      await import('./get-admin-entity-details.server');

    mocks.findFirst.mockResolvedValue({
      id: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      gameId: 1100,
      name: 'Empty Entity',
      type: 'echo_set',
    });
    mocks.findManySkills.mockResolvedValue([
      {
        id: 301,
        createdAt: new Date(),
        updatedAt: new Date(),
        gameId: 301,
        entityId: 100,
        name: 'Skill With No Caps',
        description: undefined,
        iconUrl: undefined,
        originType: 'Echo Set',
      },
    ]);
    mocks.queryBuilder.orderBy.mockResolvedValue([]);

    const result = await getAdminEntityDetailsHandler({ id: 100 });

    expect(result.rows).toEqual([]);
    expect(result.skills).toHaveLength(1);
    expect(result.skills[0]?.name).toBe('Skill With No Caps');
    expect(result.entity?.name).toBe('Empty Entity');
    expect(mocks.findFirst).toHaveBeenCalledTimes(1);
    expect(mocks.findManySkills).toHaveBeenCalledTimes(1);
  });

  it('throws when the entity does not exist', async () => {
    const { getAdminEntityDetailsHandler } =
      await import('./get-admin-entity-details.server');

    mocks.findFirst.mockImplementation(() => {});

    await expect(getAdminEntityDetailsHandler({ id: 999_999 })).rejects.toThrow(
      'Entity not found for ID 999999',
    );
    expect(mocks.findManySkills).not.toHaveBeenCalled();
    expect(mocks.select).not.toHaveBeenCalled();
  });
});

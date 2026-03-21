import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const findFirst = vi.fn();

  const database = {
    query: {
      entities: {
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

describe('getEntityDetailsHandler', () => {
  beforeEach(() => {
    mocks.findFirst.mockClear();
  });

  it('returns the entity with nested skills and capabilities', async () => {
    const { getEntityDetailsHandler } = await import('./get-entity-details.server');

    mocks.findFirst.mockResolvedValue({
      id: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      gameId: 1100,
      name: 'Aalto',
      type: 'character',
      description: undefined,
      iconUrl: undefined,
      rank: 5,
      weaponType: 'pistols',
      attribute: 'aero',
      echoSetIds: undefined,
      cost: undefined,
      setBonusThresholds: undefined,
      skills: [
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
          capabilities: [
            {
              id: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              skillId: 12,
              name: 'Strike',
              description: undefined,
              capabilityJson: {
                type: 'attack',
                damageInstances: [
                  {
                    motionValue: 1,
                    attribute: 'aero',
                    damageType: 'basicAttack',
                    tags: ['basicAttack'],
                    scalingStat: 'atk',
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    const result = await getEntityDetailsHandler({ id: 100 });

    expect(result.entity.id).toBe(100);
    expect(result.entity.skills).toHaveLength(1);
    expect(result.entity.skills[0]?.capabilities).toHaveLength(1);
    expect(result.entity.skills[0]?.capabilities[0]?.skillId).toBe(12);
    expect(mocks.findFirst).toHaveBeenCalledTimes(1);
  });

  it('returns the entity when it has skills without capabilities', async () => {
    const { getEntityDetailsHandler } = await import('./get-entity-details.server');

    mocks.findFirst.mockResolvedValue({
      id: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      gameId: 1100,
      name: 'Empty Entity',
      type: 'echo_set',
      description: undefined,
      iconUrl: undefined,
      rank: undefined,
      weaponType: undefined,
      attribute: undefined,
      echoSetIds: undefined,
      cost: undefined,
      setBonusThresholds: [2, 5],
      skills: [
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
          capabilities: [],
        },
      ],
    });

    const result = await getEntityDetailsHandler({ id: 100 });

    expect(result.entity.skills).toHaveLength(1);
    expect(result.entity.skills[0]?.name).toBe('Skill With No Caps');
    expect(result.entity.skills[0]?.capabilities).toEqual([]);
    expect(result.entity.name).toBe('Empty Entity');
    expect(mocks.findFirst).toHaveBeenCalledTimes(1);
  });

  it('throws when the entity does not exist', async () => {
    const { getEntityDetailsHandler } = await import('./get-entity-details.server');

    mocks.findFirst.mockImplementation(() => {});

    await expect(getEntityDetailsHandler({ id: 999_999 })).rejects.toThrow(
      'Entity not found for ID 999999',
    );
  });
});

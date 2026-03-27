import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const findMany = vi.fn();

  return {
    findMany,
    database: {
      query: {
        entities: {
          findMany,
        },
      },
    },
  };
});

vi.mock('@/db/client', () => ({
  database: mocks.database,
}));

describe('listSkillsHandler', () => {
  beforeEach(() => {
    mocks.findMany.mockReset();
  });

  it('returns flattened skills, including orphaned skills without capabilities', async () => {
    const { listSkillsHandler } = await import('./list-skills.server');

    mocks.findMany.mockResolvedValue([
      {
        id: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        gameId: 1100,
        name: 'Aalto',
        type: 'character',
        description: undefined,
        iconUrl: '/entity.png',
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
            description: 'Skill description',
            iconUrl: '/skill.png',
            originType: 'Normal Attack',
          },
          {
            id: 13,
            createdAt: new Date(),
            updatedAt: new Date(),
            gameId: 13,
            entityId: 100,
            name: 'S1',
            description: 'Sequence node',
            iconUrl: undefined,
            originType: 's1',
          },
        ],
      },
    ]);

    const result = await listSkillsHandler({
      entityIds: [100],
    });

    expect(result).toEqual([
      {
        id: 12,
        gameId: 12,
        entityId: 100,
        name: 'Normal Attack',
        description: 'Skill description',
        iconUrl: '/skill.png',
        originType: 'Normal Attack',
      },
      {
        id: 13,
        gameId: 13,
        entityId: 100,
        name: 'S1',
        description: 'Sequence node',
        iconUrl: undefined,
        originType: 's1',
      },
    ]);
    expect(mocks.findMany).toHaveBeenCalledTimes(1);
  });

  it('memoizes repeated identical requests', async () => {
    const { listSkillsHandler } = await import('./list-skills.server');

    mocks.findMany.mockResolvedValue([
      {
        id: 101,
        createdAt: new Date(),
        updatedAt: new Date(),
        gameId: 1101,
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
        skills: [],
      },
    ]);

    const first = await listSkillsHandler({
      entityIds: [101],
    });
    const second = await listSkillsHandler({
      entityIds: [101],
    });

    expect(first).toEqual(second);
    expect(mocks.findMany).toHaveBeenCalledTimes(1);
  });

  it('throws when any requested entity is missing', async () => {
    const { listSkillsHandler } = await import('./list-skills.server');

    mocks.findMany.mockResolvedValue([
      {
        id: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        gameId: 1100,
        name: 'Aalto',
        type: 'character',
        description: undefined,
        iconUrl: '/entity.png',
        rank: 5,
        weaponType: 'pistols',
        attribute: 'aero',
        echoSetIds: undefined,
        cost: undefined,
        setBonusThresholds: undefined,
        skills: [],
      },
    ]);

    await expect(
      listSkillsHandler({
        entityIds: [100, 999],
      }),
    ).rejects.toThrow('Entity not found for ID 999');
  });
});

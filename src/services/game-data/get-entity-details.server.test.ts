import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EchoMainStatOption } from '@/schemas/echo';

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

describe('listCapabilitiesHandler', () => {
  beforeEach(() => {
    mocks.findMany.mockReset();
  });

  it('returns flattened capabilities with skill metadata for multiple entities', async () => {
    const { listCapabilitiesHandler } = await import('./list-capabilities.server');

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
            capabilities: [
              {
                id: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                skillId: 12,
                name: 'Strike',
                description: 'Attack description',
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
      },
      {
        id: 101,
        createdAt: new Date(),
        updatedAt: new Date(),
        gameId: 1101,
        name: 'Novablade',
        type: 'weapon',
        description: undefined,
        iconUrl: '/weapon.png',
        rank: 5,
        weaponType: 'sword',
        attribute: undefined,
        echoSetIds: undefined,
        cost: undefined,
        setBonusThresholds: undefined,
        skills: [
          {
            id: 13,
            createdAt: new Date(),
            updatedAt: new Date(),
            gameId: 13,
            entityId: 101,
            name: 'Weapon Passive',
            description: 'Weapon skill description',
            iconUrl: '/weapon-skill.png',
            originType: 'Weapon Passive',
            capabilities: [
              {
                id: 2,
                createdAt: new Date(),
                updatedAt: new Date(),
                skillId: 13,
                name: 'Sharpen',
                description: 'Modifier description',
                capabilityJson: {
                  type: 'modifier',
                  modifiedStats: [],
                },
              },
            ],
          },
        ],
      },
    ]);

    const result = await listCapabilitiesHandler({
      entityIds: [100, 101],
    });

    expect(result).toEqual([
      {
        id: 1,
        name: 'Strike',
        description: 'Attack description',
        parentName: 'Normal Attack',
        iconUrl: '/skill.png',
        originType: 'Normal Attack',
        skillId: 12,
        entityId: 100,
        skillDescription: 'Skill description',
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
      {
        id: 2,
        name: 'Sharpen',
        description: 'Modifier description',
        parentName: 'Weapon Passive',
        iconUrl: '/weapon-skill.png',
        originType: 'Weapon Passive',
        skillId: 13,
        entityId: 101,
        skillDescription: 'Weapon skill description',
        capabilityJson: {
          type: 'modifier',
          modifiedStats: [],
        },
      },
    ]);
    expect(mocks.findMany).toHaveBeenCalledTimes(1);
  });

  it('memoizes repeated identical requests', async () => {
    const { listCapabilitiesHandler } = await import('./list-capabilities.server');

    mocks.findMany.mockResolvedValue([
      {
        id: 101,
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
        skills: [],
      },
    ]);

    const first = await listCapabilitiesHandler({
      entityIds: [101],
    });
    const second = await listCapabilitiesHandler({
      entityIds: [101],
    });

    expect(first).toEqual(second);
    expect(mocks.findMany).toHaveBeenCalledTimes(1);
  });

  it('throws when any requested entity is missing', async () => {
    const { listCapabilitiesHandler } = await import('./list-capabilities.server');

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
      listCapabilitiesHandler({
        entityIds: [100, 999],
      }),
    ).rejects.toThrow('Entity not found for ID 999');
  });
});

describe('deriveCharacterAttributes', () => {
  it('derives attributes for character entities from attack capabilities', async () => {
    const { deriveCharacterAttributes } =
      await import('./character-derived-attributes');

    const result = deriveCharacterAttributes([
      {
        id: 1,
        name: 'Blazing Slash',
        originType: 'Normal Attack',
        parentName: 'Normal Attack',
        skillId: 10,
        entityId: 104,
        capabilityJson: {
          type: 'attack',
          damageInstances: [
            {
              attribute: 'fusion',
              damageType: 'basicAttack',
              tags: [],
              motionValue: 1,
              scalingStat: 'atk',
            },
            {
              attribute: 'fusion',
              damageType: 'resonanceSkill',
              tags: [],
              motionValue: 1,
              scalingStat: 'atk',
            },
          ],
        },
      } as any,
    ]);

    expect(result).toEqual({
      preferredScalingStat: 'atk',
      dominantAttribute: 'fusion',
      preferredThreeCostScalingMainStat: EchoMainStatOption.ATK_PERCENT,
      preferredThreeCostAttributeMainStat: EchoMainStatOption.DAMAGE_BONUS_FUSION,
    });
  });

  it('prioritizes hp or defense scaling over atk when deriving main stats', async () => {
    const { deriveCharacterAttributes } =
      await import('./character-derived-attributes');

    const result = deriveCharacterAttributes([
      {
        id: 1,
        name: 'Spectral Burst',
        originType: 'Resonance Liberation',
        parentName: 'Resonance Liberation',
        skillId: 10,
        entityId: 105,
        capabilityJson: {
          type: 'attack',
          damageInstances: [
            {
              attribute: 'spectro',
              damageType: 'resonanceLiberation',
              tags: [],
              motionValue: 1,
              scalingStat: 'hp',
            },
            {
              attribute: 'spectro',
              damageType: 'basicAttack',
              tags: [],
              motionValue: 1,
              scalingStat: 'atk',
            },
          ],
        },
      } as any,
    ]);

    expect(result.preferredScalingStat).toBe('hp');
    expect(result.preferredThreeCostScalingMainStat).toBe(
      EchoMainStatOption.HP_PERCENT,
    );
    expect(result.preferredThreeCostAttributeMainStat).toBe(
      EchoMainStatOption.DAMAGE_BONUS_SPECTRO,
    );
  });
});

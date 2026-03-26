import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EchoMainStatOption } from '@/schemas/echo';

const mocks = vi.hoisted(() => {
  const findFirst = vi.fn();

  return {
    findFirst,
    database: {
      query: {
        entities: {
          findFirst,
        },
      },
    },
  };
});

vi.mock('@/db/client', () => ({
  database: mocks.database,
}));

describe('listEntityCapabilitiesHandler', () => {
  beforeEach(() => {
    mocks.findFirst.mockReset();
  });

  it('returns flattened capabilities with skill metadata', async () => {
    const { listEntityCapabilitiesHandler } =
      await import('./list-entity-capabilities.server');

    mocks.findFirst.mockResolvedValue({
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
    });

    const result = await listEntityCapabilitiesHandler({
      id: 100,
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
    ]);
    expect(mocks.findFirst).toHaveBeenCalledTimes(1);
  });

  it('memoizes repeated identical requests', async () => {
    const { listEntityCapabilitiesHandler } =
      await import('./list-entity-capabilities.server');

    mocks.findFirst.mockResolvedValue({
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
    });

    const first = await listEntityCapabilitiesHandler({
      id: 101,
    });
    const second = await listEntityCapabilitiesHandler({
      id: 101,
    });

    expect(first).toEqual(second);
    expect(mocks.findFirst).toHaveBeenCalledTimes(1);
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

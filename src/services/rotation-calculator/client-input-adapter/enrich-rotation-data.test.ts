import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Team as ClientTeam } from '@/schemas/team';
import { CapabilityType, filterAndResolveCapabilities } from '@/services/game-data';
import {
  AttackScalingProperty,
  Attribute,
  CharacterStat,
  DamageType,
  Tag,
} from '@/types';

import { GameDataNotFoundError, createGameDataEnricher } from './enrich-rotation-data';

const { mockListOwnedCapabilitiesForTeam } = vi.hoisted(() => ({
  mockListOwnedCapabilitiesForTeam: vi.fn(),
}));

vi.mock('@/services/game-data/list-owned-team-capabilities', () => ({
  listOwnedCapabilitiesForTeam: mockListOwnedCapabilitiesForTeam,
}));

const createAttackCapability = (id: number, entityId: number) => ({
  id,
  name: 'Basic Attack 1',
  description: 'A basic attack',
  originType: 'Normal Attack',
  parentName: 'Basic Attack',
  skillId: 1,
  entityId,
  capabilityJson: {
    type: CapabilityType.ATTACK,
    damageInstances: [
      {
        motionValue: 1.5,
        tags: [Tag.BASIC_ATTACK],
        damageType: DamageType.BASIC_ATTACK,
        attribute: Attribute.PHYSICAL,
        scalingStat: AttackScalingProperty.ATK,
      },
    ],
  },
});

const createModifierCapability = (id: number, entityId: number) => ({
  id,
  name: 'Damage Buff',
  description: 'Increases damage',
  originType: 'Resonance Skill',
  parentName: 'Resonance Skill',
  skillId: 2,
  entityId,
  capabilityJson: {
    type: CapabilityType.MODIFIER,
    modifiedStats: [
      {
        target: 'self' as const,
        stat: CharacterStat.DAMAGE_BONUS,
        value: 0.2,
        tags: [Tag.ALL],
      },
    ],
  },
});

const createPermanentStatCapability = (
  id: number,
  entityId: number,
  stat: CharacterStat,
  value: number,
  tags: Array<string> = [Tag.ALL],
  parentName = 'Base Stats',
) => ({
  id,
  name: `${stat} ${value}`,
  description: undefined,
  originType: 'Base Stats',
  parentName,
  skillId: 3,
  entityId,
  capabilityJson: {
    type: CapabilityType.PERMANENT_STAT,
    stat,
    value,
    tags,
  },
});

const mockTeam: ClientTeam = [
  {
    id: 1306,
    sequence: 6,
    weapon: { id: 21_040_016, refine: '5' as const },
    echoSets: [{ id: 1, requirement: '5' as const }],
    primarySlotEcho: { id: 6_000_038 },
    echoStats: [],
  },
  {
    id: 1405,
    sequence: 0,
    weapon: { id: 21_050_016, refine: '1' as const },
    echoSets: [{ id: 2, requirement: '5' as const }],
    primarySlotEcho: { id: 6_000_041 },
    echoStats: [],
  },
  {
    id: 1102,
    sequence: 6,
    weapon: { id: 21_010_026, refine: '1' as const },
    echoSets: [{ id: 3, requirement: '5' as const }],
    primarySlotEcho: { id: 6_000_037 },
    echoStats: [],
  },
];

const setupCapabilities = () => {
  const capabilitiesByEntityId = new Map<number, Array<any>>([
    [
      1306,
      [
        createAttackCapability(101, 1306),
        createModifierCapability(201, 1306),
        createPermanentStatCapability(301, 1306, CharacterStat.ATTACK_FLAT, 500),
      ],
    ],
    [
      21_040_016,
      [createPermanentStatCapability(401, 21_040_016, CharacterStat.ATTACK_FLAT, 300)],
    ],
    [
      6_000_038,
      [
        createPermanentStatCapability(
          501,
          6_000_038,
          CharacterStat.ATTACK_SCALING_BONUS,
          0.15,
        ),
      ],
    ],
    [
      1,
      [
        createPermanentStatCapability(
          601,
          1,
          CharacterStat.DAMAGE_BONUS,
          0.1,
          [Tag.ELECTRO],
          'Lingering Tunes - 5',
        ),
      ],
    ],
    [1405, []],
    [21_050_016, []],
    [6_000_041, []],
    [2, []],
    [1102, []],
    [21_010_026, []],
    [6_000_037, []],
    [3, []],
  ]);

  mockListOwnedCapabilitiesForTeam.mockImplementation(
    (
      team: ClientTeam,
      getCharacterOwner: (character: ClientTeam[number], characterIndex: number) => any,
    ) =>
      Promise.resolve(
        team.flatMap((character, characterIndex) => {
          const characterOwner = getCharacterOwner(character, characterIndex);

          return [
            ...filterAndResolveCapabilities(
              capabilitiesByEntityId.get(character.primarySlotEcho.id) ?? [],
              {},
            ).map((capability) => ({
              ...capability,
              ...characterOwner,
              entityId: character.primarySlotEcho.id,
            })),
            ...filterAndResolveCapabilities(
              capabilitiesByEntityId.get(character.id) ?? [],
              { sequence: character.sequence },
            ).map((capability) => ({
              ...capability,
              ...characterOwner,
              entityId: character.id,
            })),
            ...filterAndResolveCapabilities(
              capabilitiesByEntityId.get(character.weapon.id) ?? [],
              { refineLevel: character.weapon.refine },
            ).map((capability) => ({
              ...capability,
              ...characterOwner,
              entityId: character.weapon.id,
            })),
            ...character.echoSets.flatMap((set) =>
              filterAndResolveCapabilities(capabilitiesByEntityId.get(set.id) ?? [], {
                activatedSetBonus: Number.parseInt(set.requirement) as 2 | 3 | 5,
              }).map((capability) => ({
                ...capability,
                ...characterOwner,
                entityId: set.id,
              })),
            ),
          ];
        }),
      ),
  );
};

describe('createGameDataEnricher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupCapabilities();
  });

  it('returns enricher methods', async () => {
    const enricher = await createGameDataEnricher(mockTeam);

    expect(enricher.enrichAttack).toBeTypeOf('function');
    expect(enricher.enrichModifier).toBeTypeOf('function');
    expect(enricher.getPermanentStatsForCharacter).toBeTypeOf('function');
    expect(mockListOwnedCapabilitiesForTeam).toHaveBeenCalledTimes(1);
  });

  it('enriches attack instances with resolved capability details', async () => {
    const enricher = await createGameDataEnricher(mockTeam);

    const result = enricher.enrichAttack({
      id: 101,
      characterId: 1306,
      instanceId: 'attack-1',
      parameterValues: [{ id: '0', value: 50 }],
    });

    expect(result.name).toBe('Basic Attack 1');
    expect(result.characterIndex).toBe(0);
    expect(result.capabilityJson.damageInstances[0].damageType).toBe(
      DamageType.BASIC_ATTACK,
    );
    expect(result.parameterValues).toEqual([{ id: '0', value: 50 }]);
  });

  it('enriches modifier instances and preserves layout fields', async () => {
    const enricher = await createGameDataEnricher(mockTeam);

    const result = enricher.enrichModifier({
      id: 201,
      characterId: 1306,
      instanceId: 'buff-1',
      x: 5,
      y: 2,
      w: 3,
      h: 1,
    });

    expect(result.name).toBe('Damage Buff');
    expect(result.capabilityJson.modifiedStats[0]?.target).toBe('self');
    expect(result.x).toBe(5);
    expect(result.w).toBe(3);
  });

  it('throws a GameDataNotFoundError when an attack is missing', async () => {
    const enricher = await createGameDataEnricher(mockTeam);

    expect(() =>
      enricher.enrichAttack({
        id: 999,
        characterId: 1306,
        instanceId: 'missing-attack',
      }),
    ).toThrow(GameDataNotFoundError);
  });

  it('aggregates permanent stats for the requested character index', async () => {
    const enricher = await createGameDataEnricher(mockTeam);

    const stats = enricher.getPermanentStatsForCharacter(0);

    expect(stats.map((stat) => stat.id)).toEqual([501, 301, 401, 601]);
  });

  it('filters echo set capabilities using parentName requirements', async () => {
    mockListOwnedCapabilitiesForTeam.mockImplementation(
      (
        team: ClientTeam,
        getCharacterOwner: (
          character: ClientTeam[number],
          characterIndex: number,
        ) => any,
      ) =>
        Promise.resolve(
          team.flatMap((character, characterIndex) => {
            const characterOwner = getCharacterOwner(character, characterIndex);

            return character.echoSets.flatMap((set) =>
              filterAndResolveCapabilities(
                (set.id === 1
                  ? [
                      createPermanentStatCapability(
                        701,
                        1,
                        CharacterStat.CRITICAL_RATE,
                        0.05,
                        [Tag.ALL],
                        'Lingering Tunes - 2',
                      ),
                      createPermanentStatCapability(
                        702,
                        1,
                        CharacterStat.CRITICAL_DAMAGE,
                        0.2,
                        [Tag.ALL],
                        'Lingering Tunes - 5',
                      ),
                    ]
                  : []) as any,
                {
                  activatedSetBonus: Number.parseInt(set.requirement) as 2 | 3 | 5,
                },
              ).map((capability) => ({
                ...capability,
                ...characterOwner,
                entityId: set.id,
              })),
            );
          }),
        ),
    );

    const teamWithTwoPiece = [
      {
        ...mockTeam[0],
        echoSets: [{ id: 1, requirement: '2' as const }],
      },
      mockTeam[1],
      mockTeam[2],
    ] as ClientTeam;

    const enricher = await createGameDataEnricher(teamWithTwoPiece);
    const stats = enricher.getPermanentStatsForCharacter(0);

    expect(stats.map((stat) => stat.id)).toContain(701);
    expect(stats.map((stat) => stat.id)).not.toContain(702);
  });
});

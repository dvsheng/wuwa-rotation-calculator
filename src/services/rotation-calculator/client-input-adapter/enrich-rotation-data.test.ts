import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';
import type { Team as ClientTeam } from '@/schemas/team';
import { AttackScalingProperty, Attribute, CharacterStat, Tag } from '@/types';

import { GameDataNotFoundError, createGameDataEnricher } from './enrich-rotation-data';

// Use vi.hoisted to define mocks used in vi.mock
const { mockgetEntityById } = vi.hoisted(() => ({
  mockgetEntityById: vi.fn(),
}));

vi.mock('@/services/game-data', async () => {
  const actual = await vi.importActual('@/services/game-data');

  return {
    ...actual,
    getEntityById: ({ data }: { data: unknown }) => mockgetEntityById(data),
  };
});

vi.mock('@/services/game-data/get-entity-details.function', () => ({
  getTypedEntityById: mockgetEntityById,
}));

// Mock data shared across tests
const mockAttackDetails = [
  {
    id: 101,
    name: 'Basic Attack 1',
    description: 'A basic attack',
    originType: 'Normal Attack',
    attribute: Attribute.PHYSICAL,
    damageInstances: [
      {
        motionValue: 1.5,
        tags: [Tag.BASIC_ATTACK],
        scalingStat: AttackScalingProperty.ATK,
      },
      {
        motionValue: 2,
        tags: [Tag.BASIC_ATTACK],
        scalingStat: AttackScalingProperty.ATK,
      },
    ],
  },
  {
    id: 102,
    name: 'Skill Attack',
    description: 'A skill attack',
    originType: 'Resonance Skill',
    attribute: Attribute.ELECTRO,
    damageInstances: [
      {
        motionValue: 3,
        tags: [Tag.RESONANCE_SKILL, Tag.ELECTRO],
        scalingStat: AttackScalingProperty.ATK,
      },
    ],
  },
];

const mockModifierDetails = [
  {
    id: 201,
    name: 'Damage Buff',
    description: 'Increases damage',
    originType: 'Resonance Skill',
    modifiedStats: [
      {
        target: 'self' as const,
        stat: CharacterStat.DAMAGE_BONUS,
        value: 0.2,
        tags: [Tag.ALL],
      },
    ],
  },
  {
    id: 202,
    name: 'Crit Buff',
    description: 'Increases crit rate',
    originType: 'Outro Skill',
    modifiedStats: [
      {
        target: 'team' as const,
        stat: CharacterStat.CRITICAL_RATE,
        value: 0.15,
        tags: [Tag.ALL],
      },
    ],
  },
];

const mockPermanentStats = [
  { stat: CharacterStat.ATTACK_FLAT, value: 100, tags: [Tag.ALL] },
];

/**
 * Helper function to set up default mock implementation for game data entities.
 * Returns the same capabilities for all entity types.
 */
const setupDefaultGameDataMock = (config?: {
  attacks?: typeof mockAttackDetails;
  modifiers?: typeof mockModifierDetails;
  permanentStats?: typeof mockPermanentStats;
}) => {
  const attacks = config?.attacks ?? mockAttackDetails;
  const modifiers = config?.modifiers ?? mockModifierDetails;
  const permanentStats = config?.permanentStats ?? mockPermanentStats;

  mockgetEntityById.mockImplementation(() =>
    Promise.resolve({
      capabilities: {
        attacks,
        modifiers,
        permanentStats,
      },
    }),
  );
};

describe('createGameDataEnricher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultGameDataMock();
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

  it('should return enricher with all methods', async () => {
    const enricher = await createGameDataEnricher(mockTeam);

    expect(enricher).toHaveProperty('enrichAttack');
    expect(enricher).toHaveProperty('enrichModifier');
    expect(enricher).toHaveProperty('getPermanentStatsForCharacter');
    expect(typeof enricher.enrichAttack).toBe('function');
    expect(typeof enricher.enrichModifier).toBe('function');
    expect(typeof enricher.getPermanentStatsForCharacter).toBe('function');
  });

  describe('enrichAttack', () => {
    it('should enrich attack instance with full details', async () => {
      const enricher = await createGameDataEnricher(mockTeam);
      const attackInstance: AttackInstance = {
        id: 101,
        characterId: 1,
        instanceId: 'attack-1',
      };

      const result = enricher.enrichAttack(attackInstance);

      expect(result).toEqual({
        id: 101,
        characterId: 1,
        instanceId: 'attack-1',
        name: 'Basic Attack 1',
        description: 'A basic attack',
        originType: 'Normal Attack',
        attribute: Attribute.PHYSICAL,
        damageInstances: [
          {
            motionValue: 1.5,
            tags: [Tag.BASIC_ATTACK],
            scalingStat: AttackScalingProperty.ATK,
          },
          {
            motionValue: 2,
            tags: [Tag.BASIC_ATTACK],
            scalingStat: AttackScalingProperty.ATK,
          },
        ],
      });
    });

    it('should throw GameDataNotFoundError when attack details not found', async () => {
      const enricher = await createGameDataEnricher(mockTeam);
      const attackInstance: AttackInstance = {
        id: 999,
        characterId: 1,
        instanceId: 'attack-999',
      };

      expect(() => enricher.enrichAttack(attackInstance)).toThrow(
        GameDataNotFoundError,
      );
    });

    it('should preserve parameter values when enriching', async () => {
      const enricher = await createGameDataEnricher(mockTeam);
      const attackInstance: AttackInstance = {
        id: 101,
        characterId: 1,
        instanceId: 'attack-1',
        parameterValues: [{ id: '0', value: 50 }],
      };

      const result = enricher.enrichAttack(attackInstance);

      expect(result.parameterValues).toEqual([{ id: '0', value: 50 }]);
    });
  });

  describe('enrichModifier', () => {
    it('should enrich modifier instance with full details', async () => {
      const enricher = await createGameDataEnricher(mockTeam);
      const modifierInstance: ModifierInstance = {
        id: 201,
        characterId: 1,
        instanceId: 'mod-1',
        x: 0,
        y: 0,
        w: 5,
        h: 1,
      };

      const result = enricher.enrichModifier(modifierInstance);

      expect(result).toEqual({
        id: 201,
        characterId: 1,
        instanceId: 'mod-1',
        x: 0,
        y: 0,
        w: 5,
        h: 1,
        name: 'Damage Buff',
        description: 'Increases damage',
        originType: 'Resonance Skill',
        modifiedStats: [
          {
            target: 'self',
            stat: CharacterStat.DAMAGE_BONUS,
            value: 0.2,
            tags: [Tag.ALL],
          },
        ],
      });
    });

    it('should throw GameDataNotFoundError when modifier details not found', async () => {
      const enricher = await createGameDataEnricher(mockTeam);
      const modifierInstance: ModifierInstance = {
        id: 999,
        characterId: 1,
        instanceId: 'mod-999',
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      };

      expect(() => enricher.enrichModifier(modifierInstance)).toThrow(
        GameDataNotFoundError,
      );
    });

    it('should preserve position and size when enriching', async () => {
      const enricher = await createGameDataEnricher(mockTeam);
      const modifierInstance: ModifierInstance = {
        id: 201,
        characterId: 1,
        instanceId: 'mod-1',
        x: 5,
        y: 2,
        w: 3,
        h: 1,
      };

      const result = enricher.enrichModifier(modifierInstance);

      expect(result.x).toBe(5);
      expect(result.y).toBe(2);
      expect(result.w).toBe(3);
      expect(result.h).toBe(1);
    });
  });

  describe('getPermanentStatsForCharacter', () => {
    it('should get permanent stats from character, weapon, echo, and echo sets', async () => {
      // Mock different permanent stats for each entity type
      const characterPermanentStats = [
        { stat: CharacterStat.ATTACK_FLAT, value: 500, tags: [Tag.ALL] },
        { stat: CharacterStat.HP_FLAT, value: 10_000, tags: [Tag.ALL] },
      ];
      const weaponPermanentStats = [
        { stat: CharacterStat.ATTACK_FLAT, value: 300, tags: [Tag.ALL] },
      ];
      const echoPermanentStats = [
        { stat: CharacterStat.ATTACK_SCALING_BONUS, value: 0.15, tags: [Tag.ALL] },
      ];
      const echoSet1PermanentStats = [
        { stat: CharacterStat.DAMAGE_BONUS, value: 0.1, tags: [Tag.ELECTRO] },
      ];
      const echoSet2PermanentStats = [
        { stat: CharacterStat.CRITICAL_RATE, value: 0.05, tags: [Tag.ALL] },
      ];

      // Mock the getEntityById to return different stats for each entity
      mockgetEntityById.mockImplementation((data) => {
        if (data.entityType === 'character') {
          return Promise.resolve({
            capabilities: {
              attacks: mockAttackDetails,
              modifiers: mockModifierDetails,
              permanentStats: characterPermanentStats,
            },
          });
        }
        if (data.entityType === 'weapon') {
          return Promise.resolve({
            capabilities: {
              attacks: [],
              modifiers: [],
              permanentStats: weaponPermanentStats,
            },
          });
        }
        if (data.entityType === 'echo') {
          return Promise.resolve({
            capabilities: {
              attacks: [],
              modifiers: [],
              permanentStats: echoPermanentStats,
            },
          });
        }
        if (data.entityType === 'echo_set') {
          // Return different stats based on set ID
          if (data.id === 1) {
            return Promise.resolve({
              capabilities: {
                attacks: [],
                modifiers: [],
                permanentStats: echoSet1PermanentStats,
              },
            });
          }
          return Promise.resolve({
            capabilities: {
              attacks: [],
              modifiers: [],
              permanentStats: echoSet2PermanentStats,
            },
          });
        }
        return Promise.resolve({
          capabilities: {
            attacks: [],
            modifiers: [],
            permanentStats: [],
          },
        });
      });

      const enricher = await createGameDataEnricher(mockTeam);
      const stats = enricher.getPermanentStatsForCharacter(0);

      // Should combine permanent stats from character, weapon, echo, and echo set
      expect(stats).toEqual([
        ...characterPermanentStats,
        ...weaponPermanentStats,
        ...echoPermanentStats,
        ...echoSet1PermanentStats,
      ]);
    });

    it('should handle characters with multiple echo sets', async () => {
      // Create a team where one character has multiple echo sets
      const teamWithMultipleSets: ClientTeam = [
        {
          id: 1306,
          sequence: 6,
          weapon: { id: 21_040_016, refine: '5' as const },
          echoSets: [
            { id: 1, requirement: '5' as const },
            { id: 2, requirement: '2' as const },
          ],
          primarySlotEcho: { id: 6_000_038 },
          echoStats: [],
        },
        {
          id: 1405,
          sequence: 0,
          weapon: { id: 21_050_016, refine: '1' as const },
          echoSets: [{ id: 3, requirement: '5' as const }],
          primarySlotEcho: { id: 6_000_041 },
          echoStats: [],
        },
        {
          id: 1102,
          sequence: 6,
          weapon: { id: 21_010_026, refine: '1' as const },
          echoSets: [{ id: 4, requirement: '5' as const }],
          primarySlotEcho: { id: 6_000_037 },
          echoStats: [],
        },
      ];

      const characterStats = [
        { stat: CharacterStat.ATTACK_FLAT, value: 400, tags: [Tag.ALL] },
      ];
      const weaponStats = [
        { stat: CharacterStat.ATTACK_FLAT, value: 250, tags: [Tag.ALL] },
      ];
      const echoStats = [{ stat: CharacterStat.HP_FLAT, value: 5000, tags: [Tag.ALL] }];
      const echoSet1Stats = [
        { stat: CharacterStat.DAMAGE_BONUS, value: 0.1, tags: [Tag.ELECTRO] },
      ];
      const echoSet2Stats = [
        { stat: CharacterStat.CRITICAL_RATE, value: 0.05, tags: [Tag.ALL] },
      ];

      mockgetEntityById.mockImplementation((data) => {
        if (data.entityType === 'character') {
          return Promise.resolve({
            capabilities: {
              attacks: [],
              modifiers: [],
              permanentStats: characterStats,
            },
          });
        }
        if (data.entityType === 'weapon') {
          return Promise.resolve({
            capabilities: {
              attacks: [],
              modifiers: [],
              permanentStats: weaponStats,
            },
          });
        }
        if (data.entityType === 'echo') {
          return Promise.resolve({
            capabilities: {
              attacks: [],
              modifiers: [],
              permanentStats: echoStats,
            },
          });
        }
        if (data.entityType === 'echo_set') {
          if (data.id === 1) {
            return Promise.resolve({
              capabilities: {
                attacks: [],
                modifiers: [],
                permanentStats: echoSet1Stats,
              },
            });
          }
          if (data.id === 2) {
            return Promise.resolve({
              capabilities: {
                attacks: [],
                modifiers: [],
                permanentStats: echoSet2Stats,
              },
            });
          }
        }
        return Promise.resolve({
          capabilities: {
            attacks: [],
            modifiers: [],
            permanentStats: [],
          },
        });
      });

      const enricher = await createGameDataEnricher(teamWithMultipleSets);
      const stats = enricher.getPermanentStatsForCharacter(0);

      // Should include stats from both echo sets
      expect(stats).toEqual([
        ...characterStats,
        ...weaponStats,
        ...echoStats,
        ...echoSet1Stats,
        ...echoSet2Stats,
      ]);
    });

    it('should return different stats for different character indices', async () => {
      const char1Stats = [
        { stat: CharacterStat.ATTACK_FLAT, value: 500, tags: [Tag.ALL] },
      ];
      const char2Stats = [
        { stat: CharacterStat.ATTACK_FLAT, value: 600, tags: [Tag.ALL] },
      ];
      const char3Stats = [
        { stat: CharacterStat.ATTACK_FLAT, value: 700, tags: [Tag.ALL] },
      ];

      mockgetEntityById.mockImplementation((data) => {
        if (data.entityType === 'character') {
          // Return different stats based on character ID
          if (data.id === 1306) {
            return Promise.resolve({
              capabilities: {
                attacks: [],
                modifiers: [],
                permanentStats: char1Stats,
              },
            });
          }
          if (data.id === 1405) {
            return Promise.resolve({
              capabilities: {
                attacks: [],
                modifiers: [],
                permanentStats: char2Stats,
              },
            });
          }
          if (data.id === 1102) {
            return Promise.resolve({
              capabilities: {
                attacks: [],
                modifiers: [],
                permanentStats: char3Stats,
              },
            });
          }
        }
        return Promise.resolve({
          capabilities: {
            attacks: [],
            modifiers: [],
            permanentStats: [],
          },
        });
      });

      const enricher = await createGameDataEnricher(mockTeam);

      // Each character index should return different stats
      expect(enricher.getPermanentStatsForCharacter(0)).toContainEqual(char1Stats[0]);
      expect(enricher.getPermanentStatsForCharacter(1)).toContainEqual(char2Stats[0]);
      expect(enricher.getPermanentStatsForCharacter(2)).toContainEqual(char3Stats[0]);
    });
  });
});

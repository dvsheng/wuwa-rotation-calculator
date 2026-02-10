import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';
import type { Team as ClientTeam } from '@/schemas/team';
import { AbilityAttribute, Attribute, CharacterStat, Tag } from '@/types';

import { GameDataNotFoundError, createGameDataEnricher } from './enrich-rotation-data';

// Use vi.hoisted to define mocks used in vi.mock
const { mockGetEntityByHakushinId } = vi.hoisted(() => ({
  mockGetEntityByHakushinId: vi.fn(),
}));

vi.mock('@/services/game-data/get-entity-details.function', () => ({
  getEntityByHakushinId: mockGetEntityByHakushinId,
}));

describe('createGameDataEnricher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  const mockAttackDetails = [
    {
      id: 101,
      name: 'Basic Attack 1',
      description: 'A basic attack',
      originType: 'Normal Attack',
      scalingStat: AbilityAttribute.ATK,
      attribute: Attribute.PHYSICAL,
      motionValues: [1.5, 2],
      tags: [Tag.BASIC_ATTACK],
    },
    {
      id: 102,
      name: 'Skill Attack',
      description: 'A skill attack',
      originType: 'Resonance Skill',
      scalingStat: AbilityAttribute.ATK,
      attribute: Attribute.ELECTRO,
      motionValues: [3],
      tags: [Tag.RESONANCE_SKILL, Tag.ELECTRO],
    },
  ];

  const mockModifierDetails = [
    {
      id: 201,
      name: 'Damage Buff',
      description: 'Increases damage',
      originType: 'Resonance Skill',
      target: 'self' as const,
      modifiedStats: [
        {
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
      target: 'team' as const,
      modifiedStats: [
        {
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

  it('should return enricher with all methods', async () => {
    mockGetEntityByHakushinId.mockResolvedValue({
      capabilities: {
        attacks: mockAttackDetails,
        modifiers: mockModifierDetails,
        permanentStats: mockPermanentStats,
      },
    });

    const enricher = await createGameDataEnricher(mockTeam);

    expect(enricher).toHaveProperty('enrichAttack');
    expect(enricher).toHaveProperty('enrichModifier');
    expect(enricher).toHaveProperty('getPermanentStatsForCharacter');
    expect(typeof enricher.enrichAttack).toBe('function');
    expect(typeof enricher.enrichModifier).toBe('function');
    expect(typeof enricher.getPermanentStatsForCharacter).toBe('function');
  });

  it('should enrich attack instance with full details', async () => {
    mockGetEntityByHakushinId.mockResolvedValue({
      capabilities: {
        attacks: mockAttackDetails,
        modifiers: mockModifierDetails,
        permanentStats: mockPermanentStats,
      },
    });

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
      scalingStat: AbilityAttribute.ATK,
      attribute: Attribute.PHYSICAL,
      motionValues: [1.5, 2],
      tags: [Tag.BASIC_ATTACK],
    });
  });

  it('should enrich modifier instance with full details', async () => {
    mockGetEntityByHakushinId.mockResolvedValue({
      capabilities: {
        attacks: mockAttackDetails,
        modifiers: mockModifierDetails,
        permanentStats: mockPermanentStats,
      },
    });

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
      target: 'self',
      modifiedStats: [
        {
          stat: CharacterStat.DAMAGE_BONUS,
          value: 0.2,
          tags: [Tag.ALL],
        },
      ],
    });
  });

  it('should get permanent stats for character by index', async () => {
    mockGetEntityByHakushinId.mockResolvedValue({
      capabilities: {
        attacks: mockAttackDetails,
        modifiers: mockModifierDetails,
        permanentStats: mockPermanentStats,
      },
    });

    const enricher = await createGameDataEnricher(mockTeam);
    const stats = enricher.getPermanentStatsForCharacter(0);

    expect(stats).toEqual(mockPermanentStats);
  });

  it('should throw GameDataNotFoundError when enriching attack without matching details', async () => {
    mockGetEntityByHakushinId.mockResolvedValue({
      capabilities: {
        attacks: mockAttackDetails,
        modifiers: mockModifierDetails,
        permanentStats: mockPermanentStats,
      },
    });

    const enricher = await createGameDataEnricher(mockTeam);
    const attackInstance: AttackInstance = {
      id: 999,
      characterId: 1,
      instanceId: 'attack-999',
    };

    expect(() => enricher.enrichAttack(attackInstance)).toThrow(GameDataNotFoundError);
    expect(() => enricher.enrichAttack(attackInstance)).toThrow(
      'attack details not found for entity with ID 999',
    );
  });

  it('should throw GameDataNotFoundError when enriching modifier without matching details', async () => {
    mockGetEntityByHakushinId.mockResolvedValue({
      capabilities: {
        attacks: mockAttackDetails,
        modifiers: mockModifierDetails,
        permanentStats: mockPermanentStats,
      },
    });

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
    expect(() => enricher.enrichModifier(modifierInstance)).toThrow(
      'modifier details not found for entity with ID 999',
    );
  });

  it('should preserve parameter values when enriching attack', async () => {
    mockGetEntityByHakushinId.mockResolvedValue({
      capabilities: {
        attacks: mockAttackDetails,
        modifiers: mockModifierDetails,
        permanentStats: mockPermanentStats,
      },
    });

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

  it('should preserve position and size when enriching modifier', async () => {
    mockGetEntityByHakushinId.mockResolvedValue({
      capabilities: {
        attacks: mockAttackDetails,
        modifiers: mockModifierDetails,
        permanentStats: mockPermanentStats,
      },
    });

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

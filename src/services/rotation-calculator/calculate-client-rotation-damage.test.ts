import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Character } from '@/schemas/character';
import { EchoMainStatOption, EchoSubstatOption } from '@/schemas/echo';
import type { Enemy } from '@/schemas/enemy';
import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';
import type { Team } from '@/schemas/team';
import { Attribute, CharacterStat, Tag } from '@/types';

import { calculateRotation } from './calculate-client-rotation-damage';

// Use vi.hoisted to define mocks used in vi.mock
const {
  mockGetCharacterDetails,
  mockGetEchoDetails,
  mockGetWeaponDetails,
  mockGetEchoSetDetails,
} = vi.hoisted(() => ({
  mockGetCharacterDetails: vi.fn(),
  mockGetEchoDetails: vi.fn(),
  mockGetWeaponDetails: vi.fn(),
  mockGetEchoSetDetails: vi.fn(),
}));

vi.mock('@/services/game-data/character/get-character-details', () => ({
  getCharacterDetails: mockGetCharacterDetails,
}));

vi.mock('@/services/game-data/echo/get-echo-details', () => ({
  getEchoDetails: mockGetEchoDetails,
}));

vi.mock('@/services/game-data/weapon/get-weapon-details', () => ({
  getWeaponDetails: mockGetWeaponDetails,
}));

vi.mock('@/services/game-data/echo-set/get-echo-set-details', () => ({
  getEchoSetDetails: mockGetEchoSetDetails,
}));

/**
 * Creates a minimal character configuration for testing.
 */
const createTestCharacter = (
  id: string,
  overrides: Partial<Character> = {},
): Character => ({
  id,
  sequence: 0,
  weapon: { id: '21020016', refine: '1' }, // Commando of Conviction (3★ sword)
  echoSets: [{ id: '1', requirement: '5' }], // Lingering Tunes
  primarySlotEcho: { id: '6000038' }, // Crownless
  echoStats: [
    {
      cost: 4,
      mainStatType: EchoMainStatOption.CRIT_DMG,
      substats: [
        { stat: EchoSubstatOption.HP_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.ATK_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.DEF_PERCENT, value: 8.1 },
        { stat: EchoSubstatOption.CRIT_RATE, value: 6.3 },
        { stat: EchoSubstatOption.CRIT_DMG, value: 12.6 },
      ],
    },
    {
      cost: 3,
      mainStatType: EchoMainStatOption.ATK_PERCENT,
      substats: [
        { stat: EchoSubstatOption.HP_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.ATK_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.DEF_PERCENT, value: 8.1 },
        { stat: EchoSubstatOption.CRIT_RATE, value: 6.3 },
        { stat: EchoSubstatOption.CRIT_DMG, value: 12.6 },
      ],
    },
    {
      cost: 3,
      mainStatType: EchoMainStatOption.ATK_PERCENT,
      substats: [
        { stat: EchoSubstatOption.HP_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.ATK_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.DEF_PERCENT, value: 8.1 },
        { stat: EchoSubstatOption.CRIT_RATE, value: 6.3 },
        { stat: EchoSubstatOption.CRIT_DMG, value: 12.6 },
      ],
    },
    {
      cost: 1,
      mainStatType: EchoMainStatOption.ATK_PERCENT,
      substats: [
        { stat: EchoSubstatOption.HP_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.ATK_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.DEF_PERCENT, value: 8.1 },
        { stat: EchoSubstatOption.CRIT_RATE, value: 6.3 },
        { stat: EchoSubstatOption.CRIT_DMG, value: 12.6 },
      ],
    },
    {
      cost: 1,
      mainStatType: EchoMainStatOption.ATK_PERCENT,
      substats: [
        { stat: EchoSubstatOption.HP_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.ATK_PERCENT, value: 6.4 },
        { stat: EchoSubstatOption.DEF_PERCENT, value: 8.1 },
        { stat: EchoSubstatOption.CRIT_RATE, value: 6.3 },
        { stat: EchoSubstatOption.CRIT_DMG, value: 12.6 },
      ],
    },
  ],
  ...overrides,
});

const createTestEnemy = (): Enemy => ({
  level: 90,
  resistances: {
    [Attribute.GLACIO]: 10,
    [Attribute.FUSION]: 10,
    [Attribute.AERO]: 10,
    [Attribute.ELECTRO]: 10,
    [Attribute.HAVOC]: 10,
    [Attribute.SPECTRO]: 10,
    [Attribute.PHYSICAL]: 10,
  },
});

/**
 * Creates mock character data returned by getCharacterDetails
 */
const createMockCharacterData = (
  id: string,
  name: string,
  attribute: string,
  attacks: Array<{
    id: string;
    name: string;
    tags: Array<string>;
    motionValues: Array<number>;
    scalingStat?: string;
  }> = [],
  modifiers: Array<{
    id: string;
    name: string;
    target: string;
    modifiedStats: Array<{ stat: string; value: number; tags: Array<string> }>;
  }> = [],
) => ({
  id,
  name,
  attribute,
  capabilities: {
    attacks: attacks.map((a) => ({
      ...a,
      parentName: name,
      scalingStat: a.scalingStat ?? CharacterStat.ATTACK_FLAT,
    })),
    modifiers,
    permanentStats: [
      // Base ATK for damage calculation
      { stat: CharacterStat.ATTACK_FLAT, value: 400, tags: [Tag.ALL] },
    ],
  },
});

/**
 * Creates mock weapon data
 */
const createMockWeaponData = () => ({
  capabilities: {
    attacks: [],
    modifiers: [],
    permanentStats: [{ stat: CharacterStat.ATTACK_FLAT, value: 337, tags: [Tag.ALL] }],
  },
});

/**
 * Creates mock echo data
 */
const createMockEchoData = () => ({
  capabilities: {
    attacks: [],
    modifiers: [],
    permanentStats: [],
  },
});

/**
 * Creates mock echo set data
 */
const createMockEchoSetData = () => ({
  capabilities: {
    attacks: [],
    modifiers: [],
    permanentStats: [],
  },
});

describe('calculateRotation', () => {
  beforeEach(() => {
    mockGetCharacterDetails.mockReset();
    mockGetEchoDetails.mockReset();
    mockGetWeaponDetails.mockReset();
    mockGetEchoSetDetails.mockReset();

    // Default mock implementations
    mockGetEchoDetails.mockResolvedValue(createMockEchoData());
    mockGetWeaponDetails.mockResolvedValue(createMockWeaponData());
    mockGetEchoSetDetails.mockResolvedValue(createMockEchoSetData());
  });

  describe('Augusta (1306) with Crown of Wills modifier', () => {
    const AUGUSTA_ID = '1306';
    const AUGUSTA_BASIC_ATTACK_1_ID = '1306-atk-1'; // Basic Attack Stage 1
    const AUGUSTA_CROWN_OF_WILLS_ID = '1306-mod-crown'; // Crown of Wills (Electro DMG Bonus)

    // Mock Augusta with her Basic Attack and Crown of Wills modifier
    const mockAugusta = createMockCharacterData(
      AUGUSTA_ID,
      'Augusta',
      Tag.ELECTRO,
      [
        {
          id: AUGUSTA_BASIC_ATTACK_1_ID,
          name: 'Basic Attack Stage 1',
          tags: [Tag.BASIC_ATTACK],
          motionValues: [0.5, 0.5], // Example motion values
        },
      ],
      [
        {
          id: AUGUSTA_CROWN_OF_WILLS_ID,
          name: 'Crown of Wills',
          target: 'self',
          modifiedStats: [
            {
              stat: CharacterStat.DAMAGE_BONUS,
              value: 0.15, // 15% Electro DMG Bonus at S0
              tags: [Tag.ELECTRO],
            },
          ],
        },
      ],
    );

    // Mock filler characters (minimal data)
    const mockJinhsi = createMockCharacterData('1304', 'Jinhsi', Tag.SPECTRO);
    const mockShorekeeper = createMockCharacterData('1505', 'Shorekeeper', Tag.SPECTRO);

    beforeEach(() => {
      mockGetCharacterDetails.mockImplementation(({ data }) => {
        switch (data.id) {
          case AUGUSTA_ID: {
            return Promise.resolve(mockAugusta);
          }
          case '1304': {
            return Promise.resolve(mockJinhsi);
          }
          case '1505': {
            return Promise.resolve(mockShorekeeper);
          }
          default: {
            return Promise.reject(new Error(`Unknown character ID: ${data.id}`));
          }
        }
      });
    });

    it('modifier does not apply when attack is outside modifier range', async () => {
      const team: Team = [
        createTestCharacter(AUGUSTA_ID),
        createTestCharacter('1304'),
        createTestCharacter('1505'),
      ];

      const enemy = createTestEnemy();

      const attack: AttackInstance = {
        instanceId: 'attack-instance-1',
        id: AUGUSTA_BASIC_ATTACK_1_ID,
        characterId: AUGUSTA_ID,
      };

      // Modifier is positioned AFTER the attack (x=1, but attack is at index 0)
      const crownOfWillsModifier: ModifierInstance = {
        instanceId: 'modifier-instance-1',
        id: AUGUSTA_CROWN_OF_WILLS_ID,
        characterId: AUGUSTA_ID,
        x: 1, // Start position (does NOT cover attack at index 0)
        y: 0,
        w: 1,
        h: 1,
      };

      const resultWithoutModifier = await calculateRotation(team, enemy, [attack], []);
      const resultWithMispositionedModifier = await calculateRotation(
        team,
        enemy,
        [attack],
        [crownOfWillsModifier],
      );

      // Damage should be the same since modifier doesn't cover the attack
      expect(resultWithMispositionedModifier.totalDamage).toBe(
        resultWithoutModifier.totalDamage,
      );
    });
  });
});

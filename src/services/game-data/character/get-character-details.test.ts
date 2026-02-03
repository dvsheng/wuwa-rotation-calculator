import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCharacterDetailsHandler } from './get-character-details';

// Use vi.hoisted to define variables used in vi.mock
const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock('../hakushin-api/fs-store', () => ({
  createFsStore: () => ({
    get: mockGet,
  }),
}));

describe('getCharacterDetailsHandler', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('adds attribute to attack tags', async () => {
    const mockCharacter = {
      id: '1204',
      name: 'Mortefi',
      attribute: 'fusion',
      capabilities: {
        attacks: [
          {
            id: 'attack-1',
            name: 'Basic Attack 1',
            tags: ['basicAttack'],
          },
        ],
        modifiers: [],
        permanentStats: [],
      },
    };

    mockGet.mockResolvedValue(mockCharacter);

    const result = await getCharacterDetailsHandler('1204');

    expect(result.capabilities.attacks[0].attribute).toBe('fusion');
    expect(result.capabilities.attacks[0].tags).toEqual([
      'Basic Attack 1',
      'fusion',
      'basicAttack',
    ]);
  });

  it('filters capabilities based on unlockedAt sequence', async () => {
    const mockCharacter = {
      id: '1204',
      name: 'Mortefi',
      attribute: 'fusion',
      capabilities: {
        attacks: [
          {
            id: 'attack-base',
            name: 'Base Attack',
            tags: [],
          },
          {
            id: 'attack-s1',
            name: 'S1 Attack',
            unlockedAt: 's1',
            tags: [],
          },
        ],
        modifiers: [
          {
            id: 'mod-s2',
            name: 'S2 Modifier',
            unlockedAt: 's2',
          },
        ],
        permanentStats: [
          {
            id: 'stat-s3',
            name: 'S3 Stat',
            unlockedAt: 's3',
          },
        ],
      },
    };

    mockGet.mockImplementation(() =>
      Promise.resolve(JSON.parse(JSON.stringify(mockCharacter))),
    );

    // Sequence 0 (Base)
    const res0 = await getCharacterDetailsHandler('1204', 0);
    expect(res0.capabilities.attacks).toHaveLength(1);
    expect(res0.capabilities.attacks[0].id).toBe('attack-base');
    expect(res0.capabilities.modifiers).toHaveLength(0);
    expect(res0.capabilities.permanentStats).toHaveLength(0);

    // Sequence 1
    const res1 = await getCharacterDetailsHandler('1204', 1);
    expect(res1.capabilities.attacks).toHaveLength(2);
    expect(res1.capabilities.modifiers).toHaveLength(0);

    // Sequence 2
    const res2 = await getCharacterDetailsHandler('1204', 2);
    expect(res2.capabilities.modifiers).toHaveLength(1);
    expect(res2.capabilities.modifiers[0].id).toBe('mod-s2');

    // Sequence 3
    const res3 = await getCharacterDetailsHandler('1204', 3);
    expect(res3.capabilities.permanentStats).toHaveLength(1);
    expect(res3.capabilities.permanentStats[0].id).toBe('stat-s3');
  });

  it('throws error if character not found', async () => {
    mockGet.mockResolvedValue(null);

    await expect(getCharacterDetailsHandler('9999')).rejects.toThrow(
      'Failed to fetch character details for ID 9999',
    );
  });

  describe('alternativeDefinitions resolution', () => {
    // Mock Augusta-style data with Crown of Wills modifier
    const mockAugusta = {
      id: '1306',
      name: 'Augusta',
      attribute: 'electro',
      capabilities: {
        attacks: [
          {
            id: '1306-atk-10',
            name: 'Heavy Attack - Thunderoar: Spinslash',
            description: 'Base description',
            tags: ['heavyAttack'],
            motionValues: [1.4172, 1.4172, 1.4172],
            alternativeDefinitions: {
              s6: {
                description: 'S6 description with Thunder Rage',
                motionValues: [1.4172, 1.4172, 1.4172, 1, 1],
              },
            },
          },
        ],
        modifiers: [
          {
            id: '1306-mod-crown',
            name: 'Crown of Wills',
            description: 'Each stack grants 15% Electro DMG Bonus.',
            modifiedStats: [
              {
                stat: 'damageBonus',
                value: 0.15,
                tags: ['electro'],
              },
            ],
            target: 'self',
            alternativeDefinitions: {
              s1: {
                description: 'S1: Each stack additionally increases Crit. DMG by 15%.',
                modifiedStats: [
                  { stat: 'damageBonus', value: 0.15, tags: ['electro'] },
                  { stat: 'criticalDamage', value: 0.15, tags: ['all'] },
                ],
              },
              s2: {
                description: 'S2: Each stack increases Crit. Rate by 20%.',
                modifiedStats: [
                  { stat: 'damageBonus', value: 0.15, tags: ['electro'] },
                  { stat: 'criticalDamage', value: 0.15, tags: ['all'] },
                  { stat: 'criticalRate', value: 0.2, tags: ['all'] },
                ],
              },
              s6: {
                description: 'S6: Can hold up to 4 stacks.',
                modifiedStats: [
                  { stat: 'damageBonus', value: 0.6, tags: ['electro'] },
                  { stat: 'criticalDamage', value: 0.6, tags: ['all'] },
                  { stat: 'criticalRate', value: 0.8, tags: ['all'] },
                ],
              },
            },
          },
        ],
        permanentStats: [],
      },
    };

    beforeEach(() => {
      mockGet.mockImplementation(() =>
        Promise.resolve(JSON.parse(JSON.stringify(mockAugusta))),
      );
    });

    it('returns base definition at sequence 0', async () => {
      const result = await getCharacterDetailsHandler('1306', 0);

      // Should use base modifier (no alternativeDefinitions applied)
      const crown = result.capabilities.modifiers[0];
      expect(crown.description).toBe('Each stack grants 15% Electro DMG Bonus.');
      expect(crown.modifiedStats).toHaveLength(1);
      expect(crown.modifiedStats[0].value).toBe(0.15);

      // Should use base attack
      const attack = result.capabilities.attacks[0];
      expect(attack.description).toBe('Base description');
      expect(attack.motionValues).toEqual([1.4172, 1.4172, 1.4172]);
    });

    it('applies s1 alternativeDefinition at sequence 1', async () => {
      const result = await getCharacterDetailsHandler('1306', 1);

      const crown = result.capabilities.modifiers[0];
      expect(crown.description).toBe(
        'S1: Each stack additionally increases Crit. DMG by 15%.',
      );
      expect(crown.modifiedStats).toHaveLength(2);
      expect(crown.modifiedStats[1].stat).toBe('criticalDamage');
    });

    it('applies highest applicable alternativeDefinition (s2 at sequence 3)', async () => {
      const result = await getCharacterDetailsHandler('1306', 3);

      // At sequence 3, s1 and s2 are available, should use s2 (highest)
      const crown = result.capabilities.modifiers[0];
      expect(crown.description).toBe('S2: Each stack increases Crit. Rate by 20%.');
      expect(crown.modifiedStats).toHaveLength(3);
      expect(crown.modifiedStats[2].stat).toBe('criticalRate');

      // Attack should still use base (s6 not yet reached)
      const attack = result.capabilities.attacks[0];
      expect(attack.description).toBe('Base description');
    });

    it('applies s6 alternativeDefinition at sequence 6', async () => {
      const result = await getCharacterDetailsHandler('1306', 6);

      // Should use s6 modifier
      const crown = result.capabilities.modifiers[0];
      expect(crown.description).toBe('S6: Can hold up to 4 stacks.');
      expect(crown.modifiedStats[0].value).toBe(0.6);

      // Should use s6 attack
      const attack = result.capabilities.attacks[0];
      expect(attack.description).toBe('S6 description with Thunder Rage');
      expect(attack.motionValues).toEqual([1.4172, 1.4172, 1.4172, 1, 1]);
    });

    it('removes alternativeDefinitions field from resolved capability', async () => {
      const result = await getCharacterDetailsHandler('1306', 1);

      const crown = result.capabilities.modifiers[0];
      expect(crown).not.toHaveProperty('alternativeDefinitions');

      const attack = result.capabilities.attacks[0];
      expect(attack).not.toHaveProperty('alternativeDefinitions');
    });

    it('preserves non-overridden fields when applying alternativeDefinition', async () => {
      const result = await getCharacterDetailsHandler('1306', 1);

      // id, name, target should be preserved from base
      const crown = result.capabilities.modifiers[0];
      expect(crown.id).toBe('1306-mod-crown');
      expect(crown.name).toBe('Crown of Wills');
      expect(crown.target).toBe('self');
    });
  });
});

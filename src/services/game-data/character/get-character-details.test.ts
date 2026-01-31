import { describe, expect, it, vi } from 'vitest';

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
  it('adds attribute to attack tags', async () => {
    const mockCharacter = {
      id: '1204',
      name: 'Mortefi',
      attribute: 'Fusion',
      capabilities: {
        attacks: [
          {
            id: 'attack-1',
            name: 'Basic Attack 1',
            tags: ['Basic Attack'],
          },
        ],
        modifiers: [],
        permanentStats: [],
      },
    };

    mockGet.mockResolvedValue(mockCharacter);

    const result = await getCharacterDetailsHandler('1204');

    expect(result.capabilities.attacks[0].attribute).toBe('Fusion');
    expect(result.capabilities.attacks[0].tags).toEqual([
      'Basic Attack 1',
      'Fusion',
      'Basic Attack',
    ]);
  });

  it('filters capabilities based on sequence', async () => {
    const mockCharacter = {
      id: '1204',
      name: 'Mortefi',
      attribute: 'Fusion',
      capabilities: {
        attacks: [
          {
            id: 'attack-base',
            name: 'Base Attack',
            unlockedAt: 'base',
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
          {
            id: 'mod-s1-s3',
            name: 'S1-S3 Modifier',
            unlockedAt: 's1',
            disabledAt: 's3',
          },
        ],
        permanentStats: [],
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

    // Sequence 1
    const res1 = await getCharacterDetailsHandler('1204', 1);
    expect(res1.capabilities.attacks).toHaveLength(2);
    expect(res1.capabilities.modifiers).toHaveLength(1);
    expect(res1.capabilities.modifiers[0].id).toBe('mod-s1-s3');

    // Sequence 3 (S1-S3 Modifier should be disabled, S2 Modifier should be active)
    const res3 = await getCharacterDetailsHandler('1204', 3);
    expect(res3.capabilities.modifiers).toHaveLength(1);
    expect(res3.capabilities.modifiers[0].id).toBe('mod-s2');
  });

  it('throws error if character not found', async () => {
    mockGet.mockResolvedValue(null);

    await expect(getCharacterDetailsHandler('9999')).rejects.toThrow(
      'Failed to fetch character details for ID 9999',
    );
  });
});

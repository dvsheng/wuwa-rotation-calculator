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
      },
    };

    mockGet.mockResolvedValue(mockCharacter);

    const result = await getCharacterDetailsHandler('1204');

    expect(result.capabilities.attacks[0].attribute).toBe('Fusion');
    expect(result.capabilities.attacks[0].tags).toEqual(['Fusion', 'Basic Attack']);
  });

  it('throws error if character not found', async () => {
    mockGet.mockResolvedValue(null);

    await expect(getCharacterDetailsHandler('9999')).rejects.toThrow(
      'Failed to fetch character details for ID 9999',
    );
  });
});

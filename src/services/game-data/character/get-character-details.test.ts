import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as characterDetails from './get-character-details';
import { Sequence } from './types';
import type { Character } from './types';

describe('getClientCharacterDetailsHandler', () => {
  const mockCharacter: Character = {
    id: '123',
    name: 'Test Character',
    attribute: 'Aero',
    attacks: [
      {
        name: 'Base Attack',
        parentName: 'Basic',
        originType: 'Normal Attack',
        description: 'Base attack',
        attacks: [
          { name: 'Hit 1', formula: { base: 1 } }
        ],
      },
      {
        name: 'S1 Attack',
        parentName: 'Sequence 1',
        originType: Sequence.S1,
        unlockedAt: Sequence.S1,
        description: 'Unlocked at S1',
        attacks: [
          { name: 'S1 Hit', formula: { base: 1 } }
        ],
      },
      {
        name: 'Legacy Attack',
        parentName: 'Legacy',
        originType: 'Normal Attack',
        disabledAt: Sequence.S2,
        description: 'Disabled at S2',
        attacks: [
          { name: 'Legacy Hit', formula: { base: 1 } }
        ],
      },
    ],
    modifiers: [
      {
        name: 'Base Buff',
        parentName: 'Basic',
        originType: 'Normal Attack',
        description: 'Base buff',
        modifiedStats: {},
      },
      {
        name: 'S3 Buff',
        parentName: 'Sequence 3',
        originType: Sequence.S3,
        unlockedAt: Sequence.S3,
        description: 'Unlocked at S3',
        modifiedStats: {},
      },
    ],
    stats: {
      base: { hp: 0, atk: 0, def: 0 },
      nodes: [],
    },
  };

  let getSpy: any;

  beforeEach(() => {
    getSpy = vi.spyOn(characterDetails.characterStore, 'get');
  });

  afterEach(() => {
    getSpy.mockRestore();
  });

  it('returns only base items when sequence is 0', async () => {
    getSpy.mockResolvedValue(mockCharacter);

    const result = await characterDetails.getClientCharacterDetailsHandler({ id: '123', sequence: 0 });

    const attackNames = result.attacks.map((a) => a.name);
    const modifierNames = result.modifiers.map((m) => m.name);

    expect(attackNames).toContain('Base Attack');
    expect(attackNames).toContain('Legacy Attack');
    expect(attackNames).not.toContain('S1 Attack');

    expect(modifierNames).toContain('Base Buff');
    expect(modifierNames).not.toContain('S3 Buff');
    expect(getSpy).toHaveBeenCalledWith('character/parsed/123.json');
  });

  it('includes S1 items when sequence is 1', async () => {
    getSpy.mockResolvedValue(mockCharacter);

    const result = await characterDetails.getClientCharacterDetailsHandler({ id: '123', sequence: 1 });

    const attackNames = result.attacks.map((a) => a.name);
    expect(attackNames).toContain('Base Attack');
    expect(attackNames).toContain('S1 Attack');
    expect(attackNames).toContain('Legacy Attack');
  });

  it('filters out disabled items', async () => {
    getSpy.mockResolvedValue(mockCharacter);

    const result = await characterDetails.getClientCharacterDetailsHandler({ id: '123', sequence: 2 });

    const attackNames = result.attacks.map((a) => a.name);
    expect(attackNames).toContain('Base Attack');
    expect(attackNames).toContain('S1 Attack');
    expect(attackNames).not.toContain('Legacy Attack');
  });

  it('includes S3 items when sequence is 3', async () => {
    getSpy.mockResolvedValue(mockCharacter);

    const result = await characterDetails.getClientCharacterDetailsHandler({ id: '123', sequence: 3 });

    const modifierNames = result.modifiers.map((m) => m.name);
    expect(modifierNames).toContain('Base Buff');
    expect(modifierNames).toContain('S3 Buff');
  });

  it('throws error if character is not found', async () => {
    getSpy.mockResolvedValue(null);

    await expect(
      characterDetails.getClientCharacterDetailsHandler({ id: 'non-existent', sequence: 0 }),
    ).rejects.toThrow('Failed to fetch character details for ID non-existent');
  });
});
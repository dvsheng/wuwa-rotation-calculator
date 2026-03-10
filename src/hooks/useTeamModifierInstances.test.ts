import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ModifierInstance } from '@/schemas/rotation';
import { CapabilityType, OriginType } from '@/services/game-data';
import { useStore } from '@/store';

import { useTeamModifierInstances } from './useTeamModifierInstances';

vi.mock('./useTeamDetails');

const { useTeamDetails } = await import('./useTeamDetails');
const mockUseTeamDetails = vi.mocked(useTeamDetails);

describe('useTeamModifierInstances', () => {
  it('resolves the correct character when two characters share the same capability id', () => {
    // Two different characters both have a buff with id=20 (e.g. a shared weapon passive)
    mockUseTeamDetails.mockReturnValue({
      attacks: [],
      buffs: [
        {
          id: 20,
          characterId: 1001,
          entityId: 601,
          characterName: 'Rover',
          name: 'Shared Passive',
          parentName: 'Weapon',
          description: '',
          originType: OriginType.WEAPON,
          capabilityType: CapabilityType.MODIFIER,
          modifiedStats: [],
          parameters: [],
          target: 'self',
          iconUrl: '',
          characterIconUrl: '',
        },
        {
          id: 20,
          characterId: 1002,
          entityId: 601,
          characterName: 'Calcharo',
          name: 'Shared Passive',
          parentName: 'Weapon',
          description: '',
          originType: OriginType.WEAPON,
          capabilityType: CapabilityType.MODIFIER,
          modifiedStats: [],
          parameters: [],
          target: 'self',
          iconUrl: '',
          characterIconUrl: '',
        },
      ],
      isLoading: false,
      isError: false,
    });

    const stored: Array<ModifierInstance> = [
      {
        instanceId: 'buff-a',
        id: 20,
        characterId: 1001,
        parameterValues: [],
        x: 0,
        y: 0,
        w: 2,
        h: 1,
      },
      {
        instanceId: 'buff-b',
        id: 20,
        characterId: 1002,
        parameterValues: [],
        x: 2,
        y: 0,
        w: 2,
        h: 1,
      },
    ];
    useStore.setState({ buffs: stored });

    const { result } = renderHook(() => useTeamModifierInstances());

    const [first, second] = result.current.buffs;

    expect(first.instanceId).toBe('buff-a');
    expect(first.characterId).toBe(1001);
    expect(first.characterName).toBe('Rover');

    expect(second.instanceId).toBe('buff-b');
    expect(second.characterId).toBe(1002);
    expect(second.characterName).toBe('Calcharo');
  });
});

import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AttackInstance } from '@/schemas/rotation';
import { CapabilityType, OriginType } from '@/services/game-data';
import { useStore } from '@/store';
import { Attribute } from '@/types';

import { useTeamAttackInstances } from './useTeamAttackInstances';

vi.mock('./useTeamDetails');

const { useTeamDetails } = await import('./useTeamDetails');
const mockUseTeamDetails = vi.mocked(useTeamDetails);

describe('useTeamAttackInstances', () => {
  it('resolves the correct character when two characters share the same capability id', () => {
    // Two different characters both have a capability with id=10 (e.g. a shared echo skill)
    mockUseTeamDetails.mockReturnValue({
      attacks: [
        {
          id: 10,
          characterId: 1001,
          entityId: 501,
          characterName: 'Rover',
          name: 'Echo Skill',
          parentName: 'Echo',
          description: '',
          originType: OriginType.ECHO,
          capabilityType: CapabilityType.ATTACK,
          attribute: Attribute.SPECTRO,
          damageInstances: [],
          parameters: [],
        },
        {
          id: 10,
          characterId: 1002,
          entityId: 501,
          characterName: 'Calcharo',
          name: 'Echo Skill',
          parentName: 'Echo',
          description: '',
          originType: OriginType.ECHO,
          capabilityType: CapabilityType.ATTACK,
          attribute: Attribute.SPECTRO,
          damageInstances: [],
          parameters: [],
        },
      ],
      buffs: [],
      isLoading: false,
      isError: false,
    });

    // Both characters have placed the shared capability on the canvas
    const stored: Array<AttackInstance> = [
      { instanceId: 'inst-a', id: 10, characterId: 1001, parameterValues: [] },
      { instanceId: 'inst-b', id: 10, characterId: 1002, parameterValues: [] },
    ];
    useStore.setState({ attacks: stored });

    const { result } = renderHook(() => useTeamAttackInstances());

    const [first, second] = result.current.attacks;

    expect(first.instanceId).toBe('inst-a');
    expect(first.characterId).toBe(1001);
    expect(first.characterName).toBe('Rover');

    expect(second.instanceId).toBe('inst-b');
    expect(second.characterId).toBe(1002);
    expect(second.characterName).toBe('Calcharo');
  });
});

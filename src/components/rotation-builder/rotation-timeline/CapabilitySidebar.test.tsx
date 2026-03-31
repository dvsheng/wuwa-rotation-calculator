import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { CapabilityType, OriginType, Target } from '@/services/game-data';

import { CapabilitySidebar } from './CapabilitySidebar';

const { mockUseDragOperation } = vi.hoisted(() => ({
  mockUseDragOperation: vi.fn(() => ({
    source: undefined as
      | {
          data: {
            capability: any;
            kind: string;
          };
        }
      | undefined,
    target: undefined as unknown,
  })),
}));

vi.mock('@dnd-kit/react', () => ({
  useDraggable: vi.fn(() => ({
    ref: vi.fn(),
  })),
  useDragOperation: mockUseDragOperation,
}));

vi.mock('@/components/common/CapabilityHoverCard', () => ({
  CapabilityHoverCard: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('@/hooks/useCharacter', async () => {
  const actual = await vi.importActual('@/hooks/useCharacter');
  return {
    ...actual,
    useTeamCharacters: vi.fn(),
  };
});

vi.mock('@/hooks/useTeamDetails', async () => {
  const actual = await vi.importActual('@/hooks/useTeamDetails');
  return {
    ...actual,
    useTeamDetails: vi.fn(),
  };
});

const { useDraggable } = await import('@dnd-kit/react');
const { useTeamCharacters } = await import('@/hooks/useCharacter');
const { useTeamDetails } = await import('@/hooks/useTeamDetails');
const mockUseDraggable = vi.mocked(useDraggable);
const mockUseTeamCharacters = vi.mocked(useTeamCharacters);
const mockUseTeamDetails = vi.mocked(useTeamDetails);

const createTeamDetails = ({
  attacks = [],
  modifiers = [],
}: {
  attacks?: Array<any>;
  modifiers?: Array<any>;
} = {}) => ({
  data: {
    attacks,
    modifiers,
    permanentStats: [],
  },
  isLoading: false,
  isError: false,
});

const makeAttack = (
  id: number,
  name: string,
  originType: string,
  characterName = 'Rover',
) =>
  ({
    id,
    name,
    originType,
    characterId: 1,
    characterName,
    entityId: 1,
    skillId: 1,
    parentName: 'Skill',
    description: '',
    parameters: [],
    capabilityJson: {
      type: CapabilityType.ATTACK,
      damageInstances: [],
    },
  }) as any;

const makeBuff = (
  id: number,
  name: string,
  target: string,
  originType = OriginType.WEAPON,
  characterName = 'Rover',
) =>
  ({
    id,
    name,
    originType,
    characterId: 1,
    characterName,
    entityId: 1,
    skillId: 1,
    parentName: 'Passive',
    description: '',
    parameters: [],
    capabilityJson: {
      type: CapabilityType.MODIFIER,
      modifiedStats: [
        {
          target,
          stat: 'damageBonus',
          value: 0.1,
          tags: ['all'],
        },
      ],
    },
  }) as any;

const getSectionCapabilityNames = (sectionName: 'Attacks' | 'Buffs') => {
  const heading = screen.getByRole('heading', { name: sectionName });
  const section = heading.parentElement?.parentElement;
  if (!section) {
    throw new Error(`Expected "${sectionName}" section to exist`);
  }

  return [...section.querySelectorAll('.line-clamp-3')]
    .map((element) => element.textContent.trim())
    .filter(Boolean);
};

const renderCapabilitySidebar = () => {
  return render(<CapabilitySidebar />);
};

describe('CapabilitySidebar', () => {
  beforeAll(() => {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  beforeEach(() => {
    mockUseDragOperation.mockReturnValue({
      source: undefined,
      target: undefined,
    });
    mockUseTeamCharacters.mockReturnValue([{ id: 1, index: 0, name: 'Rover' }] as any);
    mockUseTeamDetails.mockReturnValue(createTeamDetails());
  });

  it('sorts attacks by origin and then by name', () => {
    mockUseTeamDetails.mockReturnValue(
      createTeamDetails({
        attacks: [
          makeAttack(1, 'Zeta Skill', OriginType.RESONANCE_SKILL),
          makeAttack(2, 'Beta Slash', OriginType.NORMAL_ATTACK),
          makeAttack(3, 'Echo Burst', OriginType.ECHO),
          makeAttack(4, 'Alpha Slash', OriginType.NORMAL_ATTACK),
        ],
      }),
    );

    renderCapabilitySidebar();

    expect(getSectionCapabilityNames('Attacks')).toEqual([
      'Alpha Slash',
      'Beta Slash',
      'Zeta Skill',
      'Echo Burst',
    ]);
  });

  it('sorts buffs by target order', () => {
    mockUseTeamDetails.mockReturnValue(
      createTeamDetails({
        modifiers: [
          makeBuff(1, 'Enemy Debuff', Target.ENEMY),
          makeBuff(2, 'Team Buff', Target.TEAM),
          makeBuff(3, 'Self Buff', Target.SELF),
          makeBuff(4, 'Active Buff', Target.ACTIVE_CHARACTER),
        ],
      }),
    );

    renderCapabilitySidebar();

    expect(getSectionCapabilityNames('Buffs')).toEqual([
      'Self Buff',
      'Team Buff',
      'Active Buff',
      'Enemy Debuff',
    ]);
  });

  it('configures palette drags to use clone feedback', () => {
    mockUseTeamDetails.mockReturnValue(
      createTeamDetails({
        attacks: [makeAttack(1, 'Basic Attack', OriginType.NORMAL_ATTACK)],
        modifiers: [makeBuff(2, 'Team Buff', Target.TEAM)],
      }),
    );

    renderCapabilitySidebar();

    expect(mockUseDraggable).toHaveBeenCalledWith(
      expect.objectContaining({
        feedback: 'clone',
      }),
    );
  });

  it('resets palette horizontal scroll while dragging a capability from the sidebar', () => {
    mockUseTeamDetails.mockReturnValue(
      createTeamDetails({
        attacks: [makeAttack(1, 'Basic Attack', OriginType.NORMAL_ATTACK)],
      }),
    );
    const rendered = renderCapabilitySidebar();
    const { container, rerender } = rendered;
    const viewport = container.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );

    if (!viewport) {
      throw new Error('Expected palette scroll viewport to exist');
    }

    viewport.scrollLeft = 96;

    mockUseDragOperation.mockReturnValue({
      source: {
        data: {
          kind: 'sidebar-capability',
          capability: makeAttack(1, 'Basic Attack', OriginType.NORMAL_ATTACK),
        },
      },
      target: undefined,
    });

    rerender(<CapabilitySidebar />);

    expect(viewport.scrollLeft).toBe(0);
  });
});

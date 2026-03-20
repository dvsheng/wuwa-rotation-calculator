import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { CapabilityType, OriginType, Target } from '@/services/game-data';
import { Attribute } from '@/types';

import { BaseBuffCanvasItem, BuffCanvasItem } from './BuffCanvasItem';

vi.mock('@/hooks/useTeamAttackInstances');

const { useTeamAttackInstances } = await import('@/hooks/useTeamAttackInstances');

const mockUseTeamAttackInstances = vi.mocked(useTeamAttackInstances);

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const commonAttackProperties = {
  characterId: 1001,
  entityId: 1001,
  iconUrl: '',
  characterIconUrl: '',
  description: '',
  characterName: 'Rover',
  capabilityType: CapabilityType.ATTACK,
  attribute: Attribute.SPECTRO,
  damageInstances: [],
  parameters: [] as [],
};

const MOCK_ATTACKS = [
  {
    instanceId: 'a0',
    id: 1,
    name: 'Resonance Liberation',
    parentName: 'Skill',
    originType: OriginType.RESONANCE_LIBERATION,
    ...commonAttackProperties,
  },
  {
    instanceId: 'a1',
    id: 2,
    name: 'Heavy Attack',
    parentName: 'Basic',
    originType: OriginType.NORMAL_ATTACK,
    ...commonAttackProperties,
  },
  {
    instanceId: 'a2',
    id: 3,
    name: 'Basic Attack',
    parentName: 'Basic',
    originType: OriginType.NORMAL_ATTACK,
    ...commonAttackProperties,
  },
];

const makeBuff = (x: number, w: number, withStackConfig = false) => ({
  instanceId: 'buff-1',
  id: 10,
  characterId: 1001,
  entityId: 701,
  name: 'ATK Buff',
  parentName: 'Weapon',
  description: 'Increases ATK',
  characterName: 'Rover',
  originType: OriginType.WEAPON,
  capabilityType: CapabilityType.MODIFIER,
  target: Target.TEAM,
  modifiedStats: [],
  parameters: [
    {
      id: '0',
      minimum: 0,
      maximum: 100,
      value: withStackConfig ? undefined : 50,
      valueConfiguration: withStackConfig
        ? Array.from({ length: w }, (_, index) => (index + 1) * 10)
        : undefined,
    },
  ],
  x,
  y: 0,
  w,
  h: 1,
  iconUrl: '',
  characterIconUrl: '',
});

beforeEach(() => {
  mockUseTeamAttackInstances.mockReturnValue({
    attacks: [...MOCK_ATTACKS],
    isLoading: false,
    isError: false,
  });
});

describe('BuffCanvasItem', () => {
  describe('base item', () => {
    it('renders the shared buff canvas item chrome', () => {
      render(
        <BaseBuffCanvasItem
          name="Moonlit Buff"
          iconUrl="/buff.png"
          characterIconUrl="/char.png"
        />,
      );

      expect(screen.getByText('Moonlit Buff')).toBeInTheDocument();
    });
  });

  describe('warning state', () => {
    it('adds a warning border when a configurable buff is not configured', () => {
      const buff = makeBuff(1, 2);
      buff.parameters[0] = {
        ...buff.parameters[0],
        value: undefined,
        valueConfiguration: undefined,
      };

      render(<BuffCanvasItem buff={buff} onRemove={() => {}} />);

      expect(screen.getByTestId('buff-canvas-item')).toHaveClass('border-warning');
    });

    it('does not add a warning border when a configurable buff is configured', () => {
      const buff = makeBuff(1, 2, true);

      render(<BuffCanvasItem buff={buff} onRemove={() => {}} />);

      expect(screen.getByTestId('buff-canvas-item')).not.toHaveClass(
        'border-warning',
      );
    });
  });

  describe('parameter dialog', () => {
    it('opens the parameter dialog on the first click after hover activates', async () => {
      const buff = makeBuff(1, 2, true);
      const { container } = render(<BuffCanvasItem buff={buff} onRemove={() => {}} />);

      const hoverWrapper = container.firstElementChild as HTMLElement | null;
      expect(hoverWrapper).not.toBeNull();

      fireEvent.mouseEnter(hoverWrapper!);
      await act(async () => {});

      const trigger = container.querySelector('[data-slot="sheet-trigger"]');
      expect(trigger).not.toBeNull();

      await userEvent.click(trigger as HTMLElement);

      expect(
        await screen.findByRole('button', { name: 'Save changes' }),
      ).toBeInTheDocument();
    });

    it('uses the names of attacks at buff positions as dialog labels when stack config is enabled', async () => {
      const buff = makeBuff(1, 2, true);
      const { container } = render(<BuffCanvasItem buff={buff} onRemove={() => {}} />);

      const trigger = container.querySelector('[data-slot="sheet-trigger"]');
      expect(trigger).not.toBeNull();

      await userEvent.click(trigger as HTMLElement);

      expect(screen.getByText('Heavy Attack')).toBeInTheDocument();
      expect(screen.getByText('Basic Attack')).toBeInTheDocument();
    });

    it('uses names of attacks starting from x=0 when buff begins at the first attack', async () => {
      const buff = makeBuff(0, 2, true);
      const { container } = render(<BuffCanvasItem buff={buff} onRemove={() => {}} />);

      const trigger = container.querySelector('[data-slot="sheet-trigger"]');
      expect(trigger).not.toBeNull();

      await userEvent.click(trigger as HTMLElement);

      expect(screen.getByText('Resonance Liberation')).toBeInTheDocument();
      expect(screen.getByText('Heavy Attack')).toBeInTheDocument();
      expect(screen.queryByText('Basic Attack')).not.toBeInTheDocument();
    });

    it('does not show the per-attack toggle for a buff with w=1', async () => {
      const buff = makeBuff(0, 1);
      const { container } = render(<BuffCanvasItem buff={buff} onRemove={() => {}} />);

      const trigger = container.querySelector('[data-slot="sheet-trigger"]');
      expect(trigger).not.toBeNull();

      await userEvent.click(trigger as HTMLElement);

      expect(screen.queryByText('Per-attack stacks')).not.toBeInTheDocument();
    });
  });
});

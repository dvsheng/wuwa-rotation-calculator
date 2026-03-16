import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { CapabilityType, OriginType, Target } from '@/services/game-data';
import { useStore } from '@/store';
import { Attribute } from '@/types';

import { BaseBuffCanvasItem, BuffCanvasItem } from './BuffCanvasItem';

vi.mock('@/hooks/useSelfBuffAlignment');
vi.mock('@/hooks/useTeamAttackInstances');

const { useSelfBuffAlignment } = await import('@/hooks/useSelfBuffAlignment');
const { useTeamAttackInstances } = await import('@/hooks/useTeamAttackInstances');

const mockUseSelfBuffAlignment = vi.mocked(useSelfBuffAlignment);
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
  mockUseSelfBuffAlignment.mockReturnValue({
    isSelf: false,
    status: 'not-self',
    columnAlignments: [],
  });
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

  describe('buffedAttacks passed to CanvasItem', () => {
    it('opens the parameter dialog on the first click after hover activates', async () => {
      const buff = makeBuff(1, 2, true);
      useStore.setState({ buffs: [{ ...buff, parameterValues: buff.parameters }] });

      const { container } = render(
        <BuffCanvasItem buff={buff} onRemove={() => {}} isDialogClickable={true} />,
      );

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
      // buff at x=1, w=2 → covers MOCK_ATTACKS[1] ("Heavy Attack") and MOCK_ATTACKS[2] ("Basic Attack")
      const buff = makeBuff(1, 2, true);
      useStore.setState({ buffs: [{ ...buff, parameterValues: buff.parameters }] });

      render(
        <BuffCanvasItem buff={buff} onRemove={() => {}} isDialogClickable={true} />,
      );

      // Click the item to open the configuration dialog
      await userEvent.click(screen.getByText('ATK Buff'));

      expect(screen.getByText('Heavy Attack')).toBeInTheDocument();
      expect(screen.getByText('Basic Attack')).toBeInTheDocument();
    });

    it('uses names of attacks starting from x=0 when buff begins at the first attack', async () => {
      // buff at x=0, w=2 → covers MOCK_ATTACKS[0] ("Resonance Liberation") and MOCK_ATTACKS[1] ("Heavy Attack")
      const buff = makeBuff(0, 2, true);
      useStore.setState({ buffs: [{ ...buff, parameterValues: buff.parameters }] });

      render(
        <BuffCanvasItem buff={buff} onRemove={() => {}} isDialogClickable={true} />,
      );

      await userEvent.click(screen.getByText('ATK Buff'));

      expect(screen.getByText('Resonance Liberation')).toBeInTheDocument();
      expect(screen.getByText('Heavy Attack')).toBeInTheDocument();
      expect(screen.queryByText('Basic Attack')).not.toBeInTheDocument();
    });

    it('does not show the Stack Configuration toggle for a buff with w=1', () => {
      const buff = makeBuff(0, 1);
      useStore.setState({ buffs: [{ ...buff, parameterValues: buff.parameters }] });

      render(
        <BuffCanvasItem buff={buff} onRemove={() => {}} isDialogClickable={true} />,
      );

      // The toggle is only shown when buffedAttacks.length > 1
      expect(screen.queryByText('Stack Configuration')).not.toBeInTheDocument();
    });
  });

  describe('sticky positioning', () => {
    it('wraps icons and name in a sticky-left group', () => {
      const buff = makeBuff(1, 2);
      useStore.setState({ buffs: [{ ...buff, parameterValues: buff.parameters }] });

      render(
        <BuffCanvasItem buff={buff} onRemove={() => {}} isDialogClickable={true} />,
      );

      const nameElement = screen.getByText('ATK Buff');
      const stickyGroup = nameElement.closest('div[class*="sticky"]') as HTMLElement;
      expect(stickyGroup).not.toBeNull();
      expect(stickyGroup).toHaveClass('left-0');
    });

    it('places icons in the sticky-left group alongside the name', () => {
      const buff = makeBuff(1, 2);
      useStore.setState({ buffs: [{ ...buff, parameterValues: buff.parameters }] });

      render(
        <BuffCanvasItem buff={buff} onRemove={() => {}} isDialogClickable={true} />,
      );

      const nameElement = screen.getByText('ATK Buff');
      const stickyGroup = nameElement.closest('div[class*="sticky"]') as HTMLElement;
      // Both ItemMedia slots live inside the same sticky-left group
      const mediaSlots = stickyGroup.querySelectorAll('[data-slot="item-media"]');
      expect(mediaSlots).toHaveLength(2);
    });

    it('places action buttons in the sticky-right group, not the sticky-left group', () => {
      const buff = makeBuff(1, 2);
      useStore.setState({ buffs: [{ ...buff, parameterValues: buff.parameters }] });

      const { container } = render(
        <BuffCanvasItem buff={buff} onRemove={() => {}} isDialogClickable={true} />,
      );

      const nameElement = screen.getByText('ATK Buff');
      const stickyLeft = nameElement.closest('div[class*="sticky"]') as HTMLElement;
      const buttons = stickyLeft.querySelectorAll('button');
      expect(buttons).toHaveLength(0);

      const actionsElement = container.querySelector(
        '[data-slot="item-actions"]',
      ) as HTMLElement;
      expect(actionsElement.querySelectorAll('button').length).toBeGreaterThan(0);
    });
  });

  describe('onOpenChange', () => {
    it('calls onOpenChange(true) when the dialog opens', async () => {
      const buff = makeBuff(1, 2);
      useStore.setState({ buffs: [{ ...buff, parameterValues: buff.parameters }] });
      const onOpenChange = vi.fn();

      render(
        <BuffCanvasItem
          buff={buff}
          onRemove={() => {}}
          isDialogClickable={true}
          onOpenChange={onOpenChange}
        />,
      );

      await userEvent.click(screen.getByText('ATK Buff'));

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('calls onOpenChange(false) when the dialog is closed via Escape', async () => {
      const buff = makeBuff(1, 2);
      useStore.setState({ buffs: [{ ...buff, parameterValues: buff.parameters }] });
      const onOpenChange = vi.fn();

      render(
        <BuffCanvasItem
          buff={buff}
          onRemove={() => {}}
          isDialogClickable={true}
          onOpenChange={onOpenChange}
        />,
      );

      await userEvent.click(screen.getByText('ATK Buff'));
      await userEvent.keyboard('{Escape}');

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onOpenChange(false) when parameters are saved', async () => {
      const buff = makeBuff(1, 2);
      useStore.setState({ buffs: [{ ...buff, parameterValues: buff.parameters }] });
      const onOpenChange = vi.fn();

      render(
        <BuffCanvasItem
          buff={buff}
          onRemove={() => {}}
          isDialogClickable={true}
          onOpenChange={onOpenChange}
        />,
      );

      await userEvent.click(screen.getByText('ATK Buff'));
      await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

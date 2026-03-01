import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { OriginType, Target } from '@/services/game-data';
import { useStore } from '@/store';

import { BuffCanvasItem } from './BuffCanvasItem';

vi.mock('@/hooks/useIcons');
vi.mock('@/hooks/useSelfBuffAlignment');
vi.mock('@/hooks/useTeamAttackInstances');

const { useCapabilityIcon, useEntityIcon } = await import('@/hooks/useIcons');
const { useSelfBuffAlignment } = await import('@/hooks/useSelfBuffAlignment');
const { useTeamAttackInstances } = await import('@/hooks/useTeamAttackInstances');

const mockUseCapabilityIcon = vi.mocked(useCapabilityIcon);
const mockUseEntityIcon = vi.mocked(useEntityIcon);
const mockUseSelfBuffAlignment = vi.mocked(useSelfBuffAlignment);
const mockUseTeamAttackInstances = vi.mocked(useTeamAttackInstances);

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const MOCK_ATTACKS = [
  {
    instanceId: 'a0',
    id: 1,
    characterId: 1001,
    name: 'Resonance Liberation',
    parentName: 'Skill',
    description: '',
    characterName: 'Rover',
    originType: OriginType.RESONANCE_LIBERATION,
    isTuneBreakAttack: false,
    parameters: [] as [],
  },
  {
    instanceId: 'a1',
    id: 2,
    characterId: 1001,
    name: 'Heavy Attack',
    parentName: 'Basic',
    description: '',
    characterName: 'Rover',
    originType: OriginType.NORMAL_ATTACK,
    isTuneBreakAttack: false,
    parameters: [] as [],
  },
  {
    instanceId: 'a2',
    id: 3,
    characterId: 1001,
    name: 'Basic Attack',
    parentName: 'Basic',
    description: '',
    characterName: 'Rover',
    originType: OriginType.NORMAL_ATTACK,
    isTuneBreakAttack: false,
    parameters: [] as [],
  },
];

const makeBuff = (x: number, w: number, withStackConfig = false) => ({
  instanceId: 'buff-1',
  id: 10,
  characterId: 1001,
  name: 'ATK Buff',
  parentName: 'Weapon',
  description: 'Increases ATK',
  characterName: 'Rover',
  originType: OriginType.WEAPON,
  target: Target.TEAM,
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
});

beforeEach(() => {
  mockUseCapabilityIcon.mockReturnValue({ data: undefined } as ReturnType<
    typeof useCapabilityIcon
  >);
  mockUseEntityIcon.mockReturnValue({ data: undefined } as ReturnType<
    typeof useEntityIcon
  >);
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
  describe('buffedAttacks passed to CanvasItem', () => {
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

    it('does not open the dialog and does not call onOpenChange when isDialogClickable is false', async () => {
      const buff = makeBuff(1, 2);
      useStore.setState({ buffs: [{ ...buff, parameterValues: buff.parameters }] });
      const onOpenChange = vi.fn();

      render(
        <BuffCanvasItem
          buff={buff}
          onRemove={() => {}}
          isDialogClickable={false}
          onOpenChange={onOpenChange}
        />,
      );

      await userEvent.click(screen.getByText('ATK Buff'));

      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});

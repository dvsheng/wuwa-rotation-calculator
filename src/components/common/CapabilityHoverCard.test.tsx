import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';

import type { DetailedAttack } from '@/hooks/useTeamDetails';
import { CapabilityType } from '@/services/game-data/types';

import { CapabilityHoverCard } from './CapabilityHoverCard';

beforeAll(() => {
  // floating-ui's autoUpdate uses ResizeObserver
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const makeAttack = (overrides: Record<string, unknown> = {}): DetailedAttack =>
  ({
    id: 1,
    name: 'Test Buff',
    description: 'Increases ATK by 10%',
    parentName: 'Weapon',
    parameters: [],
    capabilityType: CapabilityType.ATTACK,
    damageInstances: [],
    characterId: 1,
    entityId: 1,
    characterName: 'Rover',
    ...overrides,
  }) as unknown as DetailedAttack;

// The cursor hover card wraps children in a display:contents div. Because mouseenter
// does not bubble, events must be fired on that wrapper div, not the child trigger.
const getWrapper = (trigger: HTMLElement) => trigger.parentElement!;

describe('CapabilityHoverCard', () => {
  describe('when capability has no displayable content', () => {
    it('renders children directly without a hover card', () => {
      const capability = makeAttack({
        description: '',
        parentName: '',
        damageInstances: [],
      });

      render(
        <CapabilityHoverCard capability={capability}>
          <button>trigger</button>
        </CapabilityHoverCard>,
      );

      expect(screen.getByRole('button', { name: 'trigger' })).toBeInTheDocument();
      expect(screen.queryByText('Test Buff')).not.toBeInTheDocument();
    });
  });

  describe('default hover card (followCursor=false)', () => {
    it('shows hover card content on hover', async () => {
      const capability = makeAttack();

      render(
        <CapabilityHoverCard capability={capability}>
          <button>trigger</button>
        </CapabilityHoverCard>,
      );

      await userEvent.hover(screen.getByRole('button', { name: 'trigger' }));

      expect(await screen.findByText('Test Buff')).toBeInTheDocument();
      expect(await screen.findByText('Increases ATK by 10%')).toBeInTheDocument();
      expect(await screen.findByText('Weapon')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Open in admin' })).toHaveAttribute(
        'href',
        '/admin/entities/1?capabilityId=1',
      );
    });

    it('shows Parameterized badge when capability has parameters', async () => {
      const capability = makeAttack({
        parameters: [{ id: '0', minimum: 0, maximum: 100 }],
      });

      render(
        <CapabilityHoverCard capability={capability}>
          <button>trigger</button>
        </CapabilityHoverCard>,
      );

      await userEvent.hover(screen.getByRole('button', { name: 'trigger' }));

      expect(await screen.findByText('Parameterized')).toBeInTheDocument();
    });

    it('does not show Parameterized badge when capability has no parameters', async () => {
      const capability = makeAttack({ parameters: [] });

      render(
        <CapabilityHoverCard capability={capability}>
          <button>trigger</button>
        </CapabilityHoverCard>,
      );

      await userEvent.hover(screen.getByRole('button', { name: 'trigger' }));
      await screen.findByText('Increases ATK by 10%');

      expect(screen.queryByText('Parameterized')).not.toBeInTheDocument();
    });
  });

  describe('followCursor hover card', () => {
    it('shows hover card content after the standard hover delay', async () => {
      const capability = makeAttack();

      render(
        <CapabilityHoverCard capability={capability} followCursor>
          <button>trigger</button>
        </CapabilityHoverCard>,
      );

      fireEvent.mouseEnter(
        getWrapper(screen.getByRole('button', { name: 'trigger' })),
        {
          clientX: 120,
          clientY: 240,
        },
      );

      expect(screen.queryByText('Test Buff')).not.toBeInTheDocument();

      expect(await screen.findByText('Test Buff')).toBeInTheDocument();
      expect(await screen.findByText('Increases ATK by 10%')).toBeInTheDocument();
      expect(await screen.findByText('Weapon')).toBeInTheDocument();
    });

    it('does not show hover card content if hover ends before the delay', async () => {
      const capability = makeAttack();

      render(
        <CapabilityHoverCard capability={capability} followCursor>
          <button>trigger</button>
        </CapabilityHoverCard>,
      );

      const wrapper = getWrapper(screen.getByRole('button', { name: 'trigger' }));
      fireEvent.mouseEnter(wrapper);
      fireEvent.mouseLeave(wrapper);

      await act(async () => {
        await new Promise((resolve) => globalThis.setTimeout(resolve, 250));
      });

      expect(screen.queryByText('Increases ATK by 10%')).not.toBeInTheDocument();
    });

    it('hides hover card content after the close delay on mouseleave', async () => {
      const capability = makeAttack();

      render(
        <CapabilityHoverCard capability={capability} followCursor>
          <button>trigger</button>
        </CapabilityHoverCard>,
      );

      const wrapper = getWrapper(screen.getByRole('button', { name: 'trigger' }));
      fireEvent.mouseEnter(wrapper);
      expect(await screen.findByText('Increases ATK by 10%')).toBeInTheDocument();

      fireEvent.mouseLeave(wrapper);

      expect(screen.getByText('Increases ATK by 10%')).toBeInTheDocument();
      fireEvent.mouseLeave(screen.getByTestId('cursor-hover-card-content'), {
        relatedTarget: document.body,
      });

      await act(async () => {
        await new Promise((resolve) => globalThis.setTimeout(resolve, 120));
      });

      expect(screen.queryByText('Increases ATK by 10%')).not.toBeInTheDocument();
    });

    it('keeps hover card content visible while hovering the hover card itself', async () => {
      const capability = makeAttack();

      render(
        <CapabilityHoverCard capability={capability} followCursor>
          <button>trigger</button>
        </CapabilityHoverCard>,
      );

      const wrapper = getWrapper(screen.getByRole('button', { name: 'trigger' }));
      fireEvent.mouseEnter(wrapper);
      expect(await screen.findByTestId('cursor-hover-card-content')).toBeInTheDocument();

      fireEvent.mouseLeave(wrapper);
      fireEvent.mouseEnter(screen.getByTestId('cursor-hover-card-content'));

      await act(async () => {
        await new Promise((resolve) => globalThis.setTimeout(resolve, 120));
      });

      expect(screen.getByText('Increases ATK by 10%')).toBeInTheDocument();

      fireEvent.mouseLeave(screen.getByTestId('cursor-hover-card-content'), {
        relatedTarget: document.body,
      });

      await act(async () => {
        await new Promise((resolve) => globalThis.setTimeout(resolve, 120));
      });

      expect(screen.queryByText('Increases ATK by 10%')).not.toBeInTheDocument();
    });

    it('keeps hover card visible as cursor moves', async () => {
      const capability = makeAttack();

      render(
        <CapabilityHoverCard capability={capability} followCursor>
          <button>trigger</button>
        </CapabilityHoverCard>,
      );

      const wrapper = getWrapper(screen.getByRole('button', { name: 'trigger' }));
      fireEvent.mouseEnter(wrapper);
      expect(await screen.findByText('Increases ATK by 10%')).toBeInTheDocument();

      fireEvent.mouseMove(wrapper, { clientX: 150, clientY: 300 });
      await act(async () => {});

      expect(screen.getByText('Increases ATK by 10%')).toBeInTheDocument();
    });

    it('shows Parameterized badge when capability has parameters', async () => {
      const capability = makeAttack({
        parameters: [{ id: '0', minimum: 0, maximum: 100 }],
      });

      render(
        <CapabilityHoverCard capability={capability} followCursor>
          <button>trigger</button>
        </CapabilityHoverCard>,
      );

      fireEvent.mouseEnter(getWrapper(screen.getByRole('button', { name: 'trigger' })));

      expect(await screen.findByText('Parameterized')).toBeInTheDocument();
    });

    it('shows parentName when present', async () => {
      const capability = makeAttack({ parentName: 'Echo' });

      render(
        <CapabilityHoverCard capability={capability} followCursor>
          <button>trigger</button>
        </CapabilityHoverCard>,
      );

      fireEvent.mouseEnter(getWrapper(screen.getByRole('button', { name: 'trigger' })));

      expect(await screen.findByText('Echo')).toBeInTheDocument();
    });

    it('does not show Parameterized badge when capability has no parameters', async () => {
      const capability = makeAttack({ parameters: [] });

      render(
        <CapabilityHoverCard capability={capability} followCursor>
          <button>trigger</button>
        </CapabilityHoverCard>,
      );

      fireEvent.mouseEnter(getWrapper(screen.getByRole('button', { name: 'trigger' })));
      await screen.findByText('Test Buff');

      expect(screen.queryByText('Parameterized')).not.toBeInTheDocument();
    });
  });
});

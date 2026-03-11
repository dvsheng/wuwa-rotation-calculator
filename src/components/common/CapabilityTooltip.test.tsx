import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';

import { CapabilityTooltip } from './CapabilityTooltip';

beforeAll(() => {
  // floating-ui's autoUpdate uses ResizeObserver
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const makeCapability = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 1,
    name: 'Test Buff',
    description: 'Increases ATK by 10%',
    parentName: 'Weapon',
    parameters: [],
    ...overrides,
  }) as any;

// The cursor tooltip wraps children in a display:contents div. Because mouseenter
// does not bubble, events must be fired on that wrapper div, not the child trigger.
const getWrapper = (trigger: HTMLElement) => trigger.parentElement!;

describe('CapabilityTooltip', () => {
  describe('when capability has no displayable content', () => {
    it('renders children directly without a tooltip', () => {
      const capability = makeCapability({
        description: '',
        parentName: '',
        parameters: [],
      });

      render(
        <CapabilityTooltip capability={capability}>
          <button>trigger</button>
        </CapabilityTooltip>,
      );

      expect(screen.getByRole('button', { name: 'trigger' })).toBeInTheDocument();
      expect(screen.queryByText('Test Buff')).not.toBeInTheDocument();
    });
  });

  describe('default tooltip (followCursor=false)', () => {
    // Radix renders content twice: once visible, once in a visually-hidden role="tooltip"
    // span for screen readers. Use within(screen.getByRole('tooltip')) to scope assertions
    // to avoid "multiple elements found" errors.
    it('shows tooltip content on hover', async () => {
      const capability = makeCapability();

      render(
        <CapabilityTooltip capability={capability}>
          <button>trigger</button>
        </CapabilityTooltip>,
      );

      await userEvent.hover(screen.getByRole('button', { name: 'trigger' }));
      await act(async () => {}); // Flush microtasks per floating-ui testing guide

      const tooltip = screen.getByRole('tooltip');
      expect(within(tooltip).getByText('Test Buff')).toBeInTheDocument();
      expect(within(tooltip).getByText('Increases ATK by 10%')).toBeInTheDocument();
      expect(within(tooltip).getByText('Weapon')).toBeInTheDocument();
    });

    it('shows Parameterized badge when capability has parameters', async () => {
      const capability = makeCapability({
        parameters: [{ id: '0', minimum: 0, maximum: 100 }],
      });

      render(
        <CapabilityTooltip capability={capability}>
          <button>trigger</button>
        </CapabilityTooltip>,
      );

      await userEvent.hover(screen.getByRole('button', { name: 'trigger' }));
      await act(async () => {});

      expect(
        within(screen.getByRole('tooltip')).getByText('Parameterized'),
      ).toBeInTheDocument();
    });

    it('does not show Parameterized badge when capability has no parameters', async () => {
      const capability = makeCapability({ parameters: [] });

      render(
        <CapabilityTooltip capability={capability}>
          <button>trigger</button>
        </CapabilityTooltip>,
      );

      await userEvent.hover(screen.getByRole('button', { name: 'trigger' }));
      await act(async () => {});

      expect(
        within(screen.getByRole('tooltip')).queryByText('Parameterized'),
      ).not.toBeInTheDocument();
    });
  });

  describe('followCursor tooltip', () => {
    it('shows tooltip content on mouseenter', async () => {
      const capability = makeCapability();

      render(
        <CapabilityTooltip capability={capability} followCursor>
          <button>trigger</button>
        </CapabilityTooltip>,
      );

      fireEvent.mouseEnter(getWrapper(screen.getByRole('button', { name: 'trigger' })));
      await act(async () => {}); // Flush microtasks per floating-ui testing guide

      expect(screen.getByText('Test Buff')).toBeInTheDocument();
      expect(screen.getByText('Increases ATK by 10%')).toBeInTheDocument();
      expect(screen.getByText('Weapon')).toBeInTheDocument();
    });

    it('hides tooltip content on mouseleave', async () => {
      const capability = makeCapability();

      render(
        <CapabilityTooltip capability={capability} followCursor>
          <button>trigger</button>
        </CapabilityTooltip>,
      );

      const wrapper = getWrapper(screen.getByRole('button', { name: 'trigger' }));
      fireEvent.mouseEnter(wrapper);
      await act(async () => {});

      fireEvent.mouseLeave(wrapper);

      expect(screen.queryByText('Increases ATK by 10%')).not.toBeInTheDocument();
    });

    it('keeps tooltip visible as cursor moves', async () => {
      const capability = makeCapability();

      render(
        <CapabilityTooltip capability={capability} followCursor>
          <button>trigger</button>
        </CapabilityTooltip>,
      );

      const wrapper = getWrapper(screen.getByRole('button', { name: 'trigger' }));
      fireEvent.mouseEnter(wrapper);
      await act(async () => {});

      fireEvent.mouseMove(wrapper, { clientX: 150, clientY: 300 });
      await act(async () => {});

      expect(screen.getByText('Increases ATK by 10%')).toBeInTheDocument();
    });

    it('shows Parameterized badge when capability has parameters', async () => {
      const capability = makeCapability({
        parameters: [{ id: '0', minimum: 0, maximum: 100 }],
      });

      render(
        <CapabilityTooltip capability={capability} followCursor>
          <button>trigger</button>
        </CapabilityTooltip>,
      );

      fireEvent.mouseEnter(getWrapper(screen.getByRole('button', { name: 'trigger' })));
      await act(async () => {});

      expect(screen.getByText('Parameterized')).toBeInTheDocument();
    });

    it('shows parentName when present', async () => {
      const capability = makeCapability({ parentName: 'Echo' });

      render(
        <CapabilityTooltip capability={capability} followCursor>
          <button>trigger</button>
        </CapabilityTooltip>,
      );

      fireEvent.mouseEnter(getWrapper(screen.getByRole('button', { name: 'trigger' })));
      await act(async () => {});

      expect(screen.getByText('Echo')).toBeInTheDocument();
    });

    it('does not show Parameterized badge when capability has no parameters', async () => {
      const capability = makeCapability({ parameters: [] });

      render(
        <CapabilityTooltip capability={capability} followCursor>
          <button>trigger</button>
        </CapabilityTooltip>,
      );

      fireEvent.mouseEnter(getWrapper(screen.getByRole('button', { name: 'trigger' })));
      await act(async () => {});

      expect(screen.queryByText('Parameterized')).not.toBeInTheDocument();
    });
  });
});

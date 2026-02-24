import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { Palette, PaletteGroup, PaletteItem, PaletteLegend } from './Palette';

// Mock ResizeObserver for ScrollArea component
beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('Palette', () => {
  describe('root component', () => {
    it('renders children', () => {
      render(
        <Palette>
          <PaletteGroup name="Test Group">
            <PaletteItem text="Test Item" />
          </PaletteGroup>
        </Palette>,
      );

      expect(screen.getByText('Test Group')).toBeInTheDocument();
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    it('renders header text when provided', () => {
      render(
        <Palette headerText="My Palette">
          <PaletteGroup name="Test Group">
            <PaletteItem text="Test Item" />
          </PaletteGroup>
        </Palette>,
      );

      expect(screen.getByText('My Palette')).toBeInTheDocument();
    });

    it('displays empty message when no groups have items', () => {
      render(<Palette emptyMessage="No items found" />);

      expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    it('displays default empty message when no emptyMessage prop is provided', () => {
      render(<Palette />);

      expect(screen.getByText('No items available')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <Palette className="custom-class">
          <PaletteGroup name="Test">
            <PaletteItem text="Item" />
          </PaletteGroup>
        </Palette>,
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('always-expanded behavior', () => {
    it('keeps content visible', () => {
      render(
        <Palette headerText="Palette">
          <PaletteGroup name="Test">
            <PaletteItem text="Item" />
          </PaletteGroup>
        </Palette>,
      );

      expect(screen.getByText('Palette')).toBeInTheDocument();
      expect(screen.getByText('Item')).toBeInTheDocument();
    });
  });

  describe('PaletteGroup', () => {
    it('renders group name', () => {
      render(
        <Palette>
          <PaletteGroup name="Characters">
            <PaletteItem text="Item" />
          </PaletteGroup>
        </Palette>,
      );

      expect(screen.getByText('Characters')).toBeInTheDocument();
    });

    it('renders multiple items', () => {
      render(
        <Palette>
          <PaletteGroup name="Test">
            <PaletteItem text="Item 1" />
            <PaletteItem text="Item 2" />
            <PaletteItem text="Item 3" />
          </PaletteGroup>
        </Palette>,
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <Palette>
          <PaletteGroup name="Test" className="custom-group">
            <PaletteItem text="Item" />
          </PaletteGroup>
        </Palette>,
      );

      expect(container.querySelector('.custom-group')).toBeInTheDocument();
    });

    it('renders multiple groups', () => {
      render(
        <Palette>
          <PaletteGroup name="Group 1">
            <PaletteItem text="Item A" />
          </PaletteGroup>
          <PaletteGroup name="Group 2">
            <PaletteItem text="Item B" />
          </PaletteGroup>
        </Palette>,
      );

      expect(screen.getByText('Group 1')).toBeInTheDocument();
      expect(screen.getByText('Group 2')).toBeInTheDocument();
      expect(screen.getByText('Item A')).toBeInTheDocument();
      expect(screen.getByText('Item B')).toBeInTheDocument();
    });
  });

  describe('PaletteItem with text prop', () => {
    it('renders the text', () => {
      render(
        <Palette>
          <PaletteGroup name="Test">
            <PaletteItem text="Test Item" />
          </PaletteGroup>
        </Palette>,
      );

      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    it('calls onClick when the item is clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Palette>
          <PaletteGroup name="Test">
            <PaletteItem text="Test Item" onClick={onClick} />
          </PaletteGroup>
        </Palette>,
      );

      await user.click(screen.getByText('Test Item'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when not provided', async () => {
      const user = userEvent.setup();
      render(
        <Palette>
          <PaletteGroup name="Test">
            <PaletteItem text="Test Item" />
          </PaletteGroup>
        </Palette>,
      );

      await user.click(screen.getByText('Test Item'));
      // No error should occur - this test passes if no exception is thrown
    });

    describe('add button', () => {
      it('renders add button when onAdd is provided', () => {
        const onAdd = vi.fn();
        render(
          <Palette>
            <PaletteGroup name="Test">
              <PaletteItem text="Test Item" onAdd={onAdd} />
            </PaletteGroup>
          </Palette>,
        );

        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      it('does not render add button when onAdd is not provided', () => {
        render(
          <Palette>
            <PaletteGroup name="Test">
              <PaletteItem text="Test Item" />
            </PaletteGroup>
          </Palette>,
        );

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
      });

      it('calls onAdd when add button is clicked', async () => {
        const user = userEvent.setup();
        const onAdd = vi.fn();
        render(
          <Palette>
            <PaletteGroup name="Test">
              <PaletteItem text="Test Item" onAdd={onAdd} />
            </PaletteGroup>
          </Palette>,
        );

        await user.click(screen.getByRole('button'));

        expect(onAdd).toHaveBeenCalledTimes(1);
      });

      it('does not trigger onClick when add button is clicked', async () => {
        const user = userEvent.setup();
        const onAdd = vi.fn();
        const onClick = vi.fn();
        render(
          <Palette>
            <PaletteGroup name="Test">
              <PaletteItem text="Test Item" onAdd={onAdd} onClick={onClick} />
            </PaletteGroup>
          </Palette>,
        );

        await user.click(screen.getByRole('button'));

        expect(onAdd).toHaveBeenCalledTimes(1);
        expect(onClick).not.toHaveBeenCalled();
      });
    });

    describe('drag behavior', () => {
      it('calls onDragStart when the item is dragged', () => {
        const onDragStart = vi.fn();
        render(
          <Palette>
            <PaletteGroup name="Test">
              <PaletteItem text="Test Item" onDragStart={onDragStart} />
            </PaletteGroup>
          </Palette>,
        );

        const item = screen.getByText('Test Item').closest('div[draggable]');
        fireEvent.dragStart(item!);

        expect(onDragStart).toHaveBeenCalledTimes(1);
      });

      it('sets draggable attribute when onDragStart is provided', () => {
        const onDragStart = vi.fn();
        render(
          <Palette>
            <PaletteGroup name="Test">
              <PaletteItem text="Test Item" onDragStart={onDragStart} />
            </PaletteGroup>
          </Palette>,
        );

        const item = screen.getByText('Test Item').closest('div[draggable]');
        expect(item).toHaveAttribute('draggable', 'true');
      });

      it('does not set draggable when onDragStart is not provided', () => {
        render(
          <Palette>
            <PaletteGroup name="Test">
              <PaletteItem text="Test Item" />
            </PaletteGroup>
          </Palette>,
        );

        const item = screen.getByText('Test Item').closest('div');
        expect(item).not.toHaveAttribute('draggable', 'true');
      });
    });

    describe('tooltip', () => {
      it('renders without error when hoverText is provided', () => {
        expect(() =>
          render(
            <Palette>
              <PaletteGroup name="Test">
                <PaletteItem text="Test Item" hoverText="Hover description" />
              </PaletteGroup>
            </Palette>,
          ),
        ).not.toThrow();
      });

      it('renders without error when hoverText is not provided', () => {
        expect(() =>
          render(
            <Palette>
              <PaletteGroup name="Test">
                <PaletteItem text="Test Item" />
              </PaletteGroup>
            </Palette>,
          ),
        ).not.toThrow();
      });
    });
  });

  describe('PaletteItem with children (composable)', () => {
    it('renders children when text prop is not provided', () => {
      render(
        <Palette>
          <PaletteGroup name="Test">
            <PaletteItem>
              <div data-testid="custom-child">Custom Content</div>
            </PaletteItem>
          </PaletteGroup>
        </Palette>,
      );

      expect(screen.getByTestId('custom-child')).toBeInTheDocument();
      expect(screen.getByText('Custom Content')).toBeInTheDocument();
    });

    it('applies className to children wrapper', () => {
      const { container } = render(
        <Palette>
          <PaletteGroup name="Test">
            <PaletteItem className="custom-item">
              <div>Content</div>
            </PaletteItem>
          </PaletteGroup>
        </Palette>,
      );

      expect(container.querySelector('.custom-item')).toBeInTheDocument();
    });
  });

  describe('PaletteLegend', () => {
    const legendItems = [
      { label: 'Fire', className: 'bg-red-100' },
      { label: 'Ice', className: 'bg-blue-100' },
      { label: 'Wind', className: 'bg-green-100' },
    ];

    it('renders legend items', () => {
      render(
        <Palette>
          <PaletteLegend items={legendItems} />
          <PaletteGroup name="Test">
            <PaletteItem text="Item" />
          </PaletteGroup>
        </Palette>,
      );

      expect(screen.getByText('Fire')).toBeInTheDocument();
      expect(screen.getByText('Ice')).toBeInTheDocument();
      expect(screen.getByText('Wind')).toBeInTheDocument();
    });

    it('renders "Filter by:" label', () => {
      render(
        <Palette>
          <PaletteLegend items={legendItems} />
          <PaletteGroup name="Test">
            <PaletteItem text="Item" />
          </PaletteGroup>
        </Palette>,
      );

      expect(screen.getByText('Filter by:')).toBeInTheDocument();
    });

    it('does not render when items array is empty', () => {
      render(
        <Palette>
          <PaletteLegend items={[]} />
          <PaletteGroup name="Test">
            <PaletteItem text="Item" />
          </PaletteGroup>
        </Palette>,
      );

      expect(screen.queryByText('Filter by:')).not.toBeInTheDocument();
    });

    it('filters items when legend button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Palette>
          <PaletteLegend items={legendItems} />
          <PaletteGroup name="Test">
            <PaletteItem text="Fire Item" legendLabel="Fire" />
            <PaletteItem text="Ice Item" legendLabel="Ice" />
            <PaletteItem text="Wind Item" legendLabel="Wind" />
          </PaletteGroup>
        </Palette>,
      );

      // All items should be visible initially
      expect(screen.getByText('Fire Item')).toBeInTheDocument();
      expect(screen.getByText('Ice Item')).toBeInTheDocument();
      expect(screen.getByText('Wind Item')).toBeInTheDocument();

      // Click on Fire filter
      await user.click(screen.getByRole('button', { name: 'Fire' }));

      // Only Fire item should be visible
      expect(screen.getByText('Fire Item')).toBeInTheDocument();
      expect(screen.queryByText('Ice Item')).not.toBeInTheDocument();
      expect(screen.queryByText('Wind Item')).not.toBeInTheDocument();
    });

    it('allows multiple filters to be selected', async () => {
      const user = userEvent.setup();
      render(
        <Palette>
          <PaletteLegend items={legendItems} />
          <PaletteGroup name="Test">
            <PaletteItem text="Fire Item" legendLabel="Fire" />
            <PaletteItem text="Ice Item" legendLabel="Ice" />
            <PaletteItem text="Wind Item" legendLabel="Wind" />
          </PaletteGroup>
        </Palette>,
      );

      // Click on Fire and Ice filters
      await user.click(screen.getByRole('button', { name: 'Fire' }));
      await user.click(screen.getByRole('button', { name: 'Ice' }));

      // Fire and Ice items should be visible
      expect(screen.getByText('Fire Item')).toBeInTheDocument();
      expect(screen.getByText('Ice Item')).toBeInTheDocument();
      expect(screen.queryByText('Wind Item')).not.toBeInTheDocument();
    });

    it('shows "Clear Filters" button when filters are active', async () => {
      const user = userEvent.setup();
      render(
        <Palette>
          <PaletteLegend items={legendItems} />
          <PaletteGroup name="Test">
            <PaletteItem text="Fire Item" legendLabel="Fire" />
          </PaletteGroup>
        </Palette>,
      );

      expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Fire' }));

      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });

    it('clears all filters when "Clear Filters" is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Palette>
          <PaletteLegend items={legendItems} />
          <PaletteGroup name="Test">
            <PaletteItem text="Fire Item" legendLabel="Fire" />
            <PaletteItem text="Ice Item" legendLabel="Ice" />
            <PaletteItem text="Wind Item" legendLabel="Wind" />
          </PaletteGroup>
        </Palette>,
      );

      // Apply filter
      await user.click(screen.getByRole('button', { name: 'Fire' }));
      expect(screen.queryByText('Ice Item')).not.toBeInTheDocument();

      // Clear filters
      await user.click(screen.getByText('Clear Filters'));

      // All items should be visible again
      expect(screen.getByText('Fire Item')).toBeInTheDocument();
      expect(screen.getByText('Ice Item')).toBeInTheDocument();
      expect(screen.getByText('Wind Item')).toBeInTheDocument();
    });

    it('toggles filter when clicked twice', async () => {
      const user = userEvent.setup();
      render(
        <Palette>
          <PaletteLegend items={legendItems} />
          <PaletteGroup name="Test">
            <PaletteItem text="Fire Item" legendLabel="Fire" />
            <PaletteItem text="Ice Item" legendLabel="Ice" />
          </PaletteGroup>
        </Palette>,
      );

      const fireButton = screen.getByRole('button', { name: 'Fire' });

      // First click - activate filter
      await user.click(fireButton);
      expect(screen.queryByText('Ice Item')).not.toBeInTheDocument();

      // Second click - deactivate filter
      await user.click(fireButton);
      expect(screen.getByText('Ice Item')).toBeInTheDocument();
    });

    it('applies className to legend container', () => {
      const { container } = render(
        <Palette>
          <PaletteLegend items={legendItems} className="custom-legend" />
          <PaletteGroup name="Test">
            <PaletteItem text="Item" />
          </PaletteGroup>
        </Palette>,
      );

      expect(container.querySelector('.custom-legend')).toBeInTheDocument();
    });
  });

  describe('filtering integration', () => {
    it('does not hide groups with no visible items after filtering', async () => {
      const user = userEvent.setup();
      const legendItems = [
        { label: 'Fire', className: 'bg-red-100' },
        { label: 'Ice', className: 'bg-blue-100' },
      ];

      render(
        <Palette>
          <PaletteLegend items={legendItems} />
          <PaletteGroup name="Fire Group">
            <PaletteItem text="Fire Item" legendLabel="Fire" />
          </PaletteGroup>
          <PaletteGroup name="Ice Group">
            <PaletteItem text="Ice Item" legendLabel="Ice" />
          </PaletteGroup>
        </Palette>,
      );

      expect(screen.getByText('Fire Group')).toBeInTheDocument();
      expect(screen.getByText('Ice Group')).toBeInTheDocument();

      // Filter by Fire
      await user.click(screen.getByRole('button', { name: 'Fire' }));

      expect(screen.getByText('Fire Group')).toBeInTheDocument();
      expect(screen.queryByText('Ice Group')).toBeInTheDocument();
    });

    it('does not filter items without legendLabel', async () => {
      const user = userEvent.setup();
      const legendItems = [{ label: 'Fire', className: 'bg-red-100' }];

      render(
        <Palette>
          <PaletteLegend items={legendItems} />
          <PaletteGroup name="Test">
            <PaletteItem text="Fire Item" legendLabel="Fire" />
            <PaletteItem text="No Label Item" />
          </PaletteGroup>
        </Palette>,
      );

      // Filter by Fire
      await user.click(screen.getByRole('button', { name: 'Fire' }));

      // Both items should still be visible (item without label is not filtered)
      expect(screen.getByText('Fire Item')).toBeInTheDocument();
      expect(screen.getByText('No Label Item')).toBeInTheDocument();
    });
  });

  describe('complex composition', () => {
    it('handles multiple groups with mixed content', () => {
      render(
        <Palette headerText="Complex Palette">
          <PaletteLegend
            items={[
              { label: 'Type A', className: 'bg-red-100' },
              { label: 'Type B', className: 'bg-blue-100' },
            ]}
          />
          <PaletteGroup name="Group 1">
            <PaletteItem text="Text Item" legendLabel="Type A" />
            <PaletteItem legendLabel="Type B">
              <div data-testid="custom-1">Custom 1</div>
            </PaletteItem>
          </PaletteGroup>
          <PaletteGroup name="Group 2">
            <PaletteItem text="Another Text" legendLabel="Type A" />
          </PaletteGroup>
        </Palette>,
      );

      expect(screen.getByText('Complex Palette')).toBeInTheDocument();
      expect(screen.getByText('Group 1')).toBeInTheDocument();
      expect(screen.getByText('Group 2')).toBeInTheDocument();
      expect(screen.getByText('Text Item')).toBeInTheDocument();
      expect(screen.getByTestId('custom-1')).toBeInTheDocument();
      expect(screen.getByText('Another Text')).toBeInTheDocument();
    });
  });
});

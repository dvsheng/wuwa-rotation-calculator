import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PaletteItem } from './PaletteItem';

describe('PaletteItem', () => {
  it('renders the text', () => {
    render(<PaletteItem text="Test Item" />);

    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  it('calls onClick when the item is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<PaletteItem text="Test Item" onClick={onClick} />);

    await user.click(screen.getByText('Test Item'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when not provided', async () => {
    const user = userEvent.setup();
    render(<PaletteItem text="Test Item" />);

    await user.click(screen.getByText('Test Item'));
    // No error should occur - this test passes if no exception is thrown
  });

  describe('add button', () => {
    it('renders add button when onAdd is provided', () => {
      const onAdd = vi.fn();
      render(<PaletteItem text="Test Item" onAdd={onAdd} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('does not render add button when onAdd is not provided', () => {
      render(<PaletteItem text="Test Item" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onAdd when add button is clicked', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<PaletteItem text="Test Item" onAdd={onAdd} />);

      await user.click(screen.getByRole('button'));

      expect(onAdd).toHaveBeenCalledTimes(1);
    });

    it('does not trigger onClick when add button is clicked', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      const onClick = vi.fn();
      render(<PaletteItem text="Test Item" onAdd={onAdd} onClick={onClick} />);

      await user.click(screen.getByRole('button'));

      expect(onAdd).toHaveBeenCalledTimes(1);
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('drag behavior', () => {
    it('calls onDragStart when the item is dragged', () => {
      const onDragStart = vi.fn();
      render(<PaletteItem text="Test Item" onDragStart={onDragStart} />);

      const item = screen.getByText('Test Item').closest('div[draggable]');
      fireEvent.dragStart(item!);

      expect(onDragStart).toHaveBeenCalledTimes(1);
    });

    it('sets draggable attribute when onDragStart is provided', () => {
      const onDragStart = vi.fn();
      render(<PaletteItem text="Test Item" onDragStart={onDragStart} />);

      const item = screen.getByText('Test Item').closest('div[draggable]');
      expect(item).toHaveAttribute('draggable', 'true');
    });

    it('does not set draggable when onDragStart is not provided', () => {
      render(<PaletteItem text="Test Item" />);

      const item = screen.getByText('Test Item').closest('div');
      expect(item).not.toHaveAttribute('draggable', 'true');
    });
  });

  describe('tooltip', () => {
    it('renders without error when hoverText is provided', () => {
      // Radix tooltips portal their content and only render on trigger,
      // so we just verify the component renders without error
      expect(() =>
        render(<PaletteItem text="Test Item" hoverText="Hover description" />),
      ).not.toThrow();
    });

    it('renders without error when hoverText is not provided', () => {
      expect(() => render(<PaletteItem text="Test Item" />)).not.toThrow();
    });
  });
});

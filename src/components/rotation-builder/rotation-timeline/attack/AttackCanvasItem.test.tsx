import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

const { itemReference, mockUseSortable } = vi.hoisted(() => ({
  itemReference: vi.fn(),
  mockUseSortable: vi.fn(),
}));

vi.mock('@dnd-kit/react/sortable', () => ({
  useSortable: mockUseSortable,
}));

vi.mock('@/components/common/CapabilityHoverCard', () => ({
  CapabilityHoverCard: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('@/components/common/CapabilityIcon', () => ({
  CapabilityIconDisplay: () => <div data-testid="capability-icon" />,
}));

vi.mock('@/components/common/EntityIcon', () => ({
  EntityIconDisplay: () => <div data-testid="entity-icon" />,
}));

vi.mock('@/components/common/ParameterConfigurationDialog', () => ({
  ParameterConfigurationDialog: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('@/components/common/TrashButton', () => ({
  TrashButton: ({ onRemove }: { onRemove: () => void }) => (
    <button onClick={onRemove} type="button">
      remove
    </button>
  ),
}));

const { AttackCanvasItem } = await import('./AttackCanvasItem');

describe('AttackCanvasItem', () => {
  const makeAttack = (parameters: unknown[] = []) =>
    ({
      instanceId: 'attack-1',
      name: 'Basic Attack',
      characterIconUrl: '/character.png',
      iconUrl: '/attack.png',
      parameters,
    }) as any;

  it('attaches sortable behavior to the outer slot while keeping the card nested', () => {
    itemReference.mockReset();
    mockUseSortable.mockReturnValue({
      sortable: {},
      isDragging: false,
      isDropping: false,
      isDragSource: false,
      isDropTarget: false,
      handleRef: vi.fn(),
      ref: itemReference,
    });

    const { container } = render(
      <AttackCanvasItem
        attack={makeAttack()}
        index={0}
        onRemove={vi.fn()}
        isDialogClickable={false}
      />,
    );

    const slot = screen.getByTestId('attack-canvas-item');
    const card = screen.getByTestId('attack-sort-card');

    expect(container.firstElementChild).toBe(slot);
    expect(slot).toContainElement(card);
    expect(mockUseSortable).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'attack-1',
        index: 0,
        group: 'attack-canvas',
        type: 'canvas-attack',
        accept: 'canvas-attack',
      }),
    );
    expect(itemReference).toHaveBeenCalledWith(slot);
    expect(slot).not.toBe(card);
  });

  it('adds a warning border when a configurable attack is not configured', () => {
    mockUseSortable.mockReturnValue({
      sortable: {},
      isDragging: false,
      isDropping: false,
      isDragSource: false,
      isDropTarget: false,
      handleRef: vi.fn(),
      ref: itemReference,
    });

    render(
      <AttackCanvasItem
        attack={makeAttack([{ id: '0', minimum: 0, maximum: 100, value: undefined }])}
        index={0}
        onRemove={vi.fn()}
        isDialogClickable={true}
      />,
    );

    expect(screen.getByTestId('attack-sort-card')).toHaveClass('border-warning');
  });

  it('does not add a warning border when a configurable attack is configured', () => {
    mockUseSortable.mockReturnValue({
      sortable: {},
      isDragging: false,
      isDropping: false,
      isDragSource: false,
      isDropTarget: false,
      handleRef: vi.fn(),
      ref: itemReference,
    });

    render(
      <AttackCanvasItem
        attack={makeAttack([{ id: '0', minimum: 0, maximum: 100, value: 10 }])}
        index={0}
        onRemove={vi.fn()}
        isDialogClickable={true}
      />,
    );

    expect(screen.getByTestId('attack-sort-card')).not.toHaveClass('border-warning');
  });
});

import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BuffCanvas } from './BuffCanvas';

const { mockUseTeamModifierInstances } = vi.hoisted(() => ({
  mockUseTeamModifierInstances: vi.fn(),
}));

vi.mock('@dnd-kit/react', () => ({
  useDroppable: () => ({
    ref: vi.fn(),
    isDropTarget: false,
  }),
}));

vi.mock('react-grid-layout', () => ({
  default: ({ children }: { children?: ReactNode }) => (
    <div data-testid="mock-grid-layout">{children}</div>
  ),
}));

vi.mock('react-grid-layout/core', () => ({
  absoluteStrategy: {},
}));

vi.mock('@/hooks/useCanvasLayout', () => ({
  useCanvasLayout: () => ({
    layout: { width: 640 },
    isInteracting: false,
  }),
}));

vi.mock('@/hooks/useTeamModifierInstances', () => ({
  useTeamModifierInstances: mockUseTeamModifierInstances,
}));

vi.mock('./BuffCanvasItem', () => ({
  BaseBuffCanvasItem: ({ name }: { name?: string }) => (
    <div data-testid="buff-drop-preview">{name ?? 'Drop Buff'}</div>
  ),
  BuffCanvasItem: () => <div data-testid="buff-canvas-item" />,
}));

describe('BuffCanvas', () => {
  beforeEach(() => {
    mockUseTeamModifierInstances.mockReturnValue({
      buffs: [
        {
          instanceId: 'buff-1',
        },
      ],
    });
  });

  it('renders the empty-state message without the grid layout when there are no buffs or preview', () => {
    mockUseTeamModifierInstances.mockReturnValue({
      buffs: [],
    });

    render(<BuffCanvas />);

    expect(
      screen.getByText('Drag buffs here to align with attacks'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('mock-grid-layout')).not.toBeInTheDocument();
    expect(screen.queryByTestId('buff-canvas-item')).not.toBeInTheDocument();
    expect(screen.queryByTestId('buff-drop-preview')).not.toBeInTheDocument();
  });

  it('wraps the preview in a grid child container like real buff items', () => {
    const { getByTestId } = render(
      <BuffCanvas
        previewLayout={{
          x: 2,
          y: 1,
          w: 6,
          h: 1,
          name: 'Preview Buff',
        }}
      />,
    );

    const grid = getByTestId('mock-grid-layout');
    const preview = screen.getByTestId('buff-drop-preview');
    const previewWrapper = preview.parentElement;

    expect(preview).toHaveTextContent('Preview Buff');
    expect(previewWrapper?.parentElement).toBe(grid);
    expect(previewWrapper).not.toHaveAttribute('data-testid', 'buff-drop-preview');
  });
});

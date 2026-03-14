import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { BuffCanvas } from './BuffCanvas';

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
  useTeamModifierInstances: () => ({
    buffs: [
      {
        instanceId: 'buff-1',
      },
    ],
  }),
}));

vi.mock('./BuffCanvasItem', () => ({
  BaseBuffCanvasItem: ({ name }: { name?: string }) => (
    <div data-testid="buff-drop-preview">{name ?? 'Drop Buff'}</div>
  ),
  BuffCanvasItem: () => <div data-testid="buff-canvas-item" />,
}));

describe('BuffCanvas', () => {
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

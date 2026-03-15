import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SIDEBAR_ATTACK_DRAG_TYPE,
  SIDEBAR_BUFF_DRAG_TYPE,
} from '@/components/rotation-builder/rotation-timeline/constants';

import { BuffCanvas } from './BuffCanvas';

const { capturedDroppableProperties, mockUseTeamModifierInstances } = vi.hoisted(
  () => ({
    capturedDroppableProperties: {
      current: undefined as
        | {
            accept: (source: { type: string }) => boolean;
            id: string;
          }
        | undefined,
    },
    mockUseTeamModifierInstances: vi.fn(),
  }),
);

vi.mock('@dnd-kit/react', () => ({
  useDroppable: (properties: {
    accept: (source: { type: string }) => boolean;
    id: string;
  }) => {
    capturedDroppableProperties.current = properties;
    return {
      ref: vi.fn(),
      isDropTarget: false,
    };
  },
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

  it('registers the canvas as a droppable for both sidebar drag types', () => {
    render(<BuffCanvas />);

    expect(
      capturedDroppableProperties.current?.accept({
        type: SIDEBAR_ATTACK_DRAG_TYPE,
      }),
    ).toBe(true);
    expect(
      capturedDroppableProperties.current?.accept({
        type: SIDEBAR_BUFF_DRAG_TYPE,
      }),
    ).toBe(true);
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

  it('keeps the buff lane vertically scrollable at the shared timeline width', () => {
    const { container } = render(<BuffCanvas />);

    const scrollArea = container.querySelector('[data-slot="scroll-area"]');
    const grid = screen.getByTestId('mock-grid-layout');
    const timelineLane = scrollArea?.parentElement as HTMLDivElement | null;

    expect(scrollArea).toBeInTheDocument();
    expect(scrollArea).toHaveClass('flex-1');
    expect(grid).toBeInTheDocument();
    expect(timelineLane).toHaveStyle({ width: '640px' });
  });
});

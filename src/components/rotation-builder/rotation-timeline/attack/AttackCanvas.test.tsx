import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  SIDEBAR_ATTACK_DRAG_TYPE,
  SIDEBAR_BUFF_DRAG_TYPE,
} from '@/components/rotation-builder/rotation-timeline/constants';

const {
  capturedDroppableProperties,
  mockUseDroppable,
  mockUseStore,
  mockUseTeamAttackInstances,
} = vi.hoisted(() => ({
  capturedDroppableProperties: {
    current: undefined as
      | {
          accept: (source: { type: string }) => boolean;
          id: string;
        }
      | undefined,
  },
  mockUseDroppable: vi.fn(),
  mockUseStore: vi.fn(),
  mockUseTeamAttackInstances: vi.fn(),
}));

vi.mock('@dnd-kit/react', () => ({
  useDroppable: mockUseDroppable,
}));

vi.mock('@/hooks/useTeamAttackInstances', () => ({
  useTeamAttackInstances: mockUseTeamAttackInstances,
}));

vi.mock('@/store', () => ({
  useStore: mockUseStore,
}));

vi.mock('./AttackCanvasItem', () => ({
  BaseAttackCanvasItem: () => <div data-testid="attack-drop-preview" />,
  AttackCanvasItem: ({
    attack,
    index,
  }: {
    attack: { instanceId: string; name: string };
    index: number;
  }) => (
    <div data-testid="attack-canvas-item">
      {attack.name}:{index}
    </div>
  ),
}));

const { AttackCanvas } = await import('./AttackCanvas');

describe('AttackCanvas', () => {
  it('registers the canvas as a droppable for both sidebar drag types', () => {
    mockUseDroppable.mockImplementation((properties) => {
      capturedDroppableProperties.current = properties;
      return {
        ref: vi.fn(),
        isDropTarget: false,
      };
    });
    mockUseTeamAttackInstances.mockReturnValue({
      attacks: [],
    });
    mockUseStore.mockImplementation(
      (selector: (state: { removeAttack: () => void }) => unknown) =>
        selector({ removeAttack: vi.fn() }),
    );

    render(<AttackCanvas />);

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

  it('renders the empty-state message without the attack row when there are no attacks or preview', () => {
    mockUseDroppable.mockReturnValue({
      ref: vi.fn(),
      isDropTarget: false,
    });
    mockUseTeamAttackInstances.mockReturnValue({
      attacks: [],
    });
    mockUseStore.mockImplementation(
      (selector: (state: { removeAttack: () => void }) => unknown) =>
        selector({ removeAttack: vi.fn() }),
    );

    render(<AttackCanvas />);

    expect(
      screen.getByText('Drag attacks here to start building your rotation.'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('attack-canvas-item')).not.toBeInTheDocument();
    expect(screen.queryByTestId('attack-drop-preview')).not.toBeInTheDocument();
  });

  it('renders the preview at the requested insert index', () => {
    mockUseDroppable.mockReturnValue({
      ref: vi.fn(),
      isDropTarget: false,
    });
    mockUseTeamAttackInstances.mockReturnValue({
      attacks: [
        { instanceId: 'attack-1', name: 'Attack 1' },
        { instanceId: 'attack-2', name: 'Attack 2' },
        { instanceId: 'attack-3', name: 'Attack 3' },
      ],
    });
    mockUseStore.mockImplementation(
      (selector: (state: { removeAttack: () => void }) => unknown) =>
        selector({ removeAttack: vi.fn() }),
    );

    render(<AttackCanvas previewInsertIndex={1} />);

    const row = screen.getByTestId('attack-canvas-row');

    const children = within(row).getAllByTestId(
      /attack-canvas-item|attack-drop-preview/,
    );

    expect(children.map((child) => child.dataset.testid)).toEqual([
      'attack-canvas-item',
      'attack-drop-preview',
      'attack-canvas-item',
      'attack-canvas-item',
    ]);
    expect(screen.getAllByTestId('attack-canvas-item')[0]).toHaveTextContent(
      'Attack 1:0',
    );
    expect(screen.getAllByTestId('attack-canvas-item')[1]).toHaveTextContent(
      'Attack 2:1',
    );
  });
});

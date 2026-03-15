import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ATTACK_CANVAS_DROP_ID,
  ATTACK_SORTABLE_DRAG_TYPE,
  BUFF_CANVAS_DROP_ID,
  BUFF_ROW_HEIGHT,
  COLUMN_STEP,
  INITIAL_BUFF_LAYOUT,
  ROW_GAP,
  SIDEBAR_ATTACK_DRAG_TYPE,
  SIDEBAR_BUFF_DRAG_TYPE,
} from '@/components/rotation-builder/rotation-timeline/constants';
import type { AttackInstance, Capability } from '@/schemas/rotation';
import { useStore } from '@/store';

import { RotationBuilder } from './RotationTimelineBuilder';

const {
  capturedAttackCanvasProperties,
  capturedBuffCanvasProperties,
  capturedOnDragEnd,
  capturedOnDragMove,
  capturedOnDragOver,
  capturedSidebarProperties,
  dragOverlaySource,
  mockIsSortable,
  toastError,
  toastSuccess,
} = vi.hoisted(() => ({
  capturedAttackCanvasProperties: {
    current: undefined as { previewInsertIndex?: number } | undefined,
  },
  capturedBuffCanvasProperties: {
    current: undefined as
      | { previewLayout?: { x: number; y: number; w: number; h: number } }
      | undefined,
  },
  capturedOnDragEnd: {
    current: undefined as ((event: any) => void) | undefined,
  },
  capturedOnDragMove: {
    current: undefined as ((event: any) => void) | undefined,
  },
  capturedOnDragOver: {
    current: undefined as ((event: any) => void) | undefined,
  },
  capturedSidebarProperties: {
    current: undefined as
      | {
          onClickAttack?: (attack: Capability) => void;
          onClickBuff?: (buff: Capability) => void;
        }
      | undefined,
  },
  dragOverlaySource: {
    current: undefined as any,
  },
  mockIsSortable: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('@dnd-kit/react', () => ({
  DragOverlay: ({
    children,
  }: {
    children?: ReactNode | ((source: any) => ReactNode);
  }) => (
    <div data-testid="drag-overlay">
      {typeof children === 'function'
        ? dragOverlaySource.current
          ? children(dragOverlaySource.current)
          : undefined
        : children}
    </div>
  ),
  DragDropProvider: ({
    children,
    onDragEnd,
    onDragMove,
    onDragOver,
  }: {
    children: ReactNode;
    onDragEnd?: (event: unknown) => void;
    onDragMove?: (event: unknown) => void;
    onDragOver?: (event: unknown) => void;
  }) => {
    capturedOnDragEnd.current = onDragEnd as typeof capturedOnDragEnd.current;
    capturedOnDragMove.current = onDragMove as typeof capturedOnDragMove.current;
    capturedOnDragOver.current = onDragOver as typeof capturedOnDragOver.current;
    return <div data-testid="drag-drop-provider">{children}</div>;
  },
}));

vi.mock('@dnd-kit/react/sortable', () => ({
  isSortable: mockIsSortable,
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastError,
    success: toastSuccess,
  },
}));

vi.mock('@/components/ui/resizable', () => ({
  ResizableHandle: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  ResizablePanel: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  ResizablePanelGroup: ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <div data-testid="separator" />,
}));

vi.mock('./CapabilitySidebar', () => ({
  CapabilitySidebar: (properties: {
    onClickAttack?: (attack: Capability) => void;
    onClickBuff?: (buff: Capability) => void;
  }) => {
    capturedSidebarProperties.current = properties;
    return <div data-testid="capability-sidebar" />;
  },
}));

vi.mock('./RotationCanvasHeader', () => ({
  RotationCanvasHeader: () => <div data-testid="rotation-canvas-header" />,
}));

vi.mock('./TimelinePanWrapper', () => ({
  TimelinePanWrapper: ({ children }: { children?: ReactNode }) => (
    <div data-testid="timeline-pan-wrapper">{children}</div>
  ),
}));

vi.mock('./attack/AttackCanvas', () => ({
  AttackCanvas: (properties: { previewInsertIndex?: number }) => {
    capturedAttackCanvasProperties.current = properties;
    return <div data-testid="attack-canvas" />;
  },
}));

vi.mock('./buff/BuffCanvas', () => ({
  BuffCanvas: (properties: {
    previewLayout?: { x: number; y: number; w: number; h: number };
  }) => {
    capturedBuffCanvasProperties.current = properties;
    return <div data-testid="buff-canvas" />;
  },
}));

const makeCapability = (id: number): Capability => ({
  id,
  characterId: 1000 + id,
  entityId: 2000 + id,
  parameterValues: [],
});

const makeStoredAttack = (instanceId: string): AttackInstance => ({
  instanceId,
  id: 1,
  characterId: 1,
  parameterValues: [],
});

const makeDropTargetElement = (left = 100, top = 40, width = 800, height = 400) =>
  ({
    getBoundingClientRect: () => ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON: () => ({}),
    }),
  }) as unknown as Element;

const makeShape = (left: number, top: number, width = 80, height = 40) => ({
  current: {
    boundingRectangle: {
      left,
      top,
      width,
      height,
    },
  },
});

const emitDragEnd = (event: unknown) => {
  if (!capturedOnDragEnd.current) {
    throw new Error('Expected RotationBuilder to register an onDragEnd handler');
  }

  act(() => {
    capturedOnDragEnd.current?.(event);
  });
};

const emitDragOver = (event: unknown) => {
  if (!capturedOnDragOver.current) {
    throw new Error('Expected RotationBuilder to register an onDragOver handler');
  }

  act(() => {
    capturedOnDragOver.current?.(event);
  });
};

const emitDragMove = (event: unknown) => {
  if (!capturedOnDragMove.current) {
    throw new Error('Expected RotationBuilder to register an onDragMove handler');
  }

  act(() => {
    capturedOnDragMove.current?.(event);
  });
};

describe('RotationBuilder', () => {
  let addAttack: ReturnType<typeof vi.fn>;
  let addBuff: ReturnType<typeof vi.fn>;
  let reorderAttacks: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    useStore.persist.clearStorage();
    capturedAttackCanvasProperties.current = undefined;
    capturedBuffCanvasProperties.current = undefined;
    capturedOnDragEnd.current = undefined;
    capturedOnDragMove.current = undefined;
    capturedOnDragOver.current = undefined;
    capturedSidebarProperties.current = undefined;
    dragOverlaySource.current = undefined;
    mockIsSortable.mockReset().mockReturnValue(false);
    toastError.mockReset();
    toastSuccess.mockReset();

    addAttack = vi.fn();
    addBuff = vi.fn();
    reorderAttacks = vi.fn();

    useStore.setState({
      attacks: [],
      buffs: [],
      addAttack,
      addBuff,
      reorderAttacks,
    } as Partial<ReturnType<typeof useStore.getState>>);
  });

  it('shows an attack drop preview while dragging over the attack canvas', () => {
    useStore.setState({
      attacks: [
        makeStoredAttack('attack-1'),
        makeStoredAttack('attack-2'),
        makeStoredAttack('attack-3'),
      ],
    } as Partial<ReturnType<typeof useStore.getState>>);

    render(<RotationBuilder />);

    emitDragOver({
      operation: {
        source: {
          type: SIDEBAR_ATTACK_DRAG_TYPE,
          data: { kind: 'sidebar-capability', capability: makeCapability(20) },
        },
        target: {
          id: ATTACK_CANVAS_DROP_ID,
          element: makeDropTargetElement(),
        },
        shape: makeShape(248, 60),
      },
    });

    expect(capturedAttackCanvasProperties.current).toEqual({
      previewInsertIndex: 2,
    });
    expect(capturedBuffCanvasProperties.current).toEqual({
      previewLayout: undefined,
    });
  });

  it('updates the attack drop preview continuously while dragging within the same canvas', () => {
    useStore.setState({
      attacks: [
        makeStoredAttack('attack-1'),
        makeStoredAttack('attack-2'),
        makeStoredAttack('attack-3'),
        makeStoredAttack('attack-4'),
      ],
    } as Partial<ReturnType<typeof useStore.getState>>);

    render(<RotationBuilder />);

    const targetElement = makeDropTargetElement();
    const source = {
      type: SIDEBAR_ATTACK_DRAG_TYPE,
      data: { kind: 'sidebar-capability', capability: makeCapability(22) },
    };

    emitDragOver({
      operation: {
        source,
        target: {
          id: ATTACK_CANVAS_DROP_ID,
          element: targetElement,
        },
        shape: makeShape(248, 60),
      },
    });

    expect(capturedAttackCanvasProperties.current).toEqual({
      previewInsertIndex: 2,
    });

    emitDragMove({
      nativeEvent: new MouseEvent('pointermove', {
        clientX: 470,
        clientY: 60,
      }),
      operation: {
        source,
        target: {
          id: ATTACK_CANVAS_DROP_ID,
          element: targetElement,
        },
        shape: makeShape(248, 60),
      },
    });

    expect(capturedAttackCanvasProperties.current).toEqual({
      previewInsertIndex: 4,
    });
  });

  it('shows a buff drop preview while dragging over the buff canvas and clears it on drag end', () => {
    useStore.setState({
      attacks: Array.from({ length: 8 }, (_, index) =>
        makeStoredAttack(`attack-${index + 1}`),
      ),
    } as Partial<ReturnType<typeof useStore.getState>>);

    render(<RotationBuilder />);

    emitDragOver({
      operation: {
        source: {
          type: SIDEBAR_BUFF_DRAG_TYPE,
          data: { kind: 'sidebar-capability', capability: makeCapability(21) },
        },
        target: {
          id: BUFF_CANVAS_DROP_ID,
          element: makeDropTargetElement(100, 40, 800),
        },
        shape: makeShape(455, 152),
      },
    });

    expect(capturedBuffCanvasProperties.current).toEqual({
      previewLayout: {
        ...INITIAL_BUFF_LAYOUT,
        x: 2,
        y: 2,
      },
    });
    expect(capturedAttackCanvasProperties.current).toEqual({
      previewInsertIndex: undefined,
    });

    emitDragEnd({
      canceled: true,
      operation: {
        source: undefined,
        target: undefined,
      },
    });

    expect(capturedAttackCanvasProperties.current).toEqual({
      previewInsertIndex: undefined,
    });
    expect(capturedBuffCanvasProperties.current).toEqual({
      previewLayout: undefined,
    });
  });

  it('updates the buff drop preview continuously while dragging within the same canvas', () => {
    useStore.setState({
      attacks: Array.from({ length: 8 }, (_, index) =>
        makeStoredAttack(`attack-${index + 1}`),
      ),
    } as Partial<ReturnType<typeof useStore.getState>>);

    render(<RotationBuilder />);

    const targetElement = makeDropTargetElement(100, 40, 800);
    const source = {
      type: SIDEBAR_BUFF_DRAG_TYPE,
      data: { kind: 'sidebar-capability', capability: makeCapability(23) },
    };

    emitDragOver({
      operation: {
        source,
        target: {
          id: BUFF_CANVAS_DROP_ID,
          element: targetElement,
        },
        shape: makeShape(220, 90),
      },
    });

    expect(capturedBuffCanvasProperties.current).toEqual({
      previewLayout: {
        ...INITIAL_BUFF_LAYOUT,
        x: 1,
        y: 1,
      },
    });

    emitDragMove({
      nativeEvent: new MouseEvent('pointermove', {
        clientX: 470,
        clientY: 170,
      }),
      operation: {
        source,
        target: {
          id: BUFF_CANVAS_DROP_ID,
          element: targetElement,
        },
        shape: makeShape(220, 90),
      },
    });

    expect(capturedBuffCanvasProperties.current).toEqual({
      previewLayout: {
        ...INITIAL_BUFF_LAYOUT,
        x: 2,
        y: 2,
      },
    });
  });

  it('adds attacks when a sidebar attack is dropped into the attack canvas', () => {
    useStore.setState({
      attacks: [
        makeStoredAttack('attack-1'),
        makeStoredAttack('attack-2'),
        makeStoredAttack('attack-3'),
        makeStoredAttack('attack-4'),
      ],
    } as Partial<ReturnType<typeof useStore.getState>>);

    render(<RotationBuilder />);

    const attack = makeCapability(1);
    const targetElement = makeDropTargetElement();

    emitDragEnd({
      canceled: false,
      nativeEvent: new MouseEvent('pointerup', {
        clientX: 230,
        clientY: 80,
      }),
      operation: {
        source: {
          type: SIDEBAR_ATTACK_DRAG_TYPE,
          data: { kind: 'sidebar-capability', capability: attack },
        },
        target: { id: ATTACK_CANVAS_DROP_ID, element: targetElement },
      },
    });

    expect(addAttack).toHaveBeenCalledTimes(1);
    expect(addAttack).toHaveBeenCalledWith(attack, 1);
    expect(addBuff).not.toHaveBeenCalled();
    expect(reorderAttacks).not.toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith('Attack added to the rotation timeline.');
  });

  it('adds buffs when a sidebar buff is dropped into the buff canvas', () => {
    useStore.setState({
      attacks: Array.from({ length: 8 }, (_, index) =>
        makeStoredAttack(`attack-${index + 1}`),
      ),
    } as Partial<ReturnType<typeof useStore.getState>>);

    render(<RotationBuilder />);

    const buff = makeCapability(2);
    const targetElement = makeDropTargetElement();

    emitDragEnd({
      canceled: false,
      nativeEvent: new MouseEvent('pointerup', {
        clientX: 320,
        clientY: 160,
      }),
      operation: {
        source: {
          type: SIDEBAR_BUFF_DRAG_TYPE,
          data: { kind: 'sidebar-capability', capability: buff },
        },
        target: { id: BUFF_CANVAS_DROP_ID, element: targetElement },
      },
    });

    expect(addBuff).toHaveBeenCalledTimes(1);
    expect(addBuff).toHaveBeenCalledWith(buff, {
      ...INITIAL_BUFF_LAYOUT,
      x: Math.floor((320 - 100) / COLUMN_STEP),
      y: Math.floor((160 - 40) / (BUFF_ROW_HEIGHT + ROW_GAP)),
    });
    expect(addAttack).not.toHaveBeenCalled();
    expect(reorderAttacks).not.toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith('Buff added to the alignment canvas.');
  });

  it('shows a success toast when an attack is added from the palette', () => {
    render(<RotationBuilder />);

    const attack = makeCapability(30);
    capturedSidebarProperties.current?.onClickAttack?.(attack);

    expect(addAttack).toHaveBeenCalledWith(attack, undefined);
    expect(toastSuccess).toHaveBeenCalledWith('Attack added to the rotation timeline.');
  });

  it('shows a success toast when a buff is added from the palette', () => {
    render(<RotationBuilder />);

    const buff = makeCapability(31);
    capturedSidebarProperties.current?.onClickBuff?.(buff);

    expect(addBuff).toHaveBeenCalledWith(buff, INITIAL_BUFF_LAYOUT);
    expect(toastSuccess).toHaveBeenCalledWith('Buff added to the alignment canvas.');
  });

  it('shows an error toast when an attack is dropped on the buff canvas', () => {
    render(<RotationBuilder />);

    emitDragEnd({
      canceled: false,
      operation: {
        source: {
          type: SIDEBAR_ATTACK_DRAG_TYPE,
          data: { kind: 'sidebar-capability', capability: makeCapability(40) },
        },
        target: {
          id: BUFF_CANVAS_DROP_ID,
          element: makeDropTargetElement(),
        },
      },
    });

    expect(addAttack).not.toHaveBeenCalled();
    expect(addBuff).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith(
      'Attacks can only be dropped on the attack timeline.',
    );
  });

  it('shows an error toast when a buff is dropped on the attack canvas', () => {
    render(<RotationBuilder />);

    emitDragEnd({
      canceled: false,
      operation: {
        source: {
          type: SIDEBAR_BUFF_DRAG_TYPE,
          data: { kind: 'sidebar-capability', capability: makeCapability(41) },
        },
        target: {
          id: ATTACK_CANVAS_DROP_ID,
          element: makeDropTargetElement(),
        },
      },
    });

    expect(addAttack).not.toHaveBeenCalled();
    expect(addBuff).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith(
      'Buffs can only be dropped on the buff alignment canvas.',
    );
  });

  it('clamps attack insertion to the start and end of the canvas', () => {
    useStore.setState({
      attacks: [
        makeStoredAttack('attack-1'),
        makeStoredAttack('attack-2'),
        makeStoredAttack('attack-3'),
      ],
    } as Partial<ReturnType<typeof useStore.getState>>);

    render(<RotationBuilder />);

    const attack = makeCapability(9);
    const targetElement = makeDropTargetElement();

    emitDragEnd({
      canceled: false,
      nativeEvent: new MouseEvent('pointerup', {
        clientX: 20,
        clientY: 80,
      }),
      operation: {
        source: {
          type: SIDEBAR_ATTACK_DRAG_TYPE,
          data: { kind: 'sidebar-capability', capability: attack },
        },
        target: { id: ATTACK_CANVAS_DROP_ID, element: targetElement },
      },
    });

    emitDragEnd({
      canceled: false,
      nativeEvent: new MouseEvent('pointerup', {
        clientX: 2000,
        clientY: 80,
      }),
      operation: {
        source: {
          type: SIDEBAR_ATTACK_DRAG_TYPE,
          data: { kind: 'sidebar-capability', capability: attack },
        },
        target: { id: ATTACK_CANVAS_DROP_ID, element: targetElement },
      },
    });

    expect(addAttack).toHaveBeenNthCalledWith(1, attack, 0);
    expect(addAttack).toHaveBeenNthCalledWith(2, attack, 3);
  });

  it('uses the dragged shape center when no native event is available for attack drops', () => {
    useStore.setState({
      attacks: [
        makeStoredAttack('attack-1'),
        makeStoredAttack('attack-2'),
        makeStoredAttack('attack-3'),
        makeStoredAttack('attack-4'),
      ],
    } as Partial<ReturnType<typeof useStore.getState>>);

    render(<RotationBuilder />);

    const attack = makeCapability(10);
    const targetElement = makeDropTargetElement();

    emitDragEnd({
      canceled: false,
      operation: {
        source: {
          type: SIDEBAR_ATTACK_DRAG_TYPE,
          data: { kind: 'sidebar-capability', capability: attack },
        },
        target: { id: ATTACK_CANVAS_DROP_ID, element: targetElement },
        shape: makeShape(345, 60),
      },
    });

    expect(addAttack).toHaveBeenCalledWith(attack, 3);
  });

  it('reorders attacks within the attack canvas using sortable indices', () => {
    render(<RotationBuilder />);

    mockIsSortable.mockReturnValueOnce(true);

    emitDragEnd({
      canceled: false,
      operation: {
        source: {
          type: ATTACK_SORTABLE_DRAG_TYPE,
          initialGroup: ATTACK_CANVAS_DROP_ID,
          initialIndex: 3,
          group: ATTACK_CANVAS_DROP_ID,
          index: 1,
          data: { kind: 'canvas-attack', instanceId: 'attack-4' },
        },
        target: {
          id: 'attack-2',
        },
      },
    });

    expect(reorderAttacks).toHaveBeenCalledTimes(1);
    expect(reorderAttacks).toHaveBeenCalledWith(3, 1);
    expect(addAttack).not.toHaveBeenCalled();
    expect(addBuff).not.toHaveBeenCalled();
  });

  it('renders a drag overlay preview for sidebar capability drags', () => {
    dragOverlaySource.current = {
      type: SIDEBAR_ATTACK_DRAG_TYPE,
      data: {
        kind: 'sidebar-capability',
        capability: {
          ...makeCapability(30),
          name: 'Basic Attack',
          iconUrl: '/attack.png',
          characterIconUrl: '/character.png',
        },
      },
    };

    render(<RotationBuilder />);

    expect(screen.getByTestId('drag-overlay')).toHaveTextContent('Basic Attack');
  });

  it('ignores non-sidebar buff interactions after insertion so RGL owns them', () => {
    useStore.setState({
      attacks: Array.from({ length: 8 }, (_, index) =>
        makeStoredAttack(`attack-${index + 1}`),
      ),
    } as Partial<ReturnType<typeof useStore.getState>>);

    render(<RotationBuilder />);

    const buff = makeCapability(3);
    const targetElement = makeDropTargetElement(100, 40, 800);

    emitDragEnd({
      canceled: false,
      nativeEvent: new MouseEvent('pointerup', {
        clientX: 420,
        clientY: 92,
      }),
      operation: {
        source: {
          type: SIDEBAR_BUFF_DRAG_TYPE,
          data: { kind: 'sidebar-capability', capability: buff },
        },
        target: { id: BUFF_CANVAS_DROP_ID, element: targetElement },
      },
    });

    emitDragEnd({
      canceled: false,
      operation: {
        source: {
          type: 'grid-buff',
          data: { kind: 'grid-buff', instanceId: 'buff-1' },
        },
        target: { id: BUFF_CANVAS_DROP_ID, element: targetElement },
      },
    });

    expect(addBuff).toHaveBeenCalledTimes(1);
    expect(addBuff).toHaveBeenCalledWith(buff, {
      ...INITIAL_BUFF_LAYOUT,
      x: 2,
      y: Math.floor((92 - 40) / (BUFF_ROW_HEIGHT + ROW_GAP)),
    });
    expect(addAttack).not.toHaveBeenCalled();
    expect(reorderAttacks).not.toHaveBeenCalled();
  });

  it('clamps initial buff placement so a new buff stays within the grid width', () => {
    useStore.setState({
      attacks: Array.from({ length: 6 }, (_, index) =>
        makeStoredAttack(`attack-${index + 1}`),
      ),
    } as Partial<ReturnType<typeof useStore.getState>>);

    render(<RotationBuilder />);

    const buff = makeCapability(11);
    const targetElement = makeDropTargetElement(100, 40, 600);

    emitDragEnd({
      canceled: false,
      nativeEvent: new MouseEvent('pointerup', {
        clientX: 2000,
        clientY: 45,
      }),
      operation: {
        source: {
          type: SIDEBAR_BUFF_DRAG_TYPE,
          data: { kind: 'sidebar-capability', capability: buff },
        },
        target: { id: BUFF_CANVAS_DROP_ID, element: targetElement },
      },
    });

    expect(addBuff).toHaveBeenCalledWith(buff, {
      ...INITIAL_BUFF_LAYOUT,
      x: 0,
      y: 0,
    });
  });

  it('uses the dragged shape center when no native event is available for buff drops', () => {
    useStore.setState({
      attacks: Array.from({ length: 9 }, (_, index) =>
        makeStoredAttack(`attack-${index + 1}`),
      ),
    } as Partial<ReturnType<typeof useStore.getState>>);

    render(<RotationBuilder />);

    const buff = makeCapability(12);
    const targetElement = makeDropTargetElement(100, 40, 900);

    emitDragEnd({
      canceled: false,
      operation: {
        source: {
          type: SIDEBAR_BUFF_DRAG_TYPE,
          data: { kind: 'sidebar-capability', capability: buff },
        },
        target: { id: BUFF_CANVAS_DROP_ID, element: targetElement },
        shape: makeShape(455, 152),
      },
    });

    expect(addBuff).toHaveBeenCalledWith(buff, {
      ...INITIAL_BUFF_LAYOUT,
      x: 3,
      y: 2,
    });
  });
});

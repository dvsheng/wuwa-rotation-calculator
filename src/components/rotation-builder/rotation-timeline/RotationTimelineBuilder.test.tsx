import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ATTACK_CANVAS_DROP_ID,
  BUFF_CANVAS_DROP_ID,
  BUFF_ROW_HEIGHT,
  COLUMN_MARGIN,
  COLUMN_STEP,
  COLUMN_WIDTH,
  INITIAL_BUFF_LAYOUT,
} from '@/components/rotation-builder/rotation-timeline/constants';
import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';
import { useStore } from '@/store';

import { buildRotationTimelineTeamDetails } from './RotationTimelineBuilder.test.fixtures';

const dndHarness = vi.hoisted(() => ({
  dragEndHandler: {
    current: undefined as ((event: unknown) => void) | undefined,
  },
  mockUseTeamDetails: vi.fn(),
  sidebarSources: new Map<
    number,
    {
      data: {
        capability?: { id?: number };
        kind?: string;
      };
      id: string;
      type: string;
    }
  >(),
}));

vi.mock('@/components/common/CapabilityHoverCard', () => ({
  CapabilityHoverCard: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('@/hooks/useCharacter', async () => {
  const actual = await vi.importActual('@/hooks/useCharacter');
  return {
    ...actual,
    useTeamCharacters: vi.fn(() => [
      { id: 463, index: 0, name: 'Mornye' },
      { id: 484, index: 1, name: 'Shorekeeper' },
    ]),
  };
});

vi.mock('@/hooks/useTeamDetails', async () => {
  const actual = await vi.importActual('@/hooks/useTeamDetails');
  return {
    ...actual,
    useTeamDetails: dndHarness.mockUseTeamDetails,
  };
});

vi.mock('@dnd-kit/react', () => ({
  DragDropProvider: ({
    children,
    onDragEnd,
  }: {
    children: ReactNode;
    onDragEnd?: (event: unknown) => void;
  }) => {
    dndHarness.dragEndHandler.current = onDragEnd;
    return <div data-testid="drag-drop-provider">{children}</div>;
  },
  DragOverlay: () => <></>,
  useDraggable: (properties: {
    data: {
      capability?: { id?: number };
      kind?: string;
    };
    id: string;
    type: string;
  }) => {
    const capabilityId = properties.data.capability?.id;
    if (
      properties.data.kind === 'sidebar-capability' &&
      typeof capabilityId === 'number'
    ) {
      dndHarness.sidebarSources.set(capabilityId, properties);
    }

    return {
      ref: vi.fn(),
      isDragging: false,
    };
  },
  useDroppable: () => ({
    ref: vi.fn(),
    isDropTarget: false,
  }),
  useDragOperation: () => ({
    source: undefined,
    target: undefined,
  }),
}));

vi.mock('@dnd-kit/react/sortable', () => ({
  isSortable: () => false,
  useSortable: () => ({
    isDragging: false,
    ref: vi.fn(),
  }),
}));

vi.mock('react-grid-layout', async () => {
  const React = await import('react');
  return {
    __esModule: true,
    default: ({
      children,
      className,
      layout = [],
      width,
    }: {
      children?: ReactNode;
      className?: string;
      layout?: Array<{ h: number; i: string; w: number; x: number; y: number }>;
      width?: number;
    }) => (
      <div data-width={width} className={className}>
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child;

          const childKey = String(child.key);
          const gridItem = layout.find(
            (item) => childKey === item.i || childKey.endsWith(item.i),
          );

          return (
            <div
              data-grid-h={gridItem?.h}
              data-grid-id={gridItem?.i}
              data-grid-w={gridItem?.w}
              data-grid-x={gridItem?.x}
              data-grid-y={gridItem?.y}
              style={
                gridItem
                  ? {
                      height: `${gridItem.h * BUFF_ROW_HEIGHT}px`,
                      width: `${
                        gridItem.w * COLUMN_WIDTH +
                        Math.max(0, gridItem.w - 1) * COLUMN_MARGIN
                      }px`,
                    }
                  : undefined
              }
            >
              {child}
            </div>
          );
        })}
      </div>
    ),
    useContainerWidth: () => ({
      containerRef: vi.fn(),
      mounted: true,
      width: 1440,
    }),
  };
});

const { RotationBuilder } = await import('./RotationTimelineBuilder');

const makeStoredAttack = ({
  characterId,
  id,
  instanceId,
}: {
  characterId: number;
  id: number;
  instanceId: string;
}): AttackInstance => ({
  characterId,
  id,
  instanceId,
  parameterValues: [],
});

const makeStoredBuff = ({
  characterId,
  h = 1,
  id,
  instanceId,
  w,
  x,
  y,
}: {
  characterId: number;
  h?: number;
  id: number;
  instanceId: string;
  w: number;
  x: number;
  y: number;
}): ModifierInstance => ({
  characterId,
  h,
  id,
  instanceId,
  parameterValues: [],
  w,
  x,
  y,
});

const makeDropTargetBounds = ({
  height = 320,
  left = 100,
  top = 40,
  width = 960,
}: {
  height?: number;
  left?: number;
  top?: number;
  width?: number;
}) => ({
  bottom: top + height,
  height,
  left,
  right: left + width,
  toJSON: () => ({}),
  top,
  width,
  x: left,
  y: top,
});

const renderRotationBuilder = (properties?: {
  attacks?: Array<AttackInstance>;
  buffs?: Array<ModifierInstance>;
}) => {
  useStore.setState({
    attacks: properties?.attacks ?? [],
    buffs: properties?.buffs ?? [],
  } as Partial<ReturnType<typeof useStore.getState>>);

  return render(<RotationBuilder />);
};

const emitDragEnd = (event: unknown) => {
  if (!dndHarness.dragEndHandler.current) {
    throw new Error('Expected the rotation builder to register an onDragEnd handler');
  }

  act(() => {
    dndHarness.dragEndHandler.current?.(event);
  });
};

const getSidebarSource = (capabilityId: number) => {
  const source = dndHarness.sidebarSources.get(capabilityId);
  if (!source) {
    throw new Error(`Expected sidebar drag source for capability ${capabilityId}`);
  }

  return source;
};

const setElementRect = (
  element: Element,
  properties?: {
    height?: number;
    left?: number;
    top?: number;
    width?: number;
  },
) => {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => makeDropTargetBounds(properties ?? {}),
  });
};

const getTextInstanceCount = (text: string) => screen.queryAllByText(text).length;

const getSidebarSection = (sectionName: 'Attacks' | 'Buffs') => {
  const heading = screen.getByRole('heading', { name: sectionName });
  const section = heading.parentElement?.parentElement;
  if (!section) {
    throw new Error(`Expected "${sectionName}" section to exist`);
  }

  return section;
};

const getSidebarCapabilityCard = (
  sectionName: 'Attacks' | 'Buffs',
  capabilityName: string,
) => {
  const label = within(getSidebarSection(sectionName)).getByText(capabilityName);
  const card = label.closest<HTMLElement>('[data-slot="item"]');
  if (!card) {
    throw new Error(`Expected sidebar card for "${capabilityName}" to exist`);
  }

  return card;
};

const createDropTarget = (properties?: {
  height?: number;
  left?: number;
  top?: number;
  width?: number;
}) => {
  const element = document.createElement('div');
  setElementRect(element, properties);
  return element;
};

const getBuffGridItem = (name: string) => {
  const label = screen
    .getAllByText(name)
    .find((element) => element.closest('[data-grid-id]'));
  const gridItem = label?.closest('[data-grid-id]');
  if (!(gridItem instanceof HTMLDivElement)) {
    throw new TypeError(`Expected a grid item wrapper for buff "${name}"`);
  }

  return gridItem;
};

const expectBuffLayoutsNotToOverlap = () => {
  const buffs = useStore.getState().buffs;
  for (const [index, left] of buffs.entries()) {
    for (const right of buffs.slice(index + 1)) {
      const overlaps =
        left.x < right.x + right.w &&
        left.x + left.w > right.x &&
        left.y < right.y + right.h &&
        left.y + left.h > right.y;

      expect(overlaps).toBe(false);
    }
  }
};

describe('RotationBuilder', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.persist.clearStorage();
    dndHarness.dragEndHandler.current = undefined;
    dndHarness.sidebarSources.clear();
    dndHarness.mockUseTeamDetails
      .mockReset()
      .mockReturnValue(buildRotationTimelineTeamDetails());
    useStore.setState({
      attacks: [],
      buffs: [],
    } as Partial<ReturnType<typeof useStore.getState>>);
  });

  describe.each([
    {
      attacks: [] as Array<AttackInstance>,
      buffs: [] as Array<ModifierInstance>,
      name: 'empty canvases',
    },
    {
      attacks: [
        makeStoredAttack({
          characterId: 484,
          id: 608,
          instanceId: 'attack-shorekeeper-basic-1',
        }),
      ],
      buffs: [
        makeStoredBuff({
          characterId: 484,
          id: 1137,
          instanceId: 'buff-shorekeeper-binary-butterfly',
          w: 4,
          x: 8,
          y: 0,
        }),
      ],
      name: 'non-empty canvases',
    },
  ])('with $name', ({ attacks, buffs }) => {
    it('adds a clicked buff from the sidebar to the buff canvas', async () => {
      const user = userEvent.setup();
      renderRotationBuilder({ attacks, buffs });

      await user.click(getSidebarCapabilityCard('Buffs', 'Syntony Field'));

      expect(useStore.getState().buffs.at(-1)).toMatchObject({
        characterId: 463,
        id: 1060,
      });
      expect(getTextInstanceCount('Syntony Field')).toBe(2);
    });

    it('adds a clicked attack from the sidebar to the end of the attack canvas', async () => {
      const user = userEvent.setup();
      renderRotationBuilder({ attacks, buffs });

      await user.click(getSidebarCapabilityCard('Attacks', 'Optimal Solution'));

      expect(useStore.getState().attacks.at(-1)).toMatchObject({
        characterId: 463,
        id: 238,
      });
      expect(getTextInstanceCount('Optimal Solution')).toBe(2);
    });

    it('adds a buff when it is dragged from the sidebar to the buff canvas', () => {
      renderRotationBuilder({ attacks, buffs });
      const buffCanvas = createDropTarget({ width: 1440 });

      emitDragEnd({
        canceled: false,
        nativeEvent: new MouseEvent('pointerup', {
          clientX: 320,
          clientY: 92,
        }),
        operation: {
          source: getSidebarSource(1060),
          target: {
            element: buffCanvas,
            id: BUFF_CANVAS_DROP_ID,
          },
        },
      });

      expect(useStore.getState().buffs.at(-1)).toMatchObject({
        characterId: 463,
        id: 1060,
      });
      expect(getTextInstanceCount('Syntony Field')).toBe(2);
    });

    it('does not add an attack when it is dragged from the sidebar to the buff canvas', () => {
      renderRotationBuilder({ attacks, buffs });
      const buffCanvas = createDropTarget({ width: 1440 });
      const startingAttackCount = useStore.getState().attacks.length;

      emitDragEnd({
        canceled: false,
        nativeEvent: new MouseEvent('pointerup', {
          clientX: 320,
          clientY: 92,
        }),
        operation: {
          source: getSidebarSource(238),
          target: {
            element: buffCanvas,
            id: BUFF_CANVAS_DROP_ID,
          },
        },
      });

      expect(useStore.getState().attacks).toHaveLength(startingAttackCount);
      expect(getTextInstanceCount('Optimal Solution')).toBe(1);
    });

    it('adds an attack when it is dragged from the sidebar to the attack canvas', () => {
      renderRotationBuilder({ attacks, buffs });
      const attackCanvas = createDropTarget({ width: 1440 });

      emitDragEnd({
        canceled: false,
        nativeEvent: new MouseEvent('pointerup', {
          clientX: 1320,
          clientY: 92,
        }),
        operation: {
          source: getSidebarSource(238),
          target: {
            element: attackCanvas,
            id: ATTACK_CANVAS_DROP_ID,
          },
        },
      });

      expect(useStore.getState().attacks.at(-1)).toMatchObject({
        characterId: 463,
        id: 238,
      });
      expect(getTextInstanceCount('Optimal Solution')).toBe(2);
    });

    it('does not add a buff when it is dragged from the sidebar to the attack canvas', () => {
      renderRotationBuilder({ attacks, buffs });
      const attackCanvas = createDropTarget({ width: 1440 });
      const startingBuffCount = useStore.getState().buffs.length;

      emitDragEnd({
        canceled: false,
        nativeEvent: new MouseEvent('pointerup', {
          clientX: 1320,
          clientY: 92,
        }),
        operation: {
          source: getSidebarSource(1060),
          target: {
            element: attackCanvas,
            id: ATTACK_CANVAS_DROP_ID,
          },
        },
      });

      expect(useStore.getState().buffs).toHaveLength(startingBuffCount);
      expect(getTextInstanceCount('Syntony Field')).toBe(1);
    });
  });

  describe.each([
    {
      buffs: [] as Array<ModifierInstance>,
      name: 'from an empty buff canvas',
    },
    {
      buffs: [
        makeStoredBuff({
          characterId: 484,
          id: 1137,
          instanceId: 'buff-binary-butterfly',
          w: INITIAL_BUFF_LAYOUT.w,
          x: 0,
          y: 0,
        }),
      ],
      name: 'from a non-empty buff canvas',
    },
  ])('multiple clicked buffs $name', ({ buffs }) => {
    it('does not overlay the added buffs on top of each other', async () => {
      const user = userEvent.setup();
      renderRotationBuilder({ buffs });

      await user.click(getSidebarCapabilityCard('Buffs', 'Syntony Field'));
      await user.click(getSidebarCapabilityCard('Buffs', 'High Syntony Field'));

      expectBuffLayoutsNotToOverlap();
      expect(getBuffGridItem('Syntony Field').dataset.gridY).toBeDefined();
      expect(getBuffGridItem('High Syntony Field').dataset.gridY).toBeDefined();
    });
  });

  it('centers both empty canvas messages within their larger overlay containers', () => {
    dndHarness.mockUseTeamDetails.mockReturnValue({
      data: {
        attacks: [],
        modifiers: [],
        permanentStats: [],
      },
      isLoading: false,
      isError: false,
    });
    renderRotationBuilder();

    expect(screen.getByText(/No attacks to display\./)).toHaveClass(
      'absolute',
      'inset-0',
      'flex',
      'items-center',
      'justify-center',
    );
    expect(screen.getByText(/No buffs to display\./)).toHaveClass(
      'absolute',
      'inset-0',
      'flex',
      'items-center',
      'justify-center',
    );
  });

  it('drops a buff into a later row when the default placement is already occupied', async () => {
    const user = userEvent.setup();
    renderRotationBuilder({
      buffs: [
        makeStoredBuff({
          characterId: 484,
          id: 1137,
          instanceId: 'existing-buff',
          w: INITIAL_BUFF_LAYOUT.w,
          x: INITIAL_BUFF_LAYOUT.x,
          y: INITIAL_BUFF_LAYOUT.y,
        }),
      ],
    });

    await user.click(getSidebarCapabilityCard('Buffs', 'Syntony Field'));

    expect(useStore.getState().buffs).toHaveLength(2);
    expect(useStore.getState().buffs[1]).toMatchObject({
      w: INITIAL_BUFF_LAYOUT.w,
      x: INITIAL_BUFF_LAYOUT.x,
      y: 1,
    });
  });

  it('uses the buff drop coordinates to place a dragged buff in the expected column and row', () => {
    renderRotationBuilder({
      attacks: [
        makeStoredAttack({
          characterId: 463,
          id: 227,
          instanceId: 'attack-1',
        }),
        makeStoredAttack({
          characterId: 463,
          id: 238,
          instanceId: 'attack-2',
        }),
      ],
    });
    const buffCanvas = createDropTarget({ width: 1440 });

    emitDragEnd({
      canceled: false,
      nativeEvent: new MouseEvent('pointerup', {
        clientX: 470,
        clientY: 145,
      }),
      operation: {
        source: getSidebarSource(1061),
        target: {
          element: buffCanvas,
          id: BUFF_CANVAS_DROP_ID,
        },
      },
    });

    expect(useStore.getState().buffs[0]).toMatchObject({
      h: 1,
      w: INITIAL_BUFF_LAYOUT.w,
      x: Math.floor((470 - 100) / COLUMN_STEP),
      y: Math.floor((145 - 40) / (BUFF_ROW_HEIGHT + 4)),
    });
  });
});

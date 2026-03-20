import { useDroppable } from '@dnd-kit/react';
import type { Layout } from 'react-grid-layout';
import GridLayout from 'react-grid-layout';

import {
  BUFF_CANVAS_DROP_ID,
  BUFF_LENGTH_ON_ADD,
  BUFF_ROW_HEIGHT,
  COLUMN_STEP,
  SIDEBAR_ATTACK_DRAG_TYPE,
  SIDEBAR_BUFF_DRAG_TYPE,
} from '@/components/rotation-builder/rotation-timeline/constants';
import { useCanvasLayout } from '@/hooks/useCanvasLayout';
import { useTeamModifierInstances } from '@/hooks/useTeamModifierInstances';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import type { SidebarCapabilityDragData } from '@/types/dnd';

import { BaseBuffCanvasItem, BuffCanvasItem } from './BuffCanvasItem';

interface BuffPreviewLayout {
  characterIconUrl?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  iconUrl?: string;
  name?: string;
}

interface BuffCanvasProperties {
  width: number;
  previewLayout?: BuffPreviewLayout;
}

const BUFF_PREVIEW_ID = '__buff-drop-preview__';

export const BuffCanvas = ({ width, previewLayout }: BuffCanvasProperties) => {
  const { buffs } = useTeamModifierInstances();
  const attackCount = useStore((state) => state.attacks.length);
  const removeBuff = useStore((state) => state.removeBuff);
  const updateBuffLayout = useStore((state) => state.updateBuffLayout);
  const totalColumns = Math.max(attackCount, BUFF_LENGTH_ON_ADD);
  const { ref, isDropTarget } = useDroppable<SidebarCapabilityDragData>({
    id: BUFF_CANVAS_DROP_ID,
    accept: (source) =>
      source.type === SIDEBAR_ATTACK_DRAG_TYPE ||
      source.type === SIDEBAR_BUFF_DRAG_TYPE,
  });
  const onLayoutChange = (layout: Layout) => {
    for (const item of layout) {
      if (item.i === BUFF_PREVIEW_ID) continue;
      updateBuffLayout(item.i, { x: item.x, y: item.y, w: item.w, h: item.h });
    }
  };
  const { layout: fullLayoutProperties, isInteracting } = useCanvasLayout({
    gridConfig: { rowHeight: BUFF_ROW_HEIGHT },
    resizeConfig: {
      handles: ['e', 'w'],
    },
    layout: [
      ...buffs.map((buff) => ({
        i: buff.instanceId,
        x: buff.x,
        y: buff.y,
        w: buff.w,
        h: buff.h,
      })),
      ...(previewLayout ? [{ i: BUFF_PREVIEW_ID, ...previewLayout }] : []),
    ],
    onLayoutChange,
  });

  const isValidDropTarget = isDropTarget && !!previewLayout;
  const getStickyOffsets = ({ x, w }: { x: number; w: number }) => ({
    stickyLeftOffset: x * COLUMN_STEP,
    stickyRightOffset: Math.max(0, totalColumns - (x + w)) * COLUMN_STEP,
  });

  return (
    <div
      ref={ref}
      data-testid="buff-canvas"
      className={cn(
        // `overflow-x-clip` keeps wide grid content visually contained without
        // becoming the nearest horizontal scroll container, so sticky children
        // inside buff items still track the outer timeline scroll.
        'flex min-h-0 flex-1 flex-col overflow-x-clip',
        isValidDropTarget && 'bg-accent/10',
      )}
    >
      <GridLayout
        {...fullLayoutProperties}
        width={width}
        className="buff-canvas-grid min-h-0 flex-1"
      >
        {buffs.map((buff) => (
          <div key={buff.instanceId}>
            <BuffCanvasItem
              buff={buff}
              onRemove={removeBuff}
              isDialogClickable={!isInteracting}
              {...getStickyOffsets(buff)}
            />
          </div>
        ))}
        {previewLayout ? (
          <div key={BUFF_PREVIEW_ID}>
            <BaseBuffCanvasItem
              characterIconUrl={previewLayout.characterIconUrl}
              iconUrl={previewLayout.iconUrl}
              name={previewLayout.name}
              {...getStickyOffsets(previewLayout)}
            />
          </div>
        ) : undefined}
      </GridLayout>
    </div>
  );
};

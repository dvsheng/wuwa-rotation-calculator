import { useDroppable } from '@dnd-kit/react';
import type { Layout } from 'react-grid-layout';
import GridLayout from 'react-grid-layout';

import {
  BUFF_CANVAS_DROP_ID,
  BUFF_ROW_HEIGHT,
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
  const removeBuff = useStore((state) => state.removeBuff);
  const updateBuffLayout = useStore((state) => state.updateBuffLayout);
  const { ref, isDropTarget } = useDroppable<SidebarCapabilityDragData>({
    id: BUFF_CANVAS_DROP_ID,
    accept: (source) => source.type === SIDEBAR_BUFF_DRAG_TYPE,
  });
  const onLayoutChange = (layout: Layout) => {
    for (const item of layout) {
      if (item.i === BUFF_PREVIEW_ID) continue;
      updateBuffLayout(item.i, { x: item.x, y: item.y, w: item.w, h: item.h });
    }
  };
  const { layout: fullLayoutProperties } = useCanvasLayout({
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

  return (
    <div
      ref={ref}
      data-testid="buff-canvas"
      className={cn('flex min-h-0 flex-1', isValidDropTarget && 'bg-accent/10')}
    >
      <GridLayout
        {...fullLayoutProperties}
        width={width}
        className="buff-canvas-grid min-h-0 flex-1"
      >
        {buffs.map((buff) => (
          <div key={buff.instanceId}>
            <BuffCanvasItem buff={buff} onRemove={removeBuff} />
          </div>
        ))}
        {previewLayout && (
          <div key={BUFF_PREVIEW_ID}>
            <BaseBuffCanvasItem
              characterIconUrl={previewLayout.characterIconUrl}
              iconUrl={previewLayout.iconUrl}
              name={previewLayout.name}
            />
          </div>
        )}
      </GridLayout>
    </div>
  );
};

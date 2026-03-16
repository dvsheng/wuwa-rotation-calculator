import { useDroppable } from '@dnd-kit/react';
import type { Ref } from 'react';
import type { Layout } from 'react-grid-layout';
import GridLayout from 'react-grid-layout';

import {
  BUFF_CANVAS_DROP_ID,
  BUFF_ROW_HEIGHT,
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
  const removeBuff = useStore((state) => state.removeBuff);
  const updateBuffLayout = useStore((state) => state.updateBuffLayout);
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
      // Render handles as styled React elements rather than CSS-positioned divs.
      // react-grid-layout types this ref generically as Ref<HTMLElement>; the cast
      // to Ref<HTMLDivElement> is safe because HTMLDivElement extends HTMLElement.
      handleComponent: (axis, reference) => (
        <div
          ref={reference as Ref<HTMLDivElement>}
          className={cn(
            'react-resizable-handle',
            `react-resizable-handle-${axis}`,
            'absolute inset-y-0 z-20 w-1.5 cursor-col-resize overflow-hidden rounded-md',
            'bg-muted-foreground/20 hover:bg-muted-foreground/40 transition-colors',
            axis === 'e' ? 'right-0' : 'left-0',
          )}
        />
      ),
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
      className={cn(
        // `overflow-x-clip` keeps wide grid content visually contained without
        // becoming the nearest horizontal scroll container, so sticky children
        // inside buff items still track the outer timeline scroll.
        'flex min-h-0 flex-1 flex-col overflow-x-clip',
        isValidDropTarget && 'bg-accent/10',
      )}
    >
      <GridLayout {...fullLayoutProperties} width={width} className="min-h-0 flex-1">
        {buffs.map((buff) => (
          <div key={buff.instanceId}>
            <BuffCanvasItem
              buff={buff}
              onRemove={removeBuff}
              isDialogClickable={!isInteracting}
            />
          </div>
        ))}
        {previewLayout ? (
          <div key={BUFF_PREVIEW_ID}>
            <BaseBuffCanvasItem
              characterIconUrl={previewLayout.characterIconUrl}
              iconUrl={previewLayout.iconUrl}
              name={previewLayout.name}
            />
          </div>
        ) : undefined}
      </GridLayout>
    </div>
  );
};

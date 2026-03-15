import { useDroppable } from '@dnd-kit/react';
import { useState } from 'react';
import type { Ref } from 'react';
import type { Layout } from 'react-grid-layout';
import GridLayout from 'react-grid-layout';
import { absoluteStrategy } from 'react-grid-layout/core';

import {
  BUFF_CANVAS_DROP_ID,
  BUFF_ROW_HEIGHT,
  SIDEBAR_ATTACK_DRAG_TYPE,
  SIDEBAR_BUFF_DRAG_TYPE,
} from '@/components/rotation-builder/rotation-timeline/constants';
import { Container } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
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
  previewLayout?: BuffPreviewLayout;
}

const BUFF_PREVIEW_ID = '__buff-drop-preview__';

export const BuffCanvas = ({ previewLayout }: BuffCanvasProperties) => {
  const { buffs } = useTeamModifierInstances();
  const removeBuff = useStore((state) => state.removeBuff);
  const updateBuffLayout = useStore((state) => state.updateBuffLayout);
  const [isGridInteractable, setIsGridInteractable] = useState(true);
  const { ref, isDropTarget } = useDroppable<SidebarCapabilityDragData>({
    id: BUFF_CANVAS_DROP_ID,
    accept: (source) =>
      source.type === SIDEBAR_ATTACK_DRAG_TYPE ||
      source.type === SIDEBAR_BUFF_DRAG_TYPE,
  });
  const isValidDropTarget = isDropTarget && !!previewLayout;

  const onLayoutChange = (layout: Layout) => {
    for (const item of layout) {
      if (item.i === BUFF_PREVIEW_ID) continue;
      updateBuffLayout(item.i, { x: item.x, y: item.y, w: item.w, h: item.h });
    }
  };

  const layout = [
    ...buffs.map((buff) => ({
      i: buff.instanceId,
      x: buff.x,
      y: buff.y,
      w: buff.w,
      h: buff.h,
    })),
    ...(previewLayout ? [{ i: BUFF_PREVIEW_ID, ...previewLayout }] : []),
  ];

  const { layout: fullLayoutProperties, isInteracting } = useCanvasLayout({
    gridConfig: { rowHeight: BUFF_ROW_HEIGHT },
    resizeConfig: {
      enabled: isGridInteractable,
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
    dragConfig: { enabled: isGridInteractable },
    layout,
    style: { minHeight: 400 },
    positionStrategy: absoluteStrategy,
    onLayoutChange,
  });

  const handleRemoveBuff = (instanceId: string) => {
    removeBuff(instanceId);
  };

  return (
    <Container
      ref={ref}
      className={cn(
        'flex min-h-0 flex-1 items-center justify-center',
        isValidDropTarget && 'bg-accent/10',
      )}
    >
      {buffs.length === 0 && !previewLayout && (
        <Text variant="bodySm" tone="muted">
          Drag buffs here to align with attacks
        </Text>
      )}
      {buffs.length > 0 || previewLayout ? (
        <Container className="px-panel flex items-start">
          <GridLayout {...fullLayoutProperties}>
            {buffs.map((buff) => (
              <div key={buff.instanceId}>
                <BuffCanvasItem
                  buff={buff}
                  onRemove={handleRemoveBuff}
                  isDialogClickable={!isInteracting}
                  onOpenChange={(isOpen: boolean) => setIsGridInteractable(!isOpen)}
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
        </Container>
      ) : undefined}
    </Container>
  );
};

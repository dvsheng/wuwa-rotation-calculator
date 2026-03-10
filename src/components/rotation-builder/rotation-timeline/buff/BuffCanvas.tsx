import { useState } from 'react';
import type { Ref } from 'react';
import type { Layout, LayoutItem } from 'react-grid-layout';
import GridLayout from 'react-grid-layout';

import { Text } from '@/components/ui/typography';
import { useCanvasLayout } from '@/hooks/useCanvasLayout';
import { useTeamModifierInstances } from '@/hooks/useTeamModifierInstances';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';

import { BUFF_LENGTH_ON_ADD } from '../RotationTimelineBuilder';

import { BuffCanvasItem } from './BuffCanvasItem';

interface BuffCanvasProperties {
  onDropBuff: (layout: Layout, item: LayoutItem | undefined, event: Event) => void;
}

export const BuffCanvas = ({ onDropBuff }: BuffCanvasProperties) => {
  const { buffs } = useTeamModifierInstances();
  const removeBuff = useStore((state) => state.removeBuff);
  const updateBuffLayout = useStore((state) => state.updateBuffLayout);
  const [isGridInteractable, setIsGridInteractable] = useState(true);

  const onLayoutChange = (layout: Layout) => {
    for (const item of layout) {
      updateBuffLayout(item.i, { x: item.x, y: item.y, w: item.w, h: item.h });
    }
  };

  const { layout: fullLayoutProperties, isInteracting } = useCanvasLayout({
    gridConfig: { rowHeight: 48 },
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
    layout: buffs.map((buff) => ({
      i: buff.instanceId,
      x: buff.x,
      y: buff.y,
      w: buff.w,
      h: buff.h,
    })),
    droppingItem: { w: BUFF_LENGTH_ON_ADD, h: 1, i: 'new-buff', x: 0, y: 0 },
    style: { minHeight: 400 },
    onLayoutChange,
    onDrop: onDropBuff,
  });

  const handleRemoveBuff = (instanceId: string) => {
    removeBuff(instanceId);
  };

  return (
    <div className="canvas-section">
      <div className="canvas-content">
        <div
          className="canvas-drop-zone"
          style={{ minWidth: fullLayoutProperties.width }}
        >
          {buffs.length === 0 && (
            <div className="canvas-empty-state">
              <Text variant="small">Drag buffs here to align with attacks</Text>
            </div>
          )}

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
          </GridLayout>
        </div>
      </div>
    </div>
  );
};

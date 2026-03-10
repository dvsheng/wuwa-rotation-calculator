import { useState } from 'react';
import type { Layout, LayoutItem } from 'react-grid-layout';
import GridLayout from 'react-grid-layout';

import { Text } from '@/components/ui/typography';
import { useCanvasLayout } from '@/hooks/useCanvasLayout';
import { useTeamModifierInstances } from '@/hooks/useTeamModifierInstances';
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
    gridConfig: { rowHeight: 48, margin: [4, 4] as const },
    resizeConfig: { enabled: isGridInteractable, handles: ['e', 'w'] },
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

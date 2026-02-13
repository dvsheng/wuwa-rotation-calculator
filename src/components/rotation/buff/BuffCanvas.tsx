import type { Layout, LayoutItem } from 'react-grid-layout';
import GridLayout from 'react-grid-layout';

import { Text } from '@/components/ui/typography';
import { useCanvasLayout } from '@/hooks/useCanvasLayout';
import { useTeamModifierInstances } from '@/hooks/useTeamModifierInstances';
import { useStore } from '@/store';

import { BuffTimelineCanvasItem } from './BuffCanvasItem';

interface BuffCanvasProperties {
  onDropBuff: (layout: Layout, item: LayoutItem | undefined, event: Event) => void;
}

export const BuffCanvas = ({ onDropBuff }: BuffCanvasProperties) => {
  const { buffs } = useTeamModifierInstances();
  const removeBuff = useStore((state) => state.removeBuff);
  const updateBuffLayout = useStore((state) => state.updateBuffLayout);

  const onLayoutChange = (layout: Layout) => {
    for (const item of layout) {
      updateBuffLayout(item.i, { x: item.x, y: item.y, w: item.w, h: item.h });
    }
  };

  const { layout: fullLayoutProperties, isInteracting } = useCanvasLayout({
    gridConfig: { rowHeight: 50, margin: [4, 4] as const },
    resizeConfig: { enabled: true, handles: ['e', 'w'] },
    layout: buffs.map((buff) => ({
      i: buff.instanceId,
      x: buff.x,
      y: buff.y,
      w: buff.w,
      h: buff.h,
    })),
    style: { minHeight: 400 },
    onLayoutChange,
    onDrop: onDropBuff,
  });

  const handleRemoveBuff = (instanceId: string) => {
    removeBuff(instanceId);
  };

  return (
    <div className="canvas-section">
      <div className="canvas-header">
        <Text className="text-sm font-semibold tracking-wider uppercase">
          Buff Timeline
        </Text>
        <Text
          variant="tiny"
          className="text-muted-foreground bg-card sticky right-4 font-medium"
        >
          {buffs.length} {buffs.length === 1 ? 'Buff' : 'Buffs'}
        </Text>
      </div>

      <div className="canvas-content">
        <div
          className="canvas-drop-zone"
          style={{ minWidth: fullLayoutProperties.width }}
        >
          {buffs.length === 0 && (
            <div className="canvas-empty-state">
              <Text className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                Drag buffs here to align with attacks
              </Text>
            </div>
          )}

          <GridLayout {...fullLayoutProperties}>
            {buffs.map((buff) => (
              <div key={buff.instanceId} className="group relative">
                <BuffTimelineCanvasItem
                  buff={buff}
                  onRemove={handleRemoveBuff}
                  isInteracting={isInteracting}
                />
              </div>
            ))}
          </GridLayout>
        </div>
      </div>
    </div>
  );
};

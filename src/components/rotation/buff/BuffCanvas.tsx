import { cloneDeep, merge } from 'es-toolkit/object';
import type { Layout, LayoutItem } from 'react-grid-layout';
import GridLayout from 'react-grid-layout';

import { Text } from '@/components/ui/typography';
import { useCanvasLayout } from '@/hooks/useCanvasLayout';
import { useTeamModifierInstances } from '@/hooks/useTeamModifierInstances';
import { useRotationStore } from '@/store/useRotationStore';

import { BuffTimelineCanvasItem } from './BuffCanvasItem';

interface BuffCanvasProps {
  onDropBuff: (layout: Layout, item: LayoutItem | undefined, event: Event) => void;
}

export const BuffCanvas = ({ onDropBuff }: BuffCanvasProps) => {
  const { layout: gridLayoutProps, containerRef } = useCanvasLayout();
  const { buffs } = useTeamModifierInstances();
  const removeBuff = useRotationStore((state) => state.removeBuff);
  const updateBuffLayout = useRotationStore((state) => state.updateBuffLayout);
  const updateBuffParameters = useRotationStore((state) => state.updateBuffParameters);

  const onLayoutChange = (layout: Layout) => {
    layout.forEach((item) => {
      updateBuffLayout(item.i, { x: item.x, y: item.y, w: item.w, h: item.h });
    });
  };

  const additionalLayoutProps = {
    gridConfig: { rowHeight: 28, margin: [4, 4] as const },
    resizeConfig: { enabled: true, handles: ['e'] },
    layout: buffs.map((buff) => ({
      i: buff.instanceId,
      x: buff.x,
      y: buff.y,
      w: buff.w,
      h: buff.h,
    })),
    style: { minHeight: 200 },
    onLayoutChange,
    onDrop: onDropBuff,
  };
  const fullLayoutProps = merge(cloneDeep(gridLayoutProps), additionalLayoutProps);

  return (
    <div className="canvas-section">
      <div className="canvas-header">
        <Text className="text-sm font-semibold tracking-wider uppercase">
          Buff Timeline
        </Text>
        <Text variant="tiny" className="text-muted-foreground font-medium">
          {buffs.length} {buffs.length === 1 ? 'Buff' : 'Buffs'}
        </Text>
      </div>

      <div className="canvas-content">
        <div className="canvas-drop-zone" ref={containerRef}>
          {buffs.length === 0 && (
            <div className="canvas-empty-state">
              <Text className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                Drag buffs here to align with attacks
              </Text>
            </div>
          )}

          <GridLayout {...fullLayoutProps}>
            {buffs.map((buff) => (
              <div key={buff.instanceId} className="group relative">
                <BuffTimelineCanvasItem
                  buff={buff}
                  onRemove={removeBuff}
                  onSaveParameters={updateBuffParameters}
                />
              </div>
            ))}
          </GridLayout>
        </div>
      </div>
    </div>
  );
};

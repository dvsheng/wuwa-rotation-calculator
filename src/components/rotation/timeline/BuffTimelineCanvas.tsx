import type { GridLayoutProps, Layout } from 'react-grid-layout';
import GridLayout from 'react-grid-layout';

import { Text } from '@/components/ui/typography';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { cn } from '@/lib/utils';
import { BuffSchema } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';

import { BuffTimelineCanvasItem } from './BuffTimelineCanvasItem';

interface BuffTimelineCanvasProps {
  width: number;
  gridConfig: GridLayoutProps['gridConfig'];
}

export const BuffTimelineCanvas = ({ width, gridConfig }: BuffTimelineCanvasProps) => {
  const activeBuffs = useRotationStore((state) => state.buffs);
  const removeBuff = useRotationStore((state) => state.removeBuff);
  const addBuff = useRotationStore((state) => state.addBuff);
  const updateBuffLayout = useRotationStore((state) => state.updateBuffLayout);
  const updateBuffParameters = useRotationStore((state) => state.updateBuffParameters);

  const { createHandleDrop } = useDragAndDrop({
    schema: BuffSchema,
  });

  const onLayoutChange = (layout: Layout) => {
    layout.forEach((item) => {
      updateBuffLayout(item.i, { x: item.x, y: item.y, w: item.w, h: item.h });
    });
  };

  const handleDrop = createHandleDrop((buff, item) => {
    addBuff(buff, {
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    });
  });

  const layoutProps: Omit<GridLayoutProps, 'children'> = {
    width,
    gridConfig: {
      ...gridConfig,
      rowHeight: 20,
    },
    dropConfig: { enabled: true },
    resizeConfig: { enabled: true, handles: ['e'] },
    style: { minHeight: '100px' },
    layout: activeBuffs.map((buff) => ({
      i: buff.timelineId,
      x: buff.x,
      y: buff.y,
      w: buff.w,
      h: buff.h,
    })),
    onDrop: handleDrop,
    onLayoutChange,
  };

  return (
    <div
      className={cn(
        'border-border/50 bg-muted/10 relative min-h-[100px] w-full rounded-lg border transition-colors',
      )}
    >
      {activeBuffs.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Text className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
            Drag buffs here to track their duration
          </Text>
        </div>
      )}

      <div className="p-0">
        <GridLayout {...layoutProps}>
          {activeBuffs.map((buff) => (
            <div key={buff.timelineId} className="group relative">
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
  );
};

import type { GridLayoutProps, Layout } from 'react-grid-layout';
import GridLayout from 'react-grid-layout';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { cn } from '@/lib/utils';
import type { BuffWithPosition } from '@/schemas/rotation';
import { BuffSchema } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';
import type { DetailedBuff } from '@/types/client/capability';

import type { SharedGridConfig } from '../types';

import { BuffTimelineCanvasItem } from './BuffTimelineCanvasItem';

interface BuffTimelineCanvasProps {
  gridConfig: SharedGridConfig;
  buffs: Array<DetailedBuff & BuffWithPosition>;
}

export const BuffTimelineCanvas = ({ gridConfig, buffs }: BuffTimelineCanvasProps) => {
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
    width: gridConfig.width,
    gridConfig: {
      cols: gridConfig.cols,
      rowHeight: 20,
      margin: gridConfig.margin,
      containerPadding: gridConfig.containerPadding,
    },
    dropConfig: { enabled: true },
    resizeConfig: { enabled: true, handles: ['e'] },
    style: { minHeight: '140px', minWidth: gridConfig.width },
    layout: buffs.map((buff) => ({
      i: buff.instanceId,
      x: buff.x,
      y: buff.y,
      w: buff.w,
      h: buff.h,
    })),
    onDrop: handleDrop,
    onLayoutChange,
  };

  return (
    <ScrollArea className="w-full">
      <div
        className={cn(
          'border-border/50 bg-muted/10 relative min-h-[140px] rounded-lg border transition-colors',
        )}
        style={{ minWidth: gridConfig.width }}
      >
        {buffs.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Text className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
              Align buffs with attacks to include them in damage calculations
            </Text>
          </div>
        )}

        <div className="p-0">
          <GridLayout {...layoutProps}>
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
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

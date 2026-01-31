import { merge } from 'es-toolkit/object';
import type { GridLayoutProps, Layout, LayoutItem } from 'react-grid-layout';
import GridLayout from 'react-grid-layout';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { useRotationStore } from '@/store/useRotationStore';

import { BuffTimelineCanvasItem } from './BuffTimelineCanvasItem';

interface BuffTimelineCanvasProps {
  gridLayoutProps: Omit<GridLayoutProps, 'children'>;
  onDropBuff: (layout: Layout, item: LayoutItem | undefined, event: Event) => void;
}

export const BuffTimelineCanvas = ({
  gridLayoutProps,
  onDropBuff,
}: BuffTimelineCanvasProps) => {
  const buffs = useRotationStore((state) => state.buffs);
  const removeBuff = useRotationStore((state) => state.removeBuff);
  const updateBuffLayout = useRotationStore((state) => state.updateBuffLayout);
  const updateBuffParameters = useRotationStore((state) => state.updateBuffParameters);

  const onLayoutChange = (layout: Layout) => {
    layout.forEach((item) => {
      updateBuffLayout(item.i, { x: item.x, y: item.y, w: item.w, h: item.h });
    });
  };

  const additionalLayoutProps = {
    resizeConfig: { enabled: true, handles: ['e'] },
    style: { minHeight: '140px' },
    layout: buffs.map((buff) => ({
      i: buff.instanceId,
      x: buff.x,
      y: buff.y,
      w: buff.w,
      h: buff.h,
    })),
    onLayoutChange,
    onDrop: onDropBuff,
  };
  const fullLayoutProps = merge(gridLayoutProps, additionalLayoutProps);
  return (
    <div className="px-4 pb-4">
      <ScrollArea className="w-full">
        <div
          className={cn(
            'border-border/50 bg-muted/10 relative min-h-[140px] rounded-lg border transition-colors',
          )}
          style={{ minWidth: gridLayoutProps.width }}
        >
          {buffs.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <Text className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                Align buffs with attacks to include them in damage calculations
              </Text>
            </div>
          )}

          <div className="p-0">
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
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

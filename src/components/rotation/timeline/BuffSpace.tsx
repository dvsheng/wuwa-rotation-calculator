import { useDroppable } from '@dnd-kit/core';
import type { GridLayoutProps, Layout } from 'react-grid-layout';
import ReactGridLayout from 'react-grid-layout';

import { TooltipProvider } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

import { BUFF_TIMELINE_ID } from '../constants';
import type { TimelineBuff } from '../types';

import { BuffSpaceItem } from './BuffSpaceItem';

interface BuffSpaceProps {
  activeBuffs: Array<TimelineBuff>;
  layoutProps: Omit<GridLayoutProps, 'children'>;
  onRemove: (timelineId: string) => void;
  onLayoutChange: (layout: Layout) => void;
  onSave: (timelineId: string, parameterValue: number) => void;
}

export const BuffSpace = ({
  activeBuffs,
  layoutProps: baseLayoutProps,
  onRemove,
  onLayoutChange,
  onSave,
}: BuffSpaceProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: BUFF_TIMELINE_ID,
  });
  const layoutProps: Omit<GridLayoutProps, 'children'> = {
    ...baseLayoutProps,
    dragConfig: {
      enabled: true,
    },
    resizeConfig: {
      enabled: true,
    },
    constraints: [
      {
        name: 'horizontalOnly',
        constrainSize: (item, w) => {
          return {
            w,
            h: item.h,
          };
        },
      },
    ],
  };
  return (
    <TooltipProvider delayDuration={100}>
      <div
        ref={setNodeRef}
        className={cn(
          'border-border/50 bg-muted/10 relative min-h-[100px] w-full rounded-lg border transition-colors',
          isOver && 'bg-primary/5 border-primary/30',
        )}
      >
        {activeBuffs.length === 0 && !isOver && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Text className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
              Drag buffs here to track their duration
            </Text>
          </div>
        )}

        <div className="p-0">
          <ReactGridLayout
            {...layoutProps}
            onLayoutChange={onLayoutChange}
            layout={activeBuffs.map((buff) => ({
              i: buff.timelineId,
              x: buff.x,
              y: buff.y,
              w: buff.w,
              h: buff.h,
            }))}
          >
            {activeBuffs.map((buff) => (
              <BuffSpaceItem
                key={buff.timelineId}
                buff={buff}
                onRemove={onRemove}
                onSave={onSave}
              />
            ))}
          </ReactGridLayout>
        </div>
      </div>
    </TooltipProvider>
  );
};

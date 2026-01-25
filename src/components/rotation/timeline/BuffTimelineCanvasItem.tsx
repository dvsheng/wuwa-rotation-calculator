import { AlertTriangle, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import type { BuffWithPosition } from '@/schemas/rotation';

import { BuffConfigurationDialog } from './BuffConfigurationDialog';

interface BuffTimelineCanvasItemProps extends React.HTMLAttributes<HTMLDivElement> {
  buff: BuffWithPosition;
  onRemove: (timelineId: string) => void;
  onSave: (timelineId: string, parameterValue: number) => void;
}

export const BuffTimelineCanvasItem = React.forwardRef<
  HTMLDivElement,
  BuffTimelineCanvasItemProps
>(({ buff, onRemove, onSave, className, style, onClick, children, ...props }, ref) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const showWarning = buff.buff.parameters && buff.parameterValue === undefined;

  const handleBuffClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (buff.buff.parameters) {
      setIsDialogOpen(true);
    }
    onClick?.(e);
  };

  return (
    <div
      ref={ref}
      style={style}
      className={cn('group h-full cursor-pointer', className)}
      onClick={handleBuffClick}
      {...props}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative flex h-full w-full items-center gap-1 overflow-hidden rounded border',
              'bg-primary/20 border-primary/30 group-hover:bg-primary/30 transition-colors',
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-primary/40 hover:text-destructive hover:bg-destructive/10 h-3.5 w-3.5 shrink-0 transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(buff.timelineId);
              }}
            >
              <Trash2 className="h-2 w-2" />
            </Button>
            <div className="drag-handle flex h-full min-w-0 flex-1 cursor-grab items-center gap-1 active:cursor-grabbing">
              <Text className="text-primary truncate text-[9px] font-bold whitespace-nowrap">
                {buff.buff.name}
              </Text>
              {showWarning && (
                <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[300px]">
          <Text variant="tiny" className="font-bold">
            {buff.buff.characterName} - {buff.buff.name}
          </Text>
          <Text variant="tiny">{buff.buff.description}</Text>
          {showWarning && (
            <Text variant="tiny" className="mt-1 font-bold text-amber-500">
              Configuration required
            </Text>
          )}
        </TooltipContent>
      </Tooltip>

      {isDialogOpen && (
        <div onClick={(e) => e.stopPropagation()}>
          <BuffConfigurationDialog
            buff={buff}
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSave={onSave}
          />
        </div>
      )}
    </div>
  );
});

BuffTimelineCanvasItem.displayName = 'BuffTimelineCanvasItem';

import { Plus } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

interface PaletteItemProps {
  text: string;
  hoverText?: string;
  onAdd?: () => void;
  onClick?: () => void;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  className?: string;
}

export const PaletteItem = ({
  text,
  hoverText,
  onAdd,
  onClick,
  onDragStart,
  className,
}: PaletteItemProps) => {
  const isDraggable = onDragStart !== undefined;
  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        'group relative flex w-full min-w-0 items-center transition-all',
        isDraggable && 'cursor-grab active:cursor-grabbing',
        onClick && 'cursor-pointer', // Visual cue for clickability
        className,
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="min-w-0 flex-1">
            <div className="bg-primary/5 hover:bg-primary/10 border-primary/10 rounded border px-2 py-1 transition-colors">
              <Text className="text-foreground text-[10px] font-medium whitespace-nowrap">
                {text}
              </Text>
            </div>
          </div>
        </TooltipTrigger>
        {hoverText && (
          <TooltipContent side="right" className="max-w-[300px] p-3">
            <div className="flex flex-col gap-1.5">
              {/* Header Section */}
              <Text
                variant="tiny"
                className="primary-foreground font-bold tracking-wider uppercase"
              >
                {text}
              </Text>

              {/* Description Section */}
              <div className="muted-foreground border-border border-t pt-1.5 text-[10px] leading-relaxed">
                {hoverText}
              </div>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
      {onAdd && (
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary hover:text-primary-foreground absolute top-1/2 right-1 h-4 w-4 -translate-y-1/2 cursor-pointer transition-colors"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            // Stop event from bubbling up to the main div's onClick
            e.stopPropagation();
            onAdd();
          }}
        >
          <Plus className="h-2.5 w-2.5" />
        </Button>
      )}
    </div>
  );
};

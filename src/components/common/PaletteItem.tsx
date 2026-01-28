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
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          draggable={isDraggable}
          onDragStart={onDragStart}
          onClick={onClick}
          className={cn(
            'bg-primary/5 hover:bg-primary/10 border-primary/20 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors',
            isDraggable && 'cursor-grab active:cursor-grabbing',
            onClick && 'cursor-pointer',
            className,
          )}
        >
          {text}
          {onAdd && (
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary hover:text-primary-foreground -mr-1 ml-1 h-4 w-4 cursor-pointer transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
            >
              <Plus className="h-2.5 w-2.5" />
            </Button>
          )}
        </div>
      </TooltipTrigger>
      {hoverText && (
        <TooltipContent side="right" className="max-w-[300px] p-3">
          <div className="flex flex-col gap-1.5">
            <Text
              variant="tiny"
              className="primary-foreground font-bold tracking-wider uppercase"
            >
              {text}
            </Text>
            <div className="muted-foreground border-border border-t pt-1.5 text-[10px] leading-relaxed">
              {hoverText}
            </div>
          </div>
        </TooltipContent>
      )}
    </Tooltip>
  );
};

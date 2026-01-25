import { Plus, Trash2 } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

import type { PaletteItem, RotationDisplayItemProps } from './types';
import { PALETTE_DRAG_TYPE } from './types';

interface PaletteItemProps extends RotationDisplayItemProps {
  text: string;
  hoverText?: string;
  variant?: string;
  onAdd?: () => void;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  className?: string;
}

export const PaletteItemCard = ({
  characterName,
  name,
  description,
  variant = 'full',
  onAdd,
  onDragStart,
  className,
}: PaletteItemProps) => {
  const isDraggable = onDragStart === undefined;
  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      className={cn(
        'group relative flex w-full min-w-0 items-center transition-all',
        isDraggable && 'cursor-grab active:cursor-grabbing',
        variant === 'list' &&
          'hover:border-primary/40 bg-card h-full rounded-lg border p-3',
        className,
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="min-w-0 flex-1">
            {variant === 'list' ? (
              <div className="flex flex-col gap-0.5">
                <Text
                  variant="small"
                  className="text-primary/80 truncate font-semibold"
                >
                  {characterName}
                </Text>
                <Text className="truncate text-sm">{name}</Text>
              </div>
            ) : variant === 'compact' ? (
              <div className="bg-primary/5 hover:bg-primary/10 border-primary/10 rounded border px-2 py-1 transition-colors">
                <Text className="text-foreground text-[10px] font-medium whitespace-nowrap">
                  {name}
                </Text>
              </div>
            ) : (
              <Badge
                variant="secondary"
                className="hover:bg-secondary/80 border-muted-foreground/20 flex w-full min-w-0 justify-start overflow-hidden px-2 py-1 text-[10px] shadow-sm transition-colors"
              >
                <span className="min-w-0 flex-1 truncate pr-5 text-left">{name}</span>
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side={variant === 'list' ? 'top' : 'right'}
          className="max-w-[300px] space-y-1"
        >
          <div className="flex flex-col">
            <Text
              variant="tiny"
              className="text-primary/70 font-bold tracking-wider uppercase"
            >
              {characterName}
            </Text>
            <div className="font-bold">{name}</div>
          </div>
          {description && (
            <div className="text-muted-foreground border-t border-white/10 pt-1 text-[10px] leading-relaxed">
              {description}
            </div>
          )}
        </TooltipContent>
      </Tooltip>

      {onAdd && (
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary hover:text-primary-foreground absolute top-1/2 right-1 h-4 w-4 -translate-y-1/2 cursor-pointer transition-colors"
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
  );
};

interface DraggablePaletteItemProps {
  item: PaletteItem;
  /** Optional quick-add handler (shows + button) */
  onAdd?: (item: PaletteItem) => void;
  /** Visual variant */
  variant?: 'compact' | 'full';
}

export const DraggablePaletteItem = ({
  item,
  onAdd,
  variant = 'full',
}: DraggablePaletteItemProps) => {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('text/plain', '');
    event.dataTransfer.setData(PALETTE_DRAG_TYPE, JSON.stringify(item));
    event.dataTransfer.setData('application/json', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const displayName = item.groupName ? `${item.groupName}: ${item.name}` : item.name;

  return (
    <PaletteItemCard
      characterName={item.characterName}
      name={displayName}
      description={item.description}
      variant={variant}
      onAdd={onAdd ? () => onAdd(item) : undefined}
      draggable
      onDragStart={handleDragStart}
    />
  );
};

import { Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import type { RotationItem } from '../types';

interface SidebarDamageInstanceProps {
  item: RotationItem;
  onClick: () => void;
  isDragging: boolean;
}

export const SidebarDamageInstance = ({
  item,
  onClick,
  isDragging,
}: SidebarDamageInstanceProps) => {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="group relative flex w-full min-w-0 cursor-grab items-center active:cursor-grabbing">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className="hover:bg-secondary/80 border-muted-foreground/20 flex w-full min-w-0 justify-start overflow-hidden px-2 py-1 text-[10px] shadow-sm transition-colors"
            >
              <span className="min-w-0 flex-1 truncate pr-5 text-left">
                {item.damageInstanceName}
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[300px] space-y-1">
            <div className="font-bold">
              {item.skillName}: {item.damageInstanceName}
            </div>
            {item.description && (
              <div className="text-muted-foreground text-[10px] leading-relaxed">
                {item.description}
              </div>
            )}
          </TooltipContent>
        </Tooltip>
        <Button
          variant="ghost"
          size="icon"
          disabled={isDragging}
          className="hover:bg-primary hover:text-primary-foreground absolute top-1/2 right-1 h-4 w-4 -translate-y-1/2 cursor-pointer transition-colors disabled:hidden"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <Plus className="h-2.5 w-2.5" />
        </Button>
      </div>
    </TooltipProvider>
  );
};

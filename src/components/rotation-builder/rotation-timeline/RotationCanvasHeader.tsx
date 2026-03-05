import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useStore } from '@/store';

export const RotationCanvasHeader = () => {
  const attacks = useStore((state) => state.attacks);
  const buffs = useStore((state) => state.buffs);
  const clearAll = useStore((state) => state.clearAll);

  return (
    <div className="canvas-header border-border border-b">
      <div className="gap-compact flex items-center">
        <span className="text-sm font-medium">Rotation</span>
        <Tooltip>
          <TooltipContent side="right">
            Drag attacks and buffs from the sidebar onto the canvas to build your
            rotation
          </TooltipContent>
          <TooltipTrigger asChild>
            <Info className="text-muted-foreground size-3.5 shrink-0" />
          </TooltipTrigger>
        </Tooltip>
        <span className="text-muted-foreground text-xs">
          ({attacks.length} {attacks.length === 1 ? 'attack' : 'attacks'},{' '}
          {buffs.length} {buffs.length === 1 ? 'buff' : 'buffs'})
        </span>
      </div>
      <Button variant="destructive" size="xs" onClick={clearAll}>
        Clear All
      </Button>
    </div>
  );
};

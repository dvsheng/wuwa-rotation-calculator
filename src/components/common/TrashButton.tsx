import { Trash2 } from 'lucide-react';
import type { MouseEvent } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TrashButtonProperties {
  onRemove: () => void;
  className?: string;
  stopPropagation?: boolean;
}

export const TrashButton = ({
  onRemove,
  className,
  stopPropagation = true,
}: TrashButtonProperties) => {
  const handlePointerDown = (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }
    onRemove();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
        className,
      )}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      asChild
    >
      <Trash2 />
    </Button>
  );
};

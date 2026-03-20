import { Trash2 } from 'lucide-react';
import type { MouseEvent } from 'react';

import { Button } from '@/components/ui/button';

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
      size="icon-sm"
      className={className}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      <Trash2 className="text-muted-foreground" />
    </Button>
  );
};

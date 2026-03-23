import { Info } from 'lucide-react';
import type { MouseEventHandler, ReactNode } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { Button } from '../ui/button';

interface InfoTooltipProperties {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  contentClassName?: string;
}

export const InfoTooltip = ({
  children,
  onClick,
  contentClassName,
}: InfoTooltipProperties) => {
  return (
    <Tooltip>
      <TooltipContent side="right" className={cn('max-w-md', contentClassName)}>
        {children}
      </TooltipContent>
      <TooltipTrigger asChild>
        {onClick ? (
          <Button variant="ghost" size="icon-sm" onClick={onClick}>
            <Info className="text-muted-foreground size-4" />
          </Button>
        ) : (
          <Info className="text-muted-foreground size-4" />
        )}
      </TooltipTrigger>
    </Tooltip>
  );
};

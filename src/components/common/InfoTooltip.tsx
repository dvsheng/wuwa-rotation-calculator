import { Info } from 'lucide-react';
import type { MouseEventHandler, ReactNode } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface InfoTooltipProperties {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  ariaLabel?: string;
  contentClassName?: string;
}

export const InfoTooltip = ({
  children,
  onClick,
  ariaLabel = 'More information',
  contentClassName,
}: InfoTooltipProperties) => {
  return (
    <Tooltip>
      <TooltipContent side="right" className={cn('max-w-md', contentClassName)}>
        {children}
      </TooltipContent>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          onClick={onClick}
          className="items-center justify-center"
        >
          <Info className="text-muted-foreground size-4" />
        </button>
      </TooltipTrigger>
    </Tooltip>
  );
};

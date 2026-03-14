import { Info } from 'lucide-react';
import type { MouseEventHandler, ReactNode } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
      <TooltipContent side="right" className={contentClassName}>
        {children}
      </TooltipContent>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          onClick={onClick}
          className="inline-flex items-center justify-center"
        >
          <Info className="text-muted-foreground size-4" />
        </button>
      </TooltipTrigger>
    </Tooltip>
  );
};

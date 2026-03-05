import type { ComponentProps } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { DetailedAttack, DetailedModifier } from '@/hooks/useTeamDetails';
import { cn } from '@/lib/utils';

import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface CapabilityTooltipProperties extends ComponentProps<typeof TooltipContent> {
  capability: DetailedAttack | DetailedModifier;
}

export const CapabilityTooltip = ({
  capability,
  children,
  className,
  ...tooltipContentProperties
}: CapabilityTooltipProperties) => {
  const isParameterized = (capability.parameters?.length ?? 0) > 0;

  if (!capability.description && !capability.parentName && !isParameterized) {
    return children;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        className={cn('max-w-80 p-component', className)}
        {...tooltipContentProperties}
      >
        <div className="gap-compact flex min-w-64 flex-col">
          <div className="gap-compact flex items-start justify-between">
            <div className="text-sm font-semibold">{capability.name}</div>
            {isParameterized && (
              <Badge className="bg-background/15 rounded-sm px-compact py-tight text-xs font-semibold tracking-wide uppercase">
                Parameterized
              </Badge>
            )}
          </div>
          {capability.parentName && (
            <div className="text-muted-foreground text-xs">{capability.parentName}</div>
          )}
          <Separator />
          {capability.description && (
            <div className="text-xs">{capability.description}</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

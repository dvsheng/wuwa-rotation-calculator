import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react';
import { useState } from 'react';
import type { ComponentProps } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { DetailedAttack, DetailedModifier } from '@/hooks/useTeamDetails';
import { cn } from '@/lib/utils';

import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface CapabilityTooltipProperties extends ComponentProps<typeof TooltipContent> {
  capability: DetailedAttack | DetailedModifier;
  followCursor?: boolean;
}

const TOOLTIP_CONTENT_CLASS =
  'bg-foreground text-background z-50 w-fit rounded-md px-3 py-1.5 text-xs text-balance';

function CursorTooltip({
  children,
  content,
  className,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles } = useFloating({
    placement: 'top',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  // Wrap in useCallback so the linter doesn't flag refs access during render
  const setFloatingReference = (node: Element | null) => {
    refs.setFloating(node as HTMLElement | null);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    refs.setReference({
      getBoundingClientRect() {
        return {
          width: 0,
          height: 0,
          x: event.clientX,
          y: event.clientY,
          top: event.clientY,
          left: event.clientX,
          right: event.clientX,
          bottom: event.clientY,
        };
      },
    });
  };

  return (
    <>
      {/* display:contents preserves layout while allowing mouse events on the logical wrapper */}
      <div
        style={{ display: 'contents' }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onMouseMove={handleMouseMove}
      >
        {children}
      </div>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={setFloatingReference}
            style={floatingStyles}
            className={cn(TOOLTIP_CONTENT_CLASS, 'p-component max-w-80', className)}
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

export const CapabilityTooltip = ({
  capability,
  children,
  className,
  followCursor = false,
  ...tooltipContentProperties
}: CapabilityTooltipProperties) => {
  const isParameterized = (capability.parameters?.length ?? 0) > 0;

  if (!capability.description && !capability.parentName && !isParameterized) {
    return children;
  }

  const content = (
    <div className="gap-compact flex min-w-64 flex-col">
      <div className="gap-compact flex items-start justify-between">
        <div className="text-sm font-semibold">{capability.name}</div>
        {isParameterized && (
          <Badge className="bg-background/15 px-compact py-tight rounded-sm text-xs font-semibold tracking-wide uppercase">
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
  );

  if (followCursor) {
    return (
      <CursorTooltip content={content} className={className}>
        {children}
      </CursorTooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="top"
        className={cn('p-component max-w-80', className)}
        {...tooltipContentProperties}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
};

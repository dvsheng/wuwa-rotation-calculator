import { AlertTriangle, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import type { Parameter } from '@/schemas/rotation';

import { ParameterConfigurationDialog } from './ParameterConfigurationDialog';

export interface CanvasItemProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  subtext?: string;
  hoverText?: string;
  parameters?: Array<Parameter>;
  onRemove: () => void;
  onSaveParameters: (values: Array<number | undefined>) => void;
  index?: number;
  variant?: 'outline' | 'muted';
  size?: 'default' | 'sm' | 'xs';
}

export const CanvasItem = React.forwardRef<HTMLDivElement, CanvasItemProps>(
  (
    {
      text,
      subtext,
      hoverText,
      parameters,
      onRemove,
      onSaveParameters,
      index,
      variant = 'outline',
      size = 'sm',
      className,
      style,
      onClick,
      children,
      ...props
    },
    ref,
  ) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const hasParameters = (parameters?.length ?? 0) > 0;
    const shouldShowWarning =
      // eslint-disable-next-line
      hasParameters && parameters?.some((p) => p.value === undefined);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (hasParameters) {
        setIsDialogOpen(true);
      }
      onClick?.(e);
    };

    return (
      <>
        <div ref={ref} style={style} className={cn('h-full', className)} {...props}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Item
                variant={variant}
                size={size}
                className={cn(
                  'bg-card h-full transition-colors',
                  hasParameters && 'hover:bg-accent/50 cursor-pointer',
                )}
                onClick={handleClick}
              >
                {index !== undefined && (
                  <Text
                    variant="tiny"
                    className="text-muted-foreground w-6 shrink-0 font-mono"
                  >
                    {index + 1}.
                  </Text>
                )}
                <ItemContent className="min-w-0">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <ItemTitle
                      className={cn(
                        'truncate',
                        size === 'xs' ? 'text-[10px]' : 'text-xs',
                      )}
                    >
                      {text}
                    </ItemTitle>
                    {shouldShowWarning && (
                      <AlertTriangle
                        data-testid="alert-triangle"
                        className="h-3 w-3 shrink-0 text-amber-500"
                      />
                    )}
                  </div>
                  {subtext && size !== 'xs' && (
                    <ItemDescription className="truncate text-[10px]">
                      {subtext}
                    </ItemDescription>
                  )}
                </ItemContent>
                <ItemActions>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                      size === 'xs' ? 'h-4 w-4' : 'h-6 w-6',
                    )}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove();
                    }}
                  >
                    <Trash2
                      className={cn(size === 'xs' ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5')}
                    />
                  </Button>
                </ItemActions>
              </Item>
            </TooltipTrigger>
            <TooltipContent side="right">
              <Text variant="tiny" className="font-bold">
                {subtext ? `${subtext} - ` : ''}
                {text}
              </Text>
              {hoverText && <Text variant="tiny">{hoverText}</Text>}
              {shouldShowWarning && (
                <Text variant="tiny" className="mt-1 font-bold text-amber-500">
                  Configuration required
                </Text>
              )}
              {hasParameters && !shouldShowWarning && (
                <div className="mt-1 space-y-0.5">
                  {parameters?.map((p, i) => (
                    <Text key={i} variant="tiny" className="text-primary font-bold">
                      {parameters.length > 1 ? `Value ${i + 1}: ` : 'Value: '}
                      {p.value}
                    </Text>
                  ))}
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </div>

        {isDialogOpen && (
          <div onClick={(e) => e.stopPropagation()}>
            <ParameterConfigurationDialog
              key="open-dialog"
              title={text}
              description={hoverText}
              parameters={parameters}
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              onSaveParameters={onSaveParameters}
            />
          </div>
        )}
      </>
    );
  },
);

CanvasItem.displayName = 'CanvasItem';

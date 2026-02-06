import { AlertTriangle, Trash2 } from 'lucide-react';
import { useState } from 'react';

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
import type { Parameter } from '@/services/game-data/common-types';

import { ParameterConfigurationDialog } from './ParameterConfigurationDialog';

export interface CanvasItemProperties extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
  text: string;
  subtext?: string;
  hoverText?: string;
  parameters?: Array<Parameter>;
  onRemove: () => void;
  onSaveParameters: (values: Array<number | undefined>) => void;
  index?: number;
  variant?: 'outline' | 'muted';
  size?: 'default' | 'sm' | 'xs';
  /** Additional class names to apply to the inner Item component */
  itemClassName?: string;
  /** Additional inline styles to apply to the inner Item component */
  itemStyle?: React.CSSProperties;
}

export function CanvasItem({
  ref,
  text,
  subtext,
  hoverText,
  parameters,
  onRemove,
  onSaveParameters,
  index,
  variant = 'outline',
  size = 'sm',
  itemClassName,
  itemStyle,
  className,
  style,
  onClick,
  children,
  ...properties
}: CanvasItemProperties) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const hasParameters = (parameters?.length ?? 0) > 0;
  const shouldShowWarning =
    hasParameters && parameters?.some((p) => p.value === undefined);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (hasParameters) {
      setIsDialogOpen(true);
    }
    onClick?.(event);
  };

  return (
    <>
      <div ref={ref} style={style} className={cn('h-full', className)} {...properties}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Item
              variant={variant}
              size={size}
              className={cn(
                'bg-card relative h-full overflow-hidden transition-colors',
                hasParameters && 'hover:bg-accent/50 cursor-pointer',
                itemClassName,
              )}
              style={itemStyle}
              onClick={handleClick}
            >
              {/* Background overlay segments (e.g., alignment indicators) */}
              {children}
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
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
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
                {parameters?.map((p, index_) => (
                  <Text key={index_} variant="tiny" className="text-primary font-bold">
                    {parameters.length > 1 ? `Value ${index_ + 1}: ` : 'Value: '}
                    {p.value}
                  </Text>
                ))}
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      </div>

      {isDialogOpen && (
        <div onClick={(event) => event.stopPropagation()}>
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
}

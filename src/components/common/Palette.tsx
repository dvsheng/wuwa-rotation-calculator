import { Plus } from 'lucide-react';
import React, {
  Children,
  createContext,
  isValidElement,
  useContext,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

// Context for legend filtering
interface PaletteContextValue {
  activeFilters: Set<string>;
  toggleFilter: (label: string) => void;
  clearFilters: () => void;
}

const PaletteContext = createContext<PaletteContextValue | undefined>(undefined);

const usePaletteContext = () => {
  const context = useContext(PaletteContext);
  if (!context) {
    throw new Error('Palette components must be used within a Palette component');
  }
  return context;
};

// Root Palette component
export interface PaletteProperties {
  children?: ReactNode;
  className?: string;
  headerText?: string;
  emptyMessage?: string;
}

const PaletteRoot = ({
  children,
  className,
  headerText,
  emptyMessage = 'No items available',
}: PaletteProperties) => {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const toggleFilter = (label: string) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(label)) {
      newFilters.delete(label);
    } else {
      newFilters.add(label);
    }
    setActiveFilters(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters(new Set());
  };

  const contextValue: PaletteContextValue = {
    activeFilters,
    toggleFilter,
    clearFilters,
  };

  const hasChildren = Children.count(children) > 0;

  const content = hasChildren ? (
    <ScrollArea className="w-full">
      <div className="[&>*:not(:first-child)]:border-border flex flex-col [&>*:not(:first-child)]:border-t">
        {children}
      </div>
    </ScrollArea>
  ) : (
    <div className="text-muted-foreground flex items-center justify-center py-4 text-sm font-medium italic">
      {emptyMessage}
    </div>
  );

  return (
    <PaletteContext.Provider value={contextValue}>
      <div className={cn('w-full', className)}>
        {headerText && (
          <div className="border-border border-t px-4 py-2">
            <Text className="text-sm font-semibold tracking-wider uppercase">
              {headerText}
            </Text>
          </div>
        )}
        <div className="border-border border-t">{content}</div>
      </div>
    </PaletteContext.Provider>
  );
};

// PaletteGroup component
export interface PaletteGroupProperties {
  name: string;
  children?: ReactNode;
  className?: string;
}

export const PaletteGroup = ({ name, children, className }: PaletteGroupProperties) => {
  const context = useContext(PaletteContext);
  const items = Children.toArray(children);

  // Filter items based on active filters
  const visibleItems = items.filter((item) => {
    if (!isValidElement(item) || !context) return true;

    const legendLabel = (item.props as { legendLabel?: string }).legendLabel;
    if (!legendLabel) return true;

    const { activeFilters } = context;
    if (activeFilters.size === 0) return true;

    return activeFilters.has(legendLabel);
  });

  return (
    <div className={cn('flex items-start gap-3 px-3 py-2', className)}>
      <Text className="text-primary w-24 shrink-0 pt-0.5 text-xs font-bold tracking-wider uppercase">
        {name}
      </Text>
      <div className="border-border h-auto self-stretch border-l" />
      <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">{visibleItems}</div>
    </div>
  );
};

PaletteGroup.displayName = 'PaletteGroup';

// PaletteItem component
export interface PaletteItemProperties {
  text?: string;
  hoverText?: string;
  onAdd?: () => void;
  onClick?: () => void;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  children?: ReactNode;
  legendLabel?: string;
  className?: string;
}

export const PaletteItem = ({
  text,
  hoverText,
  onAdd,
  onClick,
  onDragStart,
  children,
  legendLabel: _legendLabel,
  className,
}: PaletteItemProperties) => {
  // If using children-based composition (no text prop)
  if (!text && children) {
    return <div className={className}>{children}</div>;
  }

  // Original PaletteItem behavior with text prop
  const isDraggable = onDragStart !== undefined;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          draggable={isDraggable}
          onDragStart={onDragStart}
          onClick={onClick}
          className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-all hover:brightness-95',
            isDraggable && 'cursor-grab active:cursor-grabbing',
            onClick && 'cursor-pointer',
            className,
          )}
        >
          {text || children}
          {onAdd && (
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary hover:text-primary-foreground -mr-1 ml-1 h-5 w-5 cursor-pointer transition-colors"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onAdd();
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
      </TooltipTrigger>
      {hoverText && (
        <TooltipContent side="right" className="max-w-[300px] p-3">
          <div className="flex flex-col gap-1.5">
            <Text
              variant="tiny"
              className="primary-foreground font-bold tracking-wider uppercase"
            >
              {text}
            </Text>
            <div className="muted-foreground border-border border-t pt-1.5 text-[10px] leading-relaxed">
              {hoverText}
            </div>
          </div>
        </TooltipContent>
      )}
    </Tooltip>
  );
};

PaletteItem.displayName = 'PaletteItem';

// PaletteLegend component
interface LegendItem {
  label: string;
  className: string;
}

export interface PaletteLegendProperties {
  items: Array<LegendItem>;
  className?: string;
}

export const PaletteLegend = ({ items, className }: PaletteLegendProperties) => {
  const { activeFilters, toggleFilter, clearFilters } = usePaletteContext();

  if (items.length === 0) return;

  return (
    <div className={cn('flex flex-col gap-2 px-3 pb-3', className)}>
      <div className="flex items-center justify-between">
        <Text className="text-muted-foreground text-sm font-medium tracking-tight uppercase">
          Filter by:
        </Text>
        {activeFilters.size > 0 && (
          <button
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground text-sm font-medium underline underline-offset-2 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isActive = activeFilters.has(item.label);
          return (
            <button
              key={item.label}
              onClick={() => toggleFilter(item.label)}
              className={cn(
                'ring-primary/20 inline-flex cursor-pointer items-center rounded-md border px-3 py-1 text-sm font-medium transition-all hover:ring-2 hover:ring-offset-1 hover:brightness-95',
                item.className,
                activeFilters.size > 0 && !isActive ? 'opacity-30' : 'opacity-100',
                isActive && 'ring-primary ring-2 ring-offset-1 brightness-95',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

PaletteLegend.displayName = 'PaletteLegend';

export { PaletteRoot as Palette };

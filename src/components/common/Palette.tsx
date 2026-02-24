import { Button } from '@base-ui/react';
import React, {
  Children,
  createContext,
  isValidElement,
  useContext,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import { badgePillVariants } from '@/components/ui/badge-pill';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Text } from '@/components/ui/typography';
import type { DetailedAttack, DetailedModifier } from '@/hooks/useTeamDetails';
import { cn } from '@/lib/utils';

import { CapabilityTooltip } from './CapabilityTooltip';

// Context for legend filtering
interface PaletteContextValue {
  activeFilters: Set<string>;
  setFilters: (labels: Array<string>) => void;
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

  const setFilters = (labels: Array<string>) => {
    setActiveFilters(new Set(labels));
  };

  const clearFilters = () => {
    setActiveFilters(new Set());
  };

  const contextValue: PaletteContextValue = {
    activeFilters,
    setFilters,
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
  capability: DetailedAttack | DetailedModifier;
  text?: string;
  onClick?: () => void;
  onDragStart?: (event: React.DragEvent<HTMLElement>) => void;
  children?: ReactNode;
  legendLabel?: string;
  className?: string;
}

export const PaletteItem = ({
  text,
  capability,
  onClick,
  onDragStart,
  children,
  legendLabel: _legendLabel,
  className,
}: PaletteItemProperties) => {
  const isDraggable = onDragStart !== undefined;
  return (
    <CapabilityTooltip capability={capability}>
      <Button
        draggable={isDraggable}
        onDragStart={onDragStart}
        onClick={onClick}
        className={cn(
          badgePillVariants({
            interaction: isDraggable ? 'draggable' : onClick ? 'clickable' : 'static',
          }),
          className,
        )}
      >
        {text || children}
      </Button>
    </CapabilityTooltip>
  );
};

PaletteItem.displayName = 'PaletteItem';

// PaletteLegend component
interface LegendItem {
  label: string;
  className: string;
}

const getSelectedColorClasses = (className: string) =>
  className
    .split(' ')
    .filter((token) =>
      ['bg-', 'text-', 'border-'].some((prefix) => token.startsWith(prefix)),
    )
    .map((token) => `data-[state=on]:${token}`)
    .join(' ');

export interface PaletteLegendProperties {
  items: Array<LegendItem>;
  className?: string;
}

export const PaletteLegend = ({ items, className }: PaletteLegendProperties) => {
  const { activeFilters, setFilters, clearFilters } = usePaletteContext();

  if (items.length === 0) return;

  return (
    <div
      className={cn(
        'border-border/60 bg-muted/20 mx-3 my-2 flex flex-col gap-2 rounded-md border px-3 py-2',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <Text className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Filter by:
        </Text>
        {activeFilters.size > 0 && (
          <button
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground text-xs font-medium tracking-wide uppercase underline underline-offset-2 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
      <ToggleGroup
        type="multiple"
        className="flex-wrap justify-start gap-1"
        value={[...activeFilters]}
        onValueChange={(values) => setFilters(values)}
      >
        {items.map((item) => (
          <ToggleGroupItem
            key={item.label}
            value={item.label}
            className={cn(
              'h-7 rounded-sm border border-transparent px-2 text-xs font-medium tracking-tight shadow-none transition-all',
              'data-[state=on]:border-foreground/40 data-[state=on]:ring-foreground/35 data-[state=on]:font-semibold data-[state=on]:shadow-sm data-[state=on]:ring-2',
              item.className,
              getSelectedColorClasses(item.className),
            )}
          >
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

PaletteLegend.displayName = 'PaletteLegend';

export { PaletteRoot as Palette };

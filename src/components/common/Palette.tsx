import { ChevronDown, ChevronUp } from 'lucide-react';
import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

export interface PaletteSubgroup<T> {
  name: string;
  items: Array<T>;
}

export interface PaletteGroup<T> {
  name: string;
  subgroups: Array<PaletteSubgroup<T>>;
}

export interface LegendItem {
  label: string;
  className: string;
}

export interface PaletteProperties<T> {
  groups: Array<PaletteGroup<T>>;
  renderItem: (item: T) => ReactNode;
  getItemKey: (item: T) => string;
  getItemLegendLabel?: (item: T) => string;
  emptyMessage?: string;
  className?: string;
  isCollapsible?: boolean;
  headerText?: string;
  headerContent?: ReactNode;
  legend?: Array<LegendItem>;
  defaultOpen?: boolean;
}

export function Palette<T>({
  groups,
  renderItem,
  getItemKey,
  getItemLegendLabel,
  emptyMessage = 'No items available',
  className,
  isCollapsible = false,
  headerText,
  headerContent,
  legend,
  defaultOpen = true,
}: PaletteProperties<T>) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
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

  const filteredGroups = groups
    .map((group) => ({
      ...group,
      subgroups: group.subgroups
        .map((subgroup) => ({
          ...subgroup,
          items: subgroup.items.filter((item) => {
            if (activeFilters.size === 0 || !getItemLegendLabel) return true;
            return activeFilters.has(getItemLegendLabel(item));
          }),
        }))
        .filter((subgroup) => subgroup.items.length > 0),
    }))
    .filter((group) => group.subgroups.length > 0);

  const hasItems = filteredGroups.some((g) =>
    g.subgroups.some((sg) => sg.items.length > 0),
  );

  const legendContent = legend && legend.length > 0 && (
    <div className="flex flex-col gap-1.5 px-3 pb-3">
      <div className="flex items-center justify-between">
        <Text className="text-muted-foreground text-[10px] font-bold tracking-tight uppercase">
          Filter by:
        </Text>
        {activeFilters.size > 0 && (
          <button
            onClick={() => setActiveFilters(new Set())}
            className="text-muted-foreground hover:text-foreground text-[10px] font-medium underline underline-offset-2 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {legend.map((item) => {
          const isActive = activeFilters.has(item.label);
          return (
            <button
              key={item.label}
              onClick={() => toggleFilter(item.label)}
              className={cn(
                'ring-primary/20 inline-flex cursor-pointer items-center rounded-md border px-2 py-0.5 text-[10px] font-bold transition-all hover:ring-2 hover:ring-offset-1 hover:brightness-95',
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

  const content = hasItems ? (
    <ScrollArea className="w-full">
      <div className="flex flex-col">
        {filteredGroups.map((group, groupIndex) => {
          const allItems = group.subgroups.flatMap((sg) => sg.items);
          if (allItems.length === 0) return;

          return (
            <div
              key={group.name}
              className={cn(
                'flex items-start gap-3 px-3 py-2',
                groupIndex > 0 && 'border-border border-t',
              )}
            >
              <Text className="text-primary w-24 shrink-0 pt-0.5 text-[10px] font-bold tracking-wider uppercase">
                {group.name}
              </Text>
              <div className="border-border h-auto self-stretch border-l" />
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {allItems.map((item) => (
                  <Fragment key={getItemKey(item)}>{renderItem(item)}</Fragment>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  ) : (
    <div className="text-muted-foreground flex items-center justify-center py-4 text-sm font-medium italic">
      {emptyMessage}
    </div>
  );

  if (isCollapsible) {
    return (
      <div className={cn('bg-background border-border border', className)}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex w-full items-center justify-between px-4 py-2 hover:bg-transparent"
            >
              <Text className="text-sm font-semibold">{headerText}</Text>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t">
            {legendContent}
            {headerContent}
            {content}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }

  return (
    <div className={cn('bg-background border-border border', className)}>
      {headerText && (
        <div className="border-border border-b px-4 py-2">
          <Text className="text-sm font-semibold">{headerText}</Text>
        </div>
      )}
      {legendContent}
      {headerContent}
      {content}
    </div>
  );
}

import { Filter, X } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string | number;
  label: string;
  icon?: string;
  className?: string;
}

export interface FilterConfig<T> {
  label: string;
  options: Array<FilterOption>;
  getValue: (item: T) => string | number | undefined;
  defaultValue?: string | number;
}

export interface SelectionDialogProperties<
  T extends { id: string | number; name: string },
> {
  // Data
  items: Array<T>;

  // Selection
  value?: number;
  onValueChange: (value: number) => void;

  // Display
  title: string;
  placeholder: string;
  searchPlaceholder?: string;
  triggerClassName?: string;

  // Filtering
  filters?: Array<FilterConfig<T>>;
  excludeIds?: Array<number>;

  // Rendering
  renderItem: (item: T, isSelected: boolean) => ReactNode;
  getItemStyle?: (item: T) => CSSProperties;

  // Sorting
  sortFn?: (a: T, b: T) => number;

  // Layout
  gridCols?: { default: number; md?: number };
}

export const SelectionDialog = <T extends { id: number; name: string }>({
  items,
  value,
  onValueChange,
  title,
  placeholder,
  searchPlaceholder = 'Search...',
  triggerClassName,
  filters = [],
  excludeIds = [],
  renderItem,
  getItemStyle,
  sortFn,
}: SelectionDialogProperties<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getDefaultFilters = () => {
    const defaults = new Map<number, Set<string>>();
    for (const [index, filter] of filters.entries()) {
      if (filter.defaultValue !== undefined) {
        defaults.set(index, new Set([String(filter.defaultValue)]));
      }
    }
    return defaults;
  };

  const [activeFilters, setActiveFilters] =
    useState<Map<number, Set<string>>>(getDefaultFilters);

  const selectedItem = items.find((item) => item.id === value);

  // Multi-criteria filtering
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilters = filters.every((filter, filterIndex) => {
      const selectedValues = activeFilters.get(filterIndex);
      if (!selectedValues || selectedValues.size === 0) return true;
      const itemValue = filter.getValue(item);
      if (itemValue === undefined) return false;
      return selectedValues.has(String(itemValue));
    });
    const isNotExcluded = !excludeIds.includes(item.id);
    return matchesSearch && matchesFilters && isNotExcluded;
  });

  // Apply custom sorting
  const sortedItems = sortFn ? [...filteredItems].toSorted(sortFn) : filteredItems;

  const handleSelect = (item: T) => {
    onValueChange(item.id);
    setIsOpen(false);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setActiveFilters(new Map());
  };

  const hasActiveFilters = [...activeFilters.values()].some(
    (values) => values.size > 0,
  );

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={cn('w-full justify-start truncate font-normal', triggerClassName)}
      >
        <span className="truncate">{selectedItem?.name || placeholder}</span>
      </Button>

      <CommandDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={title}
        description={`Select from ${items.length} options`}
      >
        <CommandInput
          placeholder={searchPlaceholder}
          value={searchTerm}
          onValueChange={setSearchTerm}
        />

        {/* Filter Bar */}
        {filters.length > 0 && (
          <div className="px-component py-compact gap-panel flex flex-wrap items-center border-b text-sm">
            <div className="gap-compact flex items-center">
              <Filter className="text-muted-foreground h-4 w-4" />
              <span className="font-medium">Filters:</span>
            </div>

            {filters.map((filter, filterIndex) => (
              <ToggleGroup
                key={filterIndex}
                type="multiple"
                variant="outline"
                value={[...(activeFilters.get(filterIndex) ?? new Set())]}
                onValueChange={(values) => {
                  setActiveFilters((previous) => {
                    const next = new Map(previous);
                    if (values.length === 0) {
                      next.delete(filterIndex);
                    } else {
                      next.set(filterIndex, new Set(values));
                    }
                    return next;
                  });
                }}
              >
                {filter.options.map((option) => (
                  <ToggleGroupItem
                    key={option.value}
                    value={String(option.value)}
                    className={cn('gap-compact', option.className)}
                  >
                    {option.icon && (
                      <img
                        src={option.icon}
                        alt={option.label}
                        className="h-3.5 w-3.5"
                      />
                    )}
                    <span className="capitalize">{option.label}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            ))}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="px-compact gap-tight h-7 text-xs"
                onClick={resetFilters}
              >
                <X className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>
        )}

        <CommandList className="overflow-y-auto">
          <CommandEmpty>No items found matching your filters.</CommandEmpty>
          <CommandGroup>
            <div className="gap-component grid grid-cols-3">
              {sortedItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => handleSelect(item)}
                  className={cn(
                    'group hover:bg-accent hover:border-primary/50 p-component gap-compact flex flex-col items-center rounded-lg border text-center transition-all',
                    value === item.id && 'border-primary ring-primary bg-accent ring-1',
                  )}
                  style={getItemStyle?.(item)}
                >
                  {renderItem(item, value === item.id)}
                </CommandItem>
              ))}
            </div>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

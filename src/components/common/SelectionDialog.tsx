import { Filter, X } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string | number;
  label: string;
  icon?: string;
  color?: string;
}

export interface FilterConfig<T> {
  label: string;
  options: Array<FilterOption>;
  getValue: (item: T) => string | number | undefined;
  renderBadge?: (option: FilterOption, isSelected: boolean) => ReactNode;
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
  gridCols = { default: 2, md: 3 },
}: SelectionDialogProperties<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getDefaultFilters = () => {
    const defaults = new Map<number, string | number>();
    for (const [index, filter] of filters.entries()) {
      if (filter.defaultValue !== undefined) {
        defaults.set(index, filter.defaultValue);
      }
    }
    return defaults;
  };

  const [activeFilters, setActiveFilters] =
    useState<Map<number, string | number>>(getDefaultFilters);

  const selectedItem = items.find((item) => item.id === value);

  // Multi-criteria filtering
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilters = [...activeFilters.entries()].every(
      ([filterIndex, filterValue]) => {
        const filter = filters[filterIndex];
        return filter.getValue(item) === filterValue;
      },
    );
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
    setActiveFilters(getDefaultFilters());
  };

  const toggleFilter = (filterIndex: number, filterValue: string | number) => {
    const newFilters = new Map(activeFilters);
    if (newFilters.get(filterIndex) === filterValue) {
      newFilters.delete(filterIndex);
    } else {
      newFilters.set(filterIndex, filterValue);
    }
    setActiveFilters(newFilters);
  };

  const hasActiveFilters = activeFilters.size > 0;

  // Build grid class name
  const gridClassName = cn(
    'grid gap-2 p-2',
    gridCols.default === 2 && 'grid-cols-2',
    gridCols.default === 3 && 'grid-cols-3',
    gridCols.default === 4 && 'grid-cols-4',
    gridCols.md === 2 && 'md:grid-cols-2',
    gridCols.md === 3 && 'md:grid-cols-3',
    gridCols.md === 4 && 'md:grid-cols-4',
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
        className="max-w-2xl"
      >
        <CommandInput
          placeholder={searchPlaceholder}
          value={searchTerm}
          onValueChange={setSearchTerm}
        />

        {/* Filter Bar */}
        {filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 border-b px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <Filter className="text-muted-foreground h-4 w-4" />
              <span className="font-medium">Filters:</span>
            </div>

            {filters.map((filter, filterIndex) => (
              <div key={filterIndex} className="flex gap-1">
                {filter.options.map((option) => {
                  const isSelected = activeFilters.get(filterIndex) === option.value;

                  if (filter.renderBadge) {
                    return (
                      <div
                        key={option.value}
                        onClick={() => toggleFilter(filterIndex, option.value)}
                        className="cursor-pointer"
                      >
                        {filter.renderBadge(option, isSelected)}
                      </div>
                    );
                  }

                  return (
                    <Badge
                      key={option.value}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleFilter(filterIndex, option.value)}
                    >
                      {option.label}
                    </Badge>
                  );
                })}
              </div>
            ))}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={resetFilters}
              >
                <X className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>
        )}

        <CommandList className="max-h-[60vh]">
          <CommandEmpty>No items found matching your filters.</CommandEmpty>
          <CommandGroup>
            <div className={gridClassName}>
              {sortedItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => handleSelect(item)}
                  className={cn(
                    'group hover:bg-accent hover:border-primary/50 flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all',
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

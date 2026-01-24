import { Filter, Search, X } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  getValue: (item: T) => string | number | null;
  renderBadge?: (option: FilterOption, isSelected: boolean) => ReactNode;
}

export interface SelectionDialogProps<T extends { id: string | number; name: string }> {
  // Core functionality
  items: Array<T>;
  selectedItemName?: string;
  onSelect: (id: string | number, name: string) => void;

  // Dialog configuration
  title: string;
  placeholder: string;
  searchPlaceholder?: string;
  triggerClassName?: string;

  // Filtering
  filters?: Array<FilterConfig<T>>;
  excludeNames?: Array<string>;

  // Item rendering
  renderItem: (item: T, isSelected: boolean) => ReactNode;
  getItemStyle?: (item: T) => CSSProperties;

  // Sorting
  sortFn?: (a: T, b: T) => number;

  // Grid layout
  gridCols?: { default: number; md?: number };
}

export const SelectionDialog = <T extends { id: string | number; name: string }>({
  items,
  selectedItemName,
  onSelect,
  title,
  placeholder,
  searchPlaceholder = 'Search...',
  triggerClassName,
  filters = [],
  excludeNames = [],
  renderItem,
  getItemStyle,
  sortFn,
  gridCols = { default: 2, md: 3 },
}: SelectionDialogProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Map<number, string | number>>(
    new Map(),
  );

  // Multi-criteria filtering
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilters = Array.from(activeFilters.entries()).every(
      ([filterIndex, filterValue]) => {
        const filter = filters[filterIndex];
        return filter.getValue(item) === filterValue;
      },
    );
    const isNotExcluded = !excludeNames.includes(item.name);
    return matchesSearch && matchesFilters && isNotExcluded;
  });

  // Apply custom sorting
  const sortedItems = sortFn ? [...filteredItems].sort(sortFn) : filteredItems;

  const handleSelect = (id: string | number, name: string) => {
    onSelect(id, name);
    setIsOpen(false);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setActiveFilters(new Map());
  };

  const toggleFilter = (filterIndex: number, value: string | number) => {
    const newFilters = new Map(activeFilters);
    if (newFilters.get(filterIndex) === value) {
      newFilters.delete(filterIndex);
    } else {
      newFilters.set(filterIndex, value);
    }
    setActiveFilters(newFilters);
  };

  const hasActiveFilters = activeFilters.size > 0 || !!searchTerm;

  // Build grid class name
  const gridClassName = cn(
    'grid gap-2 p-4',
    gridCols.default === 2 && 'grid-cols-2',
    gridCols.default === 3 && 'grid-cols-3',
    gridCols.default === 4 && 'grid-cols-4',
    gridCols.md === 2 && 'md:grid-cols-2',
    gridCols.md === 3 && 'md:grid-cols-3',
    gridCols.md === 4 && 'md:grid-cols-4',
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-start truncate font-normal', triggerClassName)}
        >
          <span className="truncate">{selectedItemName || placeholder}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[80vh] max-w-2xl flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col space-y-4 overflow-hidden p-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Bar */}
          {filters.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 text-sm">
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

          {/* Items Grid */}
          <ScrollArea className="h-full flex-1 rounded-md border">
            <div className={gridClassName}>
              {sortedItems.length > 0 ? (
                sortedItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id, item.name)}
                    className={cn(
                      'group hover:bg-accent hover:border-primary/50 flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all',
                      selectedItemName === item.name &&
                        'border-primary ring-primary bg-accent ring-1',
                    )}
                    style={getItemStyle?.(item)}
                  >
                    {renderItem(item, selectedItemName === item.name)}
                  </button>
                ))
              ) : (
                <div className="text-muted-foreground col-span-full py-12 text-center">
                  No items found matching your filters.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Item {
  id: number;
  name: string;
}

interface SearchableSelectProperties {
  items: Array<Item>;
  onItemClick: (item: Item) => void;
  value?: number;
  placeholder?: string;
  className?: string;
  renderItem?: (item: Item) => React.ReactNode;
}

export const SearchableSelect = ({
  items,
  onItemClick,
  value,
  placeholder = 'Select...',
  className,
  renderItem,
}: SearchableSelectProperties) => {
  const [open, setOpen] = React.useState(false);
  const selectedItem = items.find((item) => item.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('flex-1', className)}>
          <span className="truncate">
            {selectedItem ? selectedItem.name : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={item.name}
                onSelect={() => {
                  onItemClick(item);
                  setOpen(false);
                }}
              >
                {renderItem ? renderItem(item) : item.name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

import * as React from 'react';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
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
  const selectedItem = items.find((item) => item.id === value);

  return (
    <Combobox
      items={items}
      itemToStringLabel={(item: Item) => item.name}
      value={selectedItem}
    >
      <ComboboxInput
        placeholder={placeholder}
        className={cn('h-8 w-full', className)}
      />
      <ComboboxContent>
        <ComboboxEmpty>No results found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.id} value={item} onClick={() => onItemClick(item)}>
              {renderItem ? renderItem(item) : item.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

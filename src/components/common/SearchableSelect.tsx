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
  id: string;
  name: string;
}

interface SearchableSelectProps {
  items: Array<Item>;
  onItemClick: (item: Item) => void;
  selectedItem?: Item;
  placeholder?: string;
  className?: string;
}

export const SearchableSelect = ({
  items,
  onItemClick,
  selectedItem,
  placeholder = 'Select...',
  className,
}: SearchableSelectProps) => {
  return (
    <Combobox items={items} itemToStringLabel={(item: Item) => item.name}>
      <ComboboxInput
        placeholder={placeholder}
        value={selectedItem?.name}
        className={cn('h-8 w-full', className)}
      />
      <ComboboxContent>
        <ComboboxEmpty>No results found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.id} value={item} onClick={() => onItemClick(item)}>
              {item.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

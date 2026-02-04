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

interface SearchableSelectProperties {
  items: Array<Item>;
  onItemClick: (item: Item) => void;
  value?: string;
  placeholder?: string;
  className?: string;
}

export const SearchableSelect = ({
  items,
  onItemClick,
  value,
  placeholder = 'Select...',
  className,
}: SearchableSelectProperties) => {
  return (
    <Combobox items={items} itemToStringLabel={(item: Item) => item.name}>
      <ComboboxInput
        placeholder={placeholder}
        value={value}
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

import { useId } from 'react';
import Select from 'react-select';

interface SearchableItem {
  id: string | number;
  name: string;
  [key: string]: any;
}

interface SearchableSelectProps<T extends SearchableItem> {
  options: Array<T>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  groupBy?: keyof T;
}

export const SearchableSelect = <T extends SearchableItem>({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className,
  groupBy,
}: SearchableSelectProps<T>) => {
  const instanceId = useId();

  const selectOptions = (() => {
    if (!groupBy) {
      return options.map((item) => ({
        value: item.name,
        label: item.name,
      }));
    }

    const groups: Record<string, Array<{ value: string; label: string }>> = {};
    options.forEach((item) => {
      const groupKey = String(item[groupBy]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push({
        value: item.name,
        label: item.name,
      });
    });

    return Object.entries(groups).map(([label, opts]) => ({
      label,
      options: opts,
    }));
  })();

  const selectedOption = (() => {
    if (!groupBy) {
      return (
        (selectOptions as Array<{ value: string; label: string }>).find(
          (opt) => opt.value === value,
        ) || null
      );
    }

    for (const group of selectOptions as Array<{
      label: string;
      options: Array<{ value: string; label: string }>;
    }>) {
      const found = group.options.find((opt) => opt.value === value);
      if (found) return found;
    }
    return null;
  })();

  return (
    <Select
      instanceId={instanceId}
      className={className}
      options={selectOptions}
      value={selectedOption}
      onChange={(opt: any) => onChange(opt?.value || '')}
      placeholder={placeholder}
      isSearchable
      unstyled
      classNames={{
        control: ({ isFocused }) =>
          `flex min-h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-1 focus-within:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
            isFocused ? 'ring-1 ring-ring border-ring' : ''
          }`,
        menu: () =>
          'mt-2 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95',
        menuList: () => 'p-1',
        option: ({ isFocused, isSelected }) =>
          `relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none transition-colors ${
            isSelected
              ? 'bg-primary text-primary-foreground'
              : isFocused
                ? 'bg-accent text-accent-foreground'
                : ''
          }`,
        groupHeading: () =>
          'px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/30',
        noOptionsMessage: () => 'p-4 text-xs text-center text-muted-foreground',
        placeholder: () => 'text-muted-foreground',
        input: () => 'text-foreground',
        singleValue: () => 'text-foreground font-bold',
      }}
    />
  );
};

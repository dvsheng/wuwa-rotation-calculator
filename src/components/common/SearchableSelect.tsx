import { useId, useMemo } from 'react';
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
  groupOrder?: 'asc' | 'desc';
}

export const getSelectOptions = <T extends SearchableItem>(
  options: Array<T>,
  groupBy?: keyof T,
  groupOrder?: 'asc' | 'desc',
) => {
  if (!groupBy) {
    return options.map((item) => ({
      value: item.name,
      label: item.name,
    }));
  }

  const groups: Record<string, Array<{ value: string; label: string }>> = {};
  options.forEach((item) => {
    const groupKey = String(item[groupBy]);
    if (!(groupKey in groups)) {
      groups[groupKey] = [];
    }
    groups[groupKey].push({
      value: item.name,
      label: item.name,
    });
  });

  const sortedGroupEntries = Object.entries(groups).sort(([a], [b]) => {
    // If both are numbers, compare as numbers
    const numA = Number(a);
    const numB = Number(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return groupOrder === 'desc' ? numB - numA : numA - numB;
    }
    // Otherwise alphabetical
    return groupOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b);
  });

  return sortedGroupEntries.map(([label, opts]) => ({
    label,
    options: opts,
  }));
};

export const SearchableSelect = <T extends SearchableItem>({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className,
  groupBy,
  groupOrder = 'asc',
}: SearchableSelectProps<T>) => {
  const instanceId = useId();

  const { selectOptions, selectedOption } = useMemo(() => {
    const processedOptions = getSelectOptions(options, groupBy, groupOrder);

    let foundSelected: { value: string; label: string } | null = null;
    if (!groupBy) {
      foundSelected =
        (processedOptions as Array<{ value: string; label: string }>).find(
          (opt) => opt.value === value,
        ) || null;
    } else {
      for (const group of processedOptions as Array<{
        label: string;
        options: Array<{ value: string; label: string }>;
      }>) {
        const found = group.options.find((opt) => opt.value === value);
        if (found) {
          foundSelected = found;
          break;
        }
      }
    }

    return {
      selectOptions: processedOptions,
      selectedOption: foundSelected,
    };
  }, [options, value, groupBy, groupOrder]);

  return (
    <Select
      instanceId={instanceId}
      className={className}
      options={selectOptions as any}
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
          'px-2 py-2 text-xs font-bold uppercase tracking-wider text-primary bg-muted border-b border-border mb-1',
        noOptionsMessage: () => 'p-4 text-xs text-center text-muted-foreground',
        placeholder: () => 'text-muted-foreground',
        input: () => 'text-foreground',
        singleValue: () => 'text-foreground font-bold',
      }}
    />
  );
};

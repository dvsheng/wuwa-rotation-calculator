import { compact } from 'es-toolkit/array';
import { Filter, X } from 'lucide-react';
import { useState } from 'react';

import { AttributeIcon, WeaponTypeIcon } from '@/components/common/AssetIcon';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Grid, Row } from '@/components/ui/layout';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Text } from '@/components/ui/typography';
import type { ListEntityResponseItem } from '@/services/game-data';
import { Attribute, WeaponType } from '@/types';

import { EntitySelectorTile } from './EntitySelectorTile';

export interface EntitySelectionDialogProperties {
  items: Array<ListEntityResponseItem>;
  value: number;
  onValueChange: (value: number) => void;
  excludeIds?: Array<number>;
}

const getItemTier = (item: ListEntityResponseItem): number | undefined => {
  if ('rarity' in item) return item.rarity;
  if ('cost' in item) return item.cost;
  return undefined;
};

export const EntitySelectionDialog = ({
  items,
  value,
  onValueChange,
  excludeIds = [],
}: EntitySelectionDialogProperties) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Map<string, Set<string>>>(
    new Map(),
  );

  const handleSelect = (item: ListEntityResponseItem) => {
    onValueChange(item.id);
    setIsOpen(false);
  };

  const toggleFilter = (key: string, values: Array<string>) => {
    setActiveFilters((previous) => {
      const next = new Map(previous);
      if (values.length === 0) {
        next.delete(key);
      } else {
        next.set(key, new Set(values));
      }
      return next;
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setActiveFilters(new Map());
  };

  const shouldShowWeaponTypeFilter = items[0] && 'weaponType' in items[0];
  const shouldShowAttributeFilter = items[0] && 'attribute' in items[0];
  const costFilterOptions = compact([
    ...new Set(items.map((item) => ('cost' in item ? item.cost : undefined))),
  ]).toSorted();

  const filteredItems = items
    .filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilters = activeFilters.entries().every(([key, values]) => {
        if (values.size === 0) return true;
        return (
          key in item &&
          values.has(String((item as unknown as Record<string, string>)[key]))
        );
      });
      const isNotExcluded = !excludeIds.includes(item.id);
      return matchesSearch && matchesFilters && isNotExcluded;
    })
    .toSorted((a, b) => {
      const tierA = getItemTier(a);
      const tierB = getItemTier(b);

      if (tierA === undefined && tierB === undefined) return 0;
      if (tierA === undefined) return 1;
      if (tierB === undefined) return -1;
      if (tierA === tierB) {
        return 0;
      }

      return tierB - tierA;
    });

  const selectedItem = items.find((item) => item.id === value);

  const hasActiveFilters =
    [...activeFilters.values()].some((values) => values.size > 0) || !!searchTerm;
  const hasFilters =
    costFilterOptions.length > 0 ||
    shouldShowWeaponTypeFilter ||
    shouldShowAttributeFilter;

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)} className="flex-1">
        <Text as="span" className="truncate">
          {selectedItem?.name ?? 'Click to select'}
        </Text>
      </Button>
      <CommandDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        className="flex h-192 w-fit flex-col sm:max-w-fit"
      >
        <CommandInput
          placeholder="Search..."
          value={searchTerm}
          onValueChange={setSearchTerm}
        />

        {/* Filter Bar */}
        {hasFilters && (
          <Row
            gap="inset"
            align="center"
            wrap
            className="px-component py-inset border-b"
          >
            <Filter className="h-4 w-4" />
            {shouldShowAttributeFilter && (
              <ToggleGroup
                type="multiple"
                variant="outline"
                value={[...(activeFilters.get('attribute') ?? new Set())]}
                onValueChange={(values) => toggleFilter('attribute', values)}
              >
                {Object.values(Attribute)
                  .filter((attribute) => attribute !== 'physical')
                  .map((attribute) => (
                    <ToggleGroupItem key={attribute} value={attribute}>
                      <AttributeIcon attribute={attribute} />
                    </ToggleGroupItem>
                  ))}
              </ToggleGroup>
            )}

            {costFilterOptions.length > 0 && (
              <ToggleGroup
                type="multiple"
                variant="outline"
                value={[...(activeFilters.get('cost') ?? new Set())]}
                onValueChange={(values) => toggleFilter('cost', values)}
              >
                {costFilterOptions.map((cost) => (
                  <ToggleGroupItem key={cost} value={String(cost)}>
                    Cost {cost}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}

            {shouldShowWeaponTypeFilter && (
              <ToggleGroup
                type="multiple"
                variant="outline"
                value={[...(activeFilters.get('weaponType') ?? new Set())]}
                onValueChange={(values) => toggleFilter('weaponType', values)}
              >
                {Object.values(WeaponType).map((weaponType) => (
                  <ToggleGroupItem key={weaponType} value={weaponType}>
                    <WeaponTypeIcon weaponType={weaponType} />
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="h-3 w-3" /> Clear
              </Button>
            )}
          </Row>
        )}

        <CommandList className="max-h-none flex-1">
          <CommandEmpty>No items found matching your filters.</CommandEmpty>
          <CommandGroup>
            <Grid gap="component" className="grid-cols-4 overflow-y-auto">
              {filteredItems.map((item) => (
                <CommandItem asChild key={item.id} value={item.name}>
                  <EntitySelectorTile
                    entity={item}
                    onClick={() => handleSelect(item)}
                  />
                </CommandItem>
              ))}
            </Grid>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

import { CharacterIcon } from '@/components/common/CharacterIcon';
import { SelectionDialog } from '@/components/common/SelectionDialog';
import type { FilterConfig } from '@/components/common/SelectionDialog';
import { Text } from '@/components/ui/typography';
import { useEntityList } from '@/hooks/useEntityList';
import { cn } from '@/lib/utils';
import { EntityType } from '@/services/game-data';
import type { ListCharactersResponseItem } from '@/services/game-data';
import { resolveImagePath } from '@/services/image-service';
import { Attribute } from '@/types';

import { ATTRIBUTE_COLORS } from './constants';

interface CharacterSelectionDialogProperties {
  value?: number;
  onValueChange: (id: number) => void;
  excludeIds?: Array<number>;
}

const ATTRIBUTES = Object.values(Attribute).filter(
  (attribute) => attribute !== Attribute.PHYSICAL,
);
const RARITIES = [5, 4];
const ATTRIBUTE_FILTER_CLASSNAMES: Record<Attribute, string> = {
  fusion: 'border-attribute-fusion/70 text-foreground',
  glacio: 'border-attribute-glacio/70 text-foreground',
  aero: 'border-attribute-aero/70 text-foreground',
  electro: 'border-attribute-electro/70 text-foreground',
  spectro: 'border-attribute-spectro/70 text-foreground',
  havoc: 'border-attribute-havoc/70 text-foreground',
  physical: 'border-attribute-physical/70 text-foreground',
};

export const CharacterSelectionDialog = ({
  value,
  onValueChange,
  excludeIds = [],
}: CharacterSelectionDialogProperties) => {
  const { data: characterList = [] } = useEntityList({
    entityType: EntityType.CHARACTER,
  });
  const attributeFilter: FilterConfig<ListCharactersResponseItem> = {
    label: 'Attribute',
    options: ATTRIBUTES.map((attribute) => ({
      value: attribute,
      label: attribute,
      icon: resolveImagePath('attribute', 'icon', attribute),
      className: cn(
        ATTRIBUTE_FILTER_CLASSNAMES[attribute],
        '[&>span]:hidden [&>img]:h-5 [&>img]:w-5',
      ),
    })),
    getValue: (char) => char.attribute,
  };

  const rarityFilter: FilterConfig<ListCharactersResponseItem> = {
    label: 'Rarity',
    options: RARITIES.map((r) => ({ value: r, label: `${r}★` })),
    getValue: (char) => char.rarity,
  };

  return (
    <SelectionDialog
      items={characterList}
      value={value}
      onValueChange={onValueChange}
      excludeIds={excludeIds}
      title="Select Character"
      placeholder="Select character"
      searchPlaceholder="Search characters..."
      filters={[attributeFilter, rarityFilter]}
      renderItem={(char) => (
        <>
          <CharacterIcon characterEntityId={char.id} size="large" />
          <div className="space-y-1">
            <Text
              as="div"
              variant="small"
              className="text-foreground max-w-30 truncate"
            >
              {char.name}
            </Text>
            <div className="gap-tight flex items-center justify-center">
              <span
                className={cn(
                  'px-compact py-tight rounded-full text-xs uppercase',
                  char.rarity === 5
                    ? 'text-foreground bg-rarity-5/10'
                    : 'text-foreground bg-rarity-4/10',
                )}
              >
                {char.rarity}★
              </span>
              <Text as="span" variant="caption" className="capitalize">
                {char.attribute}
              </Text>
            </div>
          </div>
        </>
      )}
      getItemStyle={(char) => ({
        borderLeft: `4px solid ${ATTRIBUTE_COLORS[char.attribute]}`,
      })}
      sortFn={(a, b) => {
        if (a.attribute !== b.attribute) {
          return a.attribute.localeCompare(b.attribute);
        }
        if (a.rarity !== b.rarity) {
          return b.rarity - a.rarity;
        }
        return a.name.localeCompare(b.name);
      }}
      gridCols={{ default: 2, md: 3 }}
    />
  );
};

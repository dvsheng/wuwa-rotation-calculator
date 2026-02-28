import { GameImage } from '@/components/common/GameImage';
import { SelectionDialog } from '@/components/common/SelectionDialog';
import type { FilterConfig } from '@/components/common/SelectionDialog';
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
          <div className="group-hover:bg-background bg-muted relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full transition-colors">
            <GameImage
              entity="character"
              type="icon"
              id={char.id}
              alt={char.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-1">
            <div className="max-w-30 truncate text-sm">{char.name}</div>
            <div className="flex items-center justify-center gap-1">
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs uppercase',
                  char.rarity === 5
                    ? 'text-foreground bg-rarity-5/10'
                    : 'text-foreground bg-rarity-4/10',
                )}
              >
                {char.rarity}★
              </span>
              <span className="text-muted-foreground text-xs capitalize">
                {char.attribute}
              </span>
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

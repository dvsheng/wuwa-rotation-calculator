import { GameImage } from '@/components/common/GameImage';
import type { FilterConfig } from '@/components/common/SelectionDialog';
import { SelectionDialog } from '@/components/common/SelectionDialog';
import { Badge } from '@/components/ui/badge';
import { useCharacterList } from '@/hooks/useCharacterList';
import { cn } from '@/lib/utils';
import { resolveImagePath } from '@/services/image-service';
import { Attribute } from '@/types';

import { ATTRIBUTE_COLORS } from './constants';

interface CharacterSelectionDialogProps {
  onSelect: (id: string, name: string) => void;
  selectedCharacterName?: string;
  excludeNames?: Array<string>;
}

const ATTRIBUTES = Object.values(Attribute);
const RARITIES = [5, 4];

type CharacterListItem = {
  id: number;
  name: string;
  attribute: Attribute;
  rarity: number;
};

export const CharacterSelectionDialog = ({
  onSelect,
  selectedCharacterName,
  excludeNames = [],
}: CharacterSelectionDialogProps) => {
  const { data: characterList = [] } = useCharacterList();

  const handleSelect = (id: string | number, name: string) => {
    onSelect(id.toString(), name);
  };

  // Attribute filter with custom badge rendering
  const attributeFilter: FilterConfig<CharacterListItem> = {
    label: 'Attribute',
    options: ATTRIBUTES.map((attr) => ({
      value: attr,
      label: attr,
      icon: resolveImagePath('attribute', 'icon', attr),
      color: ATTRIBUTE_COLORS[attr],
    })),
    getValue: (char) => char.attribute,
    renderBadge: (option, isSelected) => (
      <Badge
        variant={isSelected ? undefined : 'outline'}
        className="cursor-pointer gap-1.5 transition-all"
        style={{
          backgroundColor: isSelected ? option.color : undefined,
          borderColor: option.color,
          color: isSelected ? 'white' : option.color,
          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        <img
          src={option.icon}
          alt={option.label}
          className={cn('h-3.5 w-3.5', !isSelected && 'brightness-100 contrast-125')}
        />
        <span className="capitalize">{option.label}</span>
      </Badge>
    ),
  };

  // Rarity filter with default badge rendering
  const rarityFilter: FilterConfig<CharacterListItem> = {
    label: 'Rarity',
    options: RARITIES.map((r) => ({ value: r, label: `${r}★` })),
    getValue: (char) => char.rarity,
  };

  return (
    <SelectionDialog
      items={characterList}
      selectedItemName={selectedCharacterName}
      onSelect={handleSelect}
      excludeNames={excludeNames}
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
            <div className="max-w-[120px] truncate text-sm font-bold">{char.name}</div>
            <div className="flex items-center justify-center gap-1">
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase',
                  char.rarity === 5
                    ? 'bg-yellow-500/10 text-yellow-600'
                    : 'bg-purple-500/10 text-purple-600',
                )}
              >
                {char.rarity}★
              </span>
              <span className="text-muted-foreground text-[10px] capitalize">
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
        // Sort by attribute first (alphabetical)
        if (a.attribute !== b.attribute) {
          return a.attribute.localeCompare(b.attribute);
        }
        // Then by rarity descending (5* before 4*)
        if (a.rarity !== b.rarity) {
          return b.rarity - a.rarity;
        }
        // Finally by name
        return a.name.localeCompare(b.name);
      }}
      gridCols={{ default: 2, md: 3 }}
    />
  );
};

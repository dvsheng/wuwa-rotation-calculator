import { Badge } from '@/components/ui/badge';
import { ItemGroup } from '@/components/ui/item';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import type { Character } from '@/types/client';

import { DraggablePaletteItem } from './PaletteItem';
import type { PaletteItem } from './types';
import { useCharacterPaletteItems } from './useCharacterPaletteItems';

interface CharacterPaletteProps {
  character: Character;
  /** Which items to show */
  itemType: 'attacks' | 'buffs';
  /** Handler for quick-add button (optional) */
  onAdd?: (item: PaletteItem) => void;
  /** Visual variant */
  variant?: 'compact' | 'full';
  /** Whether to group items by source/skill */
  grouped?: boolean;
}

export const CharacterPalette = ({
  character,
  itemType,
  onAdd,
  variant = 'full',
  grouped = true,
}: CharacterPaletteProps) => {
  const { attacks, buffs, isLoading } = useCharacterPaletteItems(character);

  if (isLoading) {
    return (
      <Text variant="muted" className="p-2 text-[10px]">
        Loading {character.name}...
      </Text>
    );
  }

  const items = itemType === 'attacks' ? attacks : buffs;

  if (items.length === 0) {
    return null;
  }

  if (!grouped) {
    return (
      <TooltipProvider delayDuration={100}>
        <ItemGroup className="bg-muted/30 border-primary/5 flex min-w-[200px] flex-1 flex-col gap-2 p-3 shadow-none">
          <Text className="text-primary/70 text-[10px] font-bold tracking-wider uppercase">
            {character.name}
          </Text>
          <div className="flex flex-wrap gap-1.5">
            {items.map((item) => (
              <DraggablePaletteItem
                key={item.id}
                item={item}
                onAdd={onAdd}
                variant={variant}
              />
            ))}
          </div>
        </ItemGroup>
      </TooltipProvider>
    );
  }

  // Group items by groupName
  const groups = Map.groupBy(items, (item) => item.groupName || item.name);

  // Sort groups by source priority
  const SOURCE_ORDER: Record<string, number> = {
    character: 1,
    weapon: 2,
    'echo-set': 3,
    echo: 4,
  };

  const sortedGroups = Array.from(groups.entries()).sort(([, aItems], [, bItems]) => {
    const aOrder = SOURCE_ORDER[aItems[0]?.source] ?? 99;
    const bOrder = SOURCE_ORDER[bItems[0]?.source] ?? 99;
    return aOrder - bOrder;
  });

  return (
    <TooltipProvider delayDuration={100}>
      <div className="min-w-0 space-y-4 p-2">
        <div className="flex items-center justify-between px-1">
          <Text variant="small" className="font-bold">
            {character.name}
          </Text>
        </div>

        <div className="min-w-0 space-y-4">
          {sortedGroups.map(([groupName, groupItems]) => {
            if (groupItems.length === 0) return null;
            const first = groupItems[0];
            const sourceLabel =
              first.source === 'character'
                ? (first.metadata?.originType as string) || 'Skill'
                : first.source === 'weapon'
                  ? 'Weapon'
                  : first.source === 'echo-set'
                    ? 'Echo Set'
                    : 'Echo';

            return (
              <div key={groupName} className="space-y-1">
                <div className="flex items-center justify-between px-1">
                  <Text
                    variant="small"
                    className="text-muted-foreground text-[10px] font-semibold uppercase"
                  >
                    {groupName}
                  </Text>
                </div>

                <div className="grid min-w-0 gap-1 pl-2">
                  {groupItems.map((item) => (
                    <DraggablePaletteItem
                      key={item.id}
                      item={item}
                      onAdd={onAdd}
                      variant={variant}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

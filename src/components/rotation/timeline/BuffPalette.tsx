import { PaletteItem } from '@/components/common/PaletteItem';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { BuffSchema } from '@/schemas/rotation';
import type { Buff } from '@/schemas/rotation';

export interface BuffPaletteProps {
  buffs: Array<Buff>;
  onAdd: (buff: Buff) => void;
  isLoading?: boolean;
}

export const BuffPalette = ({ buffs, onAdd, isLoading }: BuffPaletteProps) => {
  const { handleDragStart } = useDragAndDrop({ schema: BuffSchema });

  if (isLoading) {
    return (
      <div className="flex h-24 items-center justify-center p-4">
        <Text variant="muted" className="text-xs italic">
          Loading buffs...
        </Text>
      </div>
    );
  }

  const buffsByCharacter = Object.groupBy(buffs, (b) => b.characterName ?? 'General');

  if (buffs.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center p-4 text-sm">
        No buffs available
      </div>
    );
  }

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 p-2">
        {Object.entries(buffsByCharacter).map(([charName, charBuffs]) => {
          if (!charBuffs) return null;
          const buffsByParent = Object.groupBy(
            charBuffs,
            (b) => b.parentName ?? 'Other',
          );

          return (
            <div
              key={charName}
              className="bg-muted/30 border-primary/5 flex min-w-[220px] shrink-0 flex-col gap-2 rounded-lg p-3"
            >
              <Text className="text-primary/70 text-[10px] font-bold tracking-wider uppercase">
                {charName}
              </Text>

              <div className="space-y-4">
                {Object.entries(buffsByParent).map(([parentName, parentBuffs]) => {
                  if (!parentBuffs) return null;
                  return (
                    <div key={parentName} className="space-y-1.5">
                      <Text
                        variant="small"
                        className="text-muted-foreground text-[9px] font-semibold uppercase"
                      >
                        {parentName}
                      </Text>

                      <div className="flex flex-wrap gap-1">
                        {parentBuffs.map((buff) => (
                          <div key={buff.id} className="min-w-0">
                            <PaletteItem
                              text={buff.name}
                              hoverText={buff.description}
                              onDragStart={(e) => handleDragStart(buff, e)}
                              onAdd={() => onAdd(buff)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

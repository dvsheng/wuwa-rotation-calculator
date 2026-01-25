import { PaletteItem } from '@/components/common/PaletteItem';
import { Text } from '@/components/ui/typography';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { BuffSchema } from '@/schemas/rotation';
import type { Buff } from '@/schemas/rotation';

export interface BuffPaletteProps {
  buffs: Array<Buff>;
  onClickBuff?: (buff: Buff) => void;
}

export const BuffPalette = ({ buffs, onClickBuff }: BuffPaletteProps) => {
  const { handleDragStart } = useDragAndDrop({ schema: BuffSchema });

  const buffsByCharacter = Object.groupBy(buffs, (b) => b.characterName ?? 'General');

  if (buffs.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center p-4 text-sm">
        No buffs available
      </div>
    );
  }

  return (
    <div className="w-full space-y-1.5">
      {Object.entries(buffsByCharacter).map(([charName, charBuffs]) => {
        if (!charBuffs) return null;
        const buffsByParent = Object.groupBy(charBuffs, (b) => b.parentName ?? 'Other');

        return (
          <div
            key={charName}
            className="bg-muted/30 border-primary/10 flex w-full flex-col gap-1 rounded-lg border p-2"
          >
            <div className="flex items-start gap-3">
              {/* Character Label */}
              <div className="flex shrink-0 items-center pt-1">
                <Text className="text-primary/80 w-24 text-[10px] font-bold tracking-wider uppercase">
                  {charName}
                </Text>
              </div>

              {/* Buff Groups */}
              <div className="flex flex-1 flex-wrap gap-x-6 gap-y-2">
                {Object.entries(buffsByParent).map(([parentName, parentBuffs]) => {
                  if (!parentBuffs) return null;
                  return (
                    <div key={parentName} className="flex items-center gap-2">
                      <Text
                        variant="small"
                        className="text-muted-foreground/60 shrink-0 text-[8px] font-semibold uppercase"
                      >
                        {parentName}:
                      </Text>
                      <div className="flex flex-wrap gap-1">
                        {parentBuffs.map((buff) => (
                          <div key={buff.id} className="min-w-0">
                            <PaletteItem
                              text={buff.name}
                              hoverText={buff.description}
                              onDragStart={(e) => handleDragStart(buff, e)}
                              onClick={
                                onClickBuff ? () => onClickBuff(buff) : undefined
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

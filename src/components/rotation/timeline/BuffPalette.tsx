import { Fragment } from 'react';

import { PaletteItem } from '@/components/common/PaletteItem';
import { Separator } from '@/components/ui/separator';
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

  if (buffs.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center p-4 text-sm font-medium italic">
        No buffs available
      </div>
    );
  }

  const buffsByCharacter = Object.groupBy(buffs, (b) => b.characterName ?? 'General');

  const SOURCE_ORDER = ['character', 'weapon', 'echo-set', 'echo'] as const;
  const SOURCE_LABELS: Record<string, string> = {
    character: 'Character',
    weapon: 'Weapon',
    'echo-set': 'Echo Set',
    echo: 'Echo',
  };

  return (
    <div className="bg-muted/30 border-primary/10 w-full overflow-hidden rounded-xl border shadow-sm">
      <div className="divide-border/50 flex flex-col divide-y">
        {Object.entries(buffsByCharacter).map(([charName, charBuffs]) => {
          if (!charBuffs) return null;

          const buffsBySource = Object.groupBy(
            charBuffs,
            (b) => b.source ?? 'character',
          );

          return (
            <div
              key={charName}
              className="hover:bg-muted/20 flex items-stretch transition-colors"
            >
              {/* Character Header */}
              <div className="bg-muted/20 flex w-28 shrink-0 flex-col justify-center border-r px-3 py-2">
                <Text className="text-primary/80 text-[10px] leading-tight font-bold tracking-wider uppercase">
                  {charName}
                </Text>
              </div>

              {/* Buff Groups by Source */}
              <div className="flex flex-1 items-center overflow-x-auto px-3 py-2">
                <div className="flex h-full items-center gap-4">
                  {SOURCE_ORDER.map((source, sourceIdx) => {
                    const sourceBuffs = buffsBySource[source];
                    if (!sourceBuffs || sourceBuffs.length === 0) return null;

                    return (
                      <Fragment key={source}>
                        {sourceIdx > 0 &&
                          SOURCE_ORDER.slice(0, sourceIdx).some(
                            (prev) =>
                              buffsBySource[prev] && buffsBySource[prev].length > 0,
                          ) && (
                            <Separator
                              orientation="vertical"
                              className="h-6 opacity-50"
                            />
                          )}
                        <div className="flex items-center gap-2.5">
                          <Text
                            variant="small"
                            className="text-muted-foreground/50 text-[8px] font-bold tracking-tighter uppercase"
                          >
                            {SOURCE_LABELS[source]}
                          </Text>
                          <div className="flex flex-wrap gap-1">
                            {sourceBuffs.map((buff) => (
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
                      </Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

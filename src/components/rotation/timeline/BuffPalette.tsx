import { Fragment } from 'react';

import { PaletteItem } from '@/components/common/PaletteItem';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import type { DetailedBuff } from '@/types/client/capability';

export interface BuffPaletteProps {
  buffs: Array<DetailedBuff>;
  onClickBuff?: (buff: DetailedBuff) => void;
  onDragBuff?: (buff: DetailedBuff, event: React.DragEvent) => void;
  className?: string;
}

const SOURCE_ORDER = ['character', 'weapon', 'echo-set', 'echo'] as const;

export const BuffPalette = ({
  buffs,
  onClickBuff,
  onDragBuff,
  className,
}: BuffPaletteProps) => {
  if (buffs.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-4 text-sm font-medium italic">
        No buffs available
      </div>
    );
  }

  const buffsByCharacter = Object.groupBy(buffs, (b) => b.characterName);
  const characters = Object.entries(buffsByCharacter);

  return (
    <ScrollArea className={cn('w-full', className)}>
      <div className="flex gap-0">
        {characters.map(([charName, charBuffs], charIdx) => {
          if (!charBuffs) return null;

          // Group buffs by source
          const buffsBySource = Object.groupBy(charBuffs, (b) => b.source);

          return (
            <Fragment key={charName}>
              <div
                className={cn(
                  'flex min-w-[200px] flex-1 flex-col',
                  charIdx > 0 && 'border-border border-l',
                )}
              >
                <div className="border-b px-3 py-2">
                  <Text className="text-primary text-xs font-bold tracking-wider uppercase">
                    {charName}
                  </Text>
                </div>
                <div className="flex flex-col gap-2 p-3">
                  {SOURCE_ORDER.map((source) => {
                    const sourceBuffs = buffsBySource[source];
                    if (!sourceBuffs || sourceBuffs.length === 0) return null;

                    return (
                      <div key={source} className="flex flex-col gap-1">
                        <Text
                          variant="small"
                          className="text-muted-foreground text-[10px] font-semibold uppercase"
                        >
                          {source.replace('-', ' ')}
                        </Text>
                        <div className="flex flex-wrap gap-1">
                          {sourceBuffs.map((buff) => (
                            <PaletteItem
                              key={buff.id}
                              text={buff.name}
                              hoverText={buff.description}
                              onDragStart={
                                onDragBuff ? (e) => onDragBuff(buff, e) : undefined
                              }
                              onClick={
                                onClickBuff ? () => onClickBuff(buff) : undefined
                              }
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

import React from 'react';

import { PaletteItem } from '@/components/common/PaletteItem';
import { ItemGroup, ItemSeparator } from '@/components/ui/item';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import type { DetailedAttack } from '@/types/client/capability';

export interface AttackPaletteProps {
  attacks: Array<DetailedAttack>;
  onAddAttack?: (attack: DetailedAttack) => void;
  onClickAttack?: (attack: DetailedAttack) => void;
  onDragAttack?: (attack: DetailedAttack, event: React.DragEvent) => void;
  className?: string;
}

export const AttackPalette = ({
  attacks,
  onAddAttack,
  onClickAttack,
  onDragAttack,
  className,
}: AttackPaletteProps) => {
  const characterEntries = Object.entries(
    Object.groupBy(attacks, (a) => a.characterName),
  );

  return (
    <ScrollArea className={cn('w-full', className)}>
      <div className="flex gap-0">
        {characterEntries.map(([charName, charAttacks], charIndex) => {
          if (!charAttacks) return null;
          const parentEntries = Object.entries(
            Object.groupBy(charAttacks, (a) => a.parentName),
          );

          return (
            <React.Fragment key={charName}>
              <div
                className={cn(
                  'flex min-w-[200px] flex-1 flex-col',
                  charIndex > 0 && 'border-border border-l',
                )}
              >
                <div className="border-b px-3 py-2">
                  <Text className="text-primary text-xs font-bold tracking-wider uppercase">
                    {charName}
                  </Text>
                </div>
                <div className="flex flex-col gap-2 p-3">
                  {parentEntries.map(([parentName, parentAttacks], parentIndex) => {
                    if (!parentAttacks) return null;
                    return (
                      <React.Fragment key={parentName}>
                        {parentIndex > 0 && (
                          <ItemSeparator className="my-1 opacity-50" />
                        )}
                        <ItemGroup className={cn(parentIndex > 0 && 'mt-1')}>
                          <Text
                            variant="small"
                            className="text-muted-foreground mb-1 text-[10px] font-semibold uppercase"
                          >
                            {parentName}
                          </Text>
                          <div className="flex flex-wrap gap-1">
                            {parentAttacks.map((attack) => (
                              <PaletteItem
                                key={attack.id}
                                text={attack.name}
                                hoverText={attack.description}
                                onDragStart={
                                  onDragAttack
                                    ? (e) => onDragAttack(attack, e)
                                    : undefined
                                }
                                onAdd={
                                  onAddAttack ? () => onAddAttack(attack) : undefined
                                }
                                onClick={
                                  onClickAttack
                                    ? () => onClickAttack(attack)
                                    : undefined
                                }
                              />
                            ))}
                          </div>
                        </ItemGroup>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

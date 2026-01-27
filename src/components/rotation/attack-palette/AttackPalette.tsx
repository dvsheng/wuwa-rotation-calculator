import { PaletteItem } from '@/components/common/PaletteItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { CapabilitySchema } from '@/schemas/rotation';
import type { DetailedAttack } from '@/types/client/capability';

export interface AttackPaletteProps {
  attacks: Array<DetailedAttack>;
  onAddAttack?: (attack: DetailedAttack) => void;
  onClickAttack?: (attack: DetailedAttack) => void;
}

export const AttackPalette = ({
  attacks,
  onAddAttack,
  onClickAttack,
}: AttackPaletteProps) => {
  const { handleDragStart } = useDragAndDrop({ schema: CapabilitySchema });

  const attacksByCharacter = Object.groupBy(attacks, (a) => a.characterName);

  return (
    <ScrollArea className="min-w-0 flex-1">
      <div className="flex flex-col gap-6 p-4">
        {Object.entries(attacksByCharacter).map(([charName, charAttacks]) => {
          if (!charAttacks) return null;
          const attacksByParentSkill = Object.groupBy(charAttacks, (a) => a.parentName);
          return (
            <div key={charName} className="space-y-4">
              {/* Character Header */}
              <div className="border-primary/20 border-b pb-1">
                <Text className="text-primary font-bold">{charName}</Text>
              </div>

              <div className="space-y-4 pl-1">
                {Object.entries(attacksByParentSkill).map(
                  ([parentName, parentAttacks]) => {
                    if (!parentAttacks) return null;
                    return (
                      <div key={parentName} className="space-y-2">
                        {/* Inner Group Header */}
                        <div className="flex items-center justify-between px-1">
                          <Text
                            variant="small"
                            className="text-muted-foreground text-[10px] font-semibold uppercase"
                          >
                            {parentName}
                          </Text>
                        </div>

                        {/* Inner Group Items */}
                        <div className="grid min-w-0 gap-1 pl-2">
                          {parentAttacks.map((attack) => (
                            <PaletteItem
                              key={attack.id}
                              text={attack.name}
                              hoverText={attack.description}
                              onDragStart={(e) => handleDragStart(attack, e)}
                              onAdd={
                                onAddAttack ? () => onAddAttack(attack) : undefined
                              }
                              onClick={
                                onClickAttack ? () => onClickAttack(attack) : undefined
                              }
                            />
                          ))}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

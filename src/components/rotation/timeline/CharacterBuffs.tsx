import { DraggableItem } from '@/components/common/DragableItem';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { useCharacterDetails } from '@/hooks/useCharacterDetails';
import type { Team } from '@/types/client';

import { BUFF_ORIGIN } from '../constants';

interface CharacterBuffCardProps {
  name: string;
}

const isBuffParameterized = (buff: any): boolean => {
  if (!buff.modifiedStats) return false;
  return Object.values(buff.modifiedStats).some((stats: any) =>
    stats.some(
      (stat: any) =>
        typeof stat.value === 'object' &&
        'parameterConfigs' in stat.value &&
        !('resolveWith' in stat.value),
    ),
  );
};

const CharacterBuffCard = ({ name }: CharacterBuffCardProps) => {
  const { data, isLoading } = useCharacterDetails(name);

  if (isLoading || !data || data.modifiers.length === 0) return null;

  return (
    <Card className="bg-muted/30 border-primary/5 flex min-w-[200px] flex-1 flex-col gap-1.5 p-2 shadow-none">
      <Text className="text-primary/70 text-[10px] font-bold tracking-wider uppercase">
        {name}
      </Text>
      <div className="flex flex-wrap gap-1.5">
        {data.modifiers.map((buff, i) => {
          const buffId = `buff-${name}-${buff.name}-${i}`;
          const isParameterized = isBuffParameterized(buff);

          return (
            <DraggableItem
              key={buffId}
              id={buffId}
              data={{
                item: {
                  id: buffId,
                  characterName: name,
                  skillName: buff.name,
                  description: buff.description,
                  isParameterized,
                },
                origin: BUFF_ORIGIN,
              }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-background border-border/50 cursor-grab rounded border px-2 py-0.5 shadow-sm active:cursor-grabbing">
                    <Text className="text-foreground text-[10px] font-medium whitespace-nowrap">
                      {buff.name}
                    </Text>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[300px]">
                  <Text variant="tiny" className="font-bold">
                    {buff.name}
                  </Text>
                  <Text variant="tiny">{buff.description}</Text>
                </TooltipContent>
              </Tooltip>
            </DraggableItem>
          );
        })}
      </div>
    </Card>
  );
};

interface CharacterBuffsProps {
  team: Team;
}

export const CharacterBuffs = ({ team }: CharacterBuffsProps) => {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex w-full gap-2 overflow-x-auto">
        {team.map((char, index) =>
          char.name ? (
            <CharacterBuffCard key={`${char.name}-${index}`} name={char.name} />
          ) : null,
        )}
      </div>
    </TooltipProvider>
  );
};

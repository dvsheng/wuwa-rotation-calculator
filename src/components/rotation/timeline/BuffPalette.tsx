import { ItemGroup } from '@/components/ui/item';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { useCharacterDetails } from '@/hooks/useCharacterDetails';
import { useTeamStore } from '@/store/useTeamStore';

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

export interface BuffPaletteItemProps {
  id: string;
  characterId: string;
  characterName: string;
  skillName: string;
  description: string;
  isParameterized: boolean;
}

const BuffPaletteItem = (props: BuffPaletteItemProps) => {
  const { id, description } = props;
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('text/plain', '');
    event.dataTransfer.setData('application/json', JSON.stringify(props));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`cursor-grab rounded px-3 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105 active:cursor-grabbing`}
    >
      <Tooltip key={id}>
        <TooltipTrigger asChild>
          <Text className="text-foreground text-[10px] font-medium whitespace-nowrap">
            {props.skillName}
          </Text>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[300px]">
          <div className="flex flex-col gap-1">
            <Text variant="tiny" className="font-bold">
              {props.skillName}
            </Text>
            <Text variant="tiny">{description}</Text>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

interface BuffPaletteCharacterProps {
  name: string;
}

const BuffPaletteCharacter = ({ name }: BuffPaletteCharacterProps) => {
  const { data, isLoading } = useCharacterDetails(name);
  if (isLoading || !data || data.modifiers.length === 0) return null;

  return (
    <ItemGroup className="bg-muted/30 border-primary/5 flex min-w-[200px] flex-1 flex-col gap-1.5 p-2 shadow-none">
      <Text className="text-primary/70 text-[10px] font-bold tracking-wider uppercase">
        {name}
      </Text>
      <div className="flex flex-col gap-1">
        {data.modifiers.map((buff: any, i: number) => {
          const buffId = `buff-${name}-${buff.name}-${i}`;
          const isParameterized = isBuffParameterized(buff);

          return (
            <BuffPaletteItem
              key={buffId}
              id={buffId}
              characterId={data.id}
              characterName={name}
              skillName={buff.name}
              description={buff.description}
              isParameterized={isParameterized}
            />
          );
        })}
      </div>
    </ItemGroup>
  );
};

export const BuffPalette = () => {
  const team = useTeamStore((state) => state.team);
  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex w-full gap-2 overflow-x-auto pb-2">
        {team.map((char, index) =>
          char.name ? (
            <BuffPaletteCharacter key={`${char.name}-${index}`} name={char.name} />
          ) : null,
        )}
      </div>
    </TooltipProvider>
  );
};

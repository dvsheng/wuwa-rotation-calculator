import { useEffect } from 'react';
import { toast } from 'sonner';

import { ItemGroup } from '@/components/ui/item';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { useCharacterDetails } from '@/hooks/useCharacterDetails';
import { useEchoDetails } from '@/hooks/useEchoDetails';
import { useEchoSetDetails } from '@/hooks/useEchoSetDetails';
import { useWeaponDetails } from '@/hooks/useWeaponDetails';
import type { RefineLevel } from '@/services/game-data/weapon/types';
import { useTeamStore } from '@/store/useTeamStore';
import type { Character } from '@/types/client';

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
  character: Character;
}

const BuffPaletteCharacter = ({ character }: BuffPaletteCharacterProps) => {
  const {
    data: charData,
    isLoading: charLoading,
    error: charError,
  } = useCharacterDetails(character.name);
  const { data: weaponData, error: weaponError } = useWeaponDetails(
    character.weapon.name || null,
  );
  const echoSetName = character.echoSets[0].name;
  const echoSetRequirement = character.echoSets[0].requirement;
  const { data: echoSetData, error: echoSetError } = useEchoSetDetails(
    echoSetName || null,
  );
  const { data: echoData, error: echoError } = useEchoDetails(
    character.primarySlotEcho.name || null,
  );

  // Show error toasts for failed queries
  useEffect(() => {
    if (charError) {
      toast.error(`Failed to load character buffs: ${character.name}`);
    }
  }, [charError, character.name]);

  useEffect(() => {
    if (weaponError && character.weapon.name) {
      toast.error(`Failed to load weapon buffs: ${character.weapon.name}`);
    }
  }, [weaponError, character.weapon.name]);

  useEffect(() => {
    if (echoSetError && echoSetName) {
      toast.error(`Failed to load echo set buffs: ${echoSetName}`);
    }
  }, [echoSetError, echoSetName]);

  useEffect(() => {
    if (echoError && character.primarySlotEcho.name) {
      toast.error(`Failed to load echo buffs: ${character.primarySlotEcho.name}`);
    }
  }, [echoError, character.primarySlotEcho.name]);

  if (charLoading) return null;

  // Collect all buffs
  const allBuffs: Array<BuffPaletteItemProps> = [];

  // Character buffs
  if (charData?.modifiers) {
    charData.modifiers.forEach((buff: any, i: number) => {
      allBuffs.push({
        id: `buff-${character.name}-${buff.name}-${i}`,
        characterId: charData.id,
        characterName: character.name,
        skillName: buff.name,
        description: buff.description,
        isParameterized: isBuffParameterized(buff),
      });
    });
  }

  // Weapon buffs
  if (weaponData) {
    const refineLevel = String(character.weapon.refine) as RefineLevel;
    const weaponModifiers = weaponData.attributes[refineLevel].modifiers;
    weaponModifiers.forEach((buff: any, i: number) => {
      allBuffs.push({
        id: `buff-weapon-${weaponData.name}-${buff.name}-${i}`,
        characterId: charData?.id || character.id,
        characterName: character.name,
        skillName: `${weaponData.name}: ${buff.name}`,
        description: buff.description,
        isParameterized: isBuffParameterized(buff),
      });
    });
  }

  // Echo set buffs
  if (echoSetData) {
    const setEffect = echoSetData.setEffects[echoSetRequirement];
    if (setEffect?.modifiers) {
      setEffect.modifiers.forEach((buff: any, i: number) => {
        allBuffs.push({
          id: `buff-echoset-${echoSetData.name}-${buff.name}-${i}`,
          characterId: charData?.id || character.id,
          characterName: character.name,
          skillName: `${echoSetData.name}: ${buff.name}`,
          description: buff.description,
          isParameterized: isBuffParameterized(buff),
        });
      });
    }
  }

  // Echo buffs
  if (echoData?.modifiers) {
    echoData.modifiers.forEach((buff: any, i: number) => {
      allBuffs.push({
        id: `buff-echo-${echoData.name}-${buff.name}-${i}`,
        characterId: charData?.id || character.id,
        characterName: character.name,
        skillName: `${echoData.name}: ${buff.name}`,
        description: buff.description,
        isParameterized: isBuffParameterized(buff),
      });
    });
  }

  if (allBuffs.length === 0) return null;

  return (
    <ItemGroup className="bg-muted/30 border-primary/5 flex min-w-[200px] flex-1 flex-col gap-1.5 p-2 shadow-none">
      <Text className="text-primary/70 text-[10px] font-bold tracking-wider uppercase">
        {character.name}
      </Text>
      <div className="flex flex-col gap-1">
        {allBuffs.map((buff) => (
          <BuffPaletteItem key={buff.id} {...buff} />
        ))}
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
            <BuffPaletteCharacter key={`${char.name}-${index}`} character={char} />
          ) : null,
        )}
      </div>
    </TooltipProvider>
  );
};

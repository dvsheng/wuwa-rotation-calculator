import { EntityType } from '@/services/game-data';
import { useStore } from '@/store';

import { useEntityList } from './useEntityList';

export const useCharacterByCharacterId = (characterId: number) => {
  const { data: characters } = useEntityList({ entityType: EntityType.CHARACTER });
  return characters.find((character) => character.id === characterId);
};

export const useCharacterByTeamSlotNumber = (slotNumber: number) => {
  const charcterId = useStore((state) => state.team[slotNumber].id);
  return useCharacterByCharacterId(charcterId);
};

export const useTeamCharacters = () => {
  const firstCharacter = useCharacterByTeamSlotNumber(0);
  const secondCharacter = useCharacterByTeamSlotNumber(1);
  const thirdCharacter = useCharacterByTeamSlotNumber(2);
  return [
    { ...firstCharacter, index: 0 },
    { ...secondCharacter, index: 1 },
    { ...thirdCharacter, index: 2 },
  ];
};

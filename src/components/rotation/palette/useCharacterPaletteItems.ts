import { useEffect } from 'react';
import { toast } from 'sonner';

import { useCharacterDetails } from '@/hooks/useCharacterDetails';
import { useEchoDetails } from '@/hooks/useEchoDetails';
import { useEchoSetDetails } from '@/hooks/useEchoSetDetails';
import { useWeaponDetails } from '@/hooks/useWeaponDetails';
import type { RefineLevel } from '@/services/game-data/weapon/types';
import type { Character } from '@/types/client';

import type { PaletteItem } from './types';

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

interface UseCharacterPaletteItemsResult {
  attacks: Array<PaletteItem>;
  buffs: Array<PaletteItem>;
  isLoading: boolean;
}

export const useCharacterPaletteItems = (
  character: Character,
): UseCharacterPaletteItemsResult => {
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
      toast.error(`Failed to load character: ${character.name}`);
    }
  }, [charError, character.name]);

  useEffect(() => {
    if (weaponError && character.weapon.name) {
      toast.error(`Failed to load weapon: ${character.weapon.name}`);
    }
  }, [weaponError, character.weapon.name]);

  useEffect(() => {
    if (echoSetError && echoSetName) {
      toast.error(`Failed to load echo set: ${echoSetName}`);
    }
  }, [echoSetError, echoSetName]);

  useEffect(() => {
    if (echoError && character.primarySlotEcho.name) {
      toast.error(`Failed to load echo: ${character.primarySlotEcho.name}`);
    }
  }, [echoError, character.primarySlotEcho.name]);

  const attacks: Array<PaletteItem> = [];
  const buffs: Array<PaletteItem> = [];

  // Character attacks
  if (charData?.attacks) {
    charData.attacks.forEach((attack, i) => {
      attacks.push({
        id: `attack-${character.name}-${attack.parentName}-${attack.name}-${i}`,
        type: 'attack',
        characterId: charData.id,
        characterName: character.name,
        name: attack.name,
        description: attack.description,
        groupName: attack.parentName,
        source: 'character',
        metadata: {
          originType: attack.originType,
          damageInstanceName: attack.name,
          skillName: attack.parentName,
        },
      });
    });
  }

  // Character buffs
  if (charData?.modifiers) {
    charData.modifiers.forEach((buff: any, i: number) => {
      buffs.push({
        id: `buff-${character.name}-${buff.name}-${i}`,
        type: 'buff',
        characterId: charData.id,
        characterName: character.name,
        name: buff.name,
        description: buff.description,
        source: 'character',
        metadata: { isParameterized: isBuffParameterized(buff) },
      });
    });
  }

  // Weapon attack and buffs
  if (weaponData) {
    const refineLevel = String(character.weapon.refine) as RefineLevel;
    const weaponAttrs = weaponData.attributes[refineLevel];

    if (weaponAttrs.attack) {
      attacks.push({
        id: `attack-weapon-${weaponData.name}`,
        type: 'attack',
        characterId: charData?.id || character.id,
        characterName: character.name,
        name: weaponAttrs.attack.description || 'Weapon Attack',
        description: weaponAttrs.attack.description,
        groupName: weaponData.name,
        source: 'weapon',
        metadata: {
          originType: 'Weapon',
          damageInstanceName: weaponAttrs.attack.description || 'Weapon Attack',
          skillName: weaponData.name,
        },
      });
    }

    weaponAttrs.modifiers.forEach((buff: any, i: number) => {
      buffs.push({
        id: `buff-weapon-${weaponData.name}-${buff.name}-${i}`,
        type: 'buff',
        characterId: charData?.id || character.id,
        characterName: character.name,
        name: buff.name,
        description: buff.description,
        groupName: weaponData.name,
        source: 'weapon',
        metadata: { isParameterized: isBuffParameterized(buff) },
      });
    });
  }

  // Echo set buffs
  if (echoSetData) {
    const setEffect = echoSetData.setEffects[echoSetRequirement];
    if (setEffect?.modifiers) {
      setEffect.modifiers.forEach((buff: any, i: number) => {
        buffs.push({
          id: `buff-echoset-${echoSetData.name}-${buff.name}-${i}`,
          type: 'buff',
          characterId: charData?.id || character.id,
          characterName: character.name,
          name: buff.name,
          description: buff.description,
          groupName: echoSetData.name,
          source: 'echo-set',
          metadata: { isParameterized: isBuffParameterized(buff) },
        });
      });
    }
  }

  // Echo attack and buffs
  if (echoData) {
    if (echoData.attack) {
      attacks.push({
        id: `attack-echo-${echoData.name}`,
        type: 'attack',
        characterId: charData?.id || character.id,
        characterName: character.name,
        name: echoData.attack.description || 'Echo Attack',
        description: echoData.attack.description,
        groupName: echoData.name,
        source: 'echo',
        metadata: {
          originType: 'Echo',
          damageInstanceName: echoData.attack.description || 'Echo Attack',
          skillName: echoData.name,
        },
      });
    }

    echoData.modifiers.forEach((buff: any, i: number) => {
      buffs.push({
        id: `buff-echo-${echoData.name}-${buff.name}-${i}`,
        type: 'buff',
        characterId: charData?.id || character.id,
        characterName: character.name,
        name: buff.name,
        description: buff.description,
        groupName: echoData.name,
        source: 'echo',
        metadata: { isParameterized: isBuffParameterized(buff) },
      });
    });
  }

  return {
    attacks,
    buffs,
    isLoading: charLoading,
  };
};

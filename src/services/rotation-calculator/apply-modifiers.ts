import { mergeWith } from 'es-toolkit/object';
import { produce } from 'immer';

import type {
  Character,
  CharacterModifier,
  Enemy,
  EnemyModifier,
  Modifier,
  Team,
} from '@/types';

const applyModifierToCharacter = (target: Character, modifier: CharacterModifier) => {
  target.stats = mergeWith(
    target.stats,
    modifier.modifiedStats,
    (objectValue, sourceValue) => [...objectValue, ...sourceValue],
  );
};

const applyModifierToEnemy = (target: Enemy, modifier: EnemyModifier) => {
  target.stats = mergeWith(
    target.stats,
    modifier.modifiedStats,
    (objectValue, sourceValue) => [...objectValue, ...sourceValue],
  );
};

const applyModifierToTeamAndEnemy = (
  draftTeam: Team,
  draftEnemy: Enemy,
  modifier: Modifier,
  activeCharacterName: string,
) => {
  const { target } = modifier;

  switch (target) {
    case 'enemy': {
      applyModifierToEnemy(draftEnemy, modifier);

      break;
    }
    case 'team': {
      for (const character of draftTeam) applyModifierToCharacter(character, modifier);

      break;
    }
    case 'activeCharacter':
    case 'self': {
      const activeCharacter = draftTeam.find(
        (character) => character.id === activeCharacterName,
      );
      if (!activeCharacter) {
        throw new Error(`Character ${activeCharacterName} not found in team`);
      }
      applyModifierToCharacter(activeCharacter, modifier);

      break;
    }
    default: {
      if (target instanceof Set) {
        for (const slotId of target) {
          const character = draftTeam[slotId - 1];
          applyModifierToCharacter(character, modifier);
        }
      }
    }
  }
};

export const applyModifiers = (
  team: Team,
  enemy: Enemy,
  modifiers: Array<Modifier>,
  activeCharacterName: string,
): [Team, Enemy] => {
  return produce([team, enemy], ([draftTeam, draftEnemy]) => {
    for (const modifier of modifiers) {
      applyModifierToTeamAndEnemy(draftTeam, draftEnemy, modifier, activeCharacterName);
    }
  });
};

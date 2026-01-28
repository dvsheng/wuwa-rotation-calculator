import { produce } from 'immer';

import type {
  Character,
  CharacterModifier,
  CharacterStats,
  Enemy,
  EnemyModifier,
  EnemyStats,
  Modifier,
  TaggedStatValue,
  Team,
} from '@/types/server';

const applyModifierToCharacter = (target: Character, modifier: CharacterModifier) => {
  const stats = target.stats;
  (
    Object.entries(modifier.modifiedStats) as Array<
      [keyof CharacterStats, Array<TaggedStatValue>]
    >
  ).forEach(([statName, modifierStatValues]) => {
    stats[statName] = [...stats[statName], ...modifierStatValues];
  });
};

const applyModifierToEnemy = (target: Enemy, modifier: EnemyModifier) => {
  const stats = target.stats;
  (
    Object.entries(modifier.modifiedStats) as Array<
      [keyof EnemyStats, Array<TaggedStatValue>]
    >
  ).forEach(([statName, modifierStatValues]) => {
    stats[statName] = [...stats[statName], ...modifierStatValues];
  });
};

const applyModifierToTeamAndEnemy = (
  draftTeam: Team,
  draftEnemy: Enemy,
  modifier: Modifier,
  activeCharacterName: string,
) => {
  const { target } = modifier;

  if (target === 'enemy') {
    applyModifierToEnemy(draftEnemy, modifier);
  } else if (target === 'team') {
    draftTeam.forEach((character) => applyModifierToCharacter(character, modifier));
  } else if (target === 'activeCharacter' || target === 'self') {
    const activeCharacter = draftTeam.find(
      (character) => character.id === activeCharacterName,
    );
    if (!activeCharacter) {
      throw new Error(`Character ${activeCharacterName} not found in team`);
    }
    applyModifierToCharacter(activeCharacter, modifier);
  } else if (target instanceof Set) {
    target.forEach((slotId) => {
      const character = draftTeam[slotId - 1];
      applyModifierToCharacter(character, modifier);
    });
  }
};

export const applyModifiers = (
  team: Team,
  enemy: Enemy,
  modifiers: Array<Modifier>,
  activeCharacterName: string,
): [Team, Enemy] => {
  return produce([team, enemy], ([draftTeam, draftEnemy]) => {
    modifiers.forEach((modifier) => {
      applyModifierToTeamAndEnemy(
        draftTeam,
        draftEnemy,
        modifier as any,
        activeCharacterName,
      );
    });
  });
};

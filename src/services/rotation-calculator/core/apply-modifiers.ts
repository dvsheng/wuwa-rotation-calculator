import { mergeWith } from 'es-toolkit/object';
import { produce } from 'immer';

import type { Character, Enemy, Modifier, Team } from '@/types';

const applyModifierToCharacter = (target: Character, modifier: Modifier) => {
  target.stats = mergeWith(
    target.stats,
    modifier.modifiedStats,
    (objectValue, sourceValue) => [...objectValue, ...sourceValue],
  );
};

const applyModifierToEnemy = (target: Enemy, modifier: Modifier) => {
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
) => {
  for (const targetIndex of modifier.targets) {
    if (targetIndex === 'enemy') {
      applyModifierToEnemy(draftEnemy, modifier);
    } else {
      const character = draftTeam[targetIndex];
      applyModifierToCharacter(character, modifier);
    }
  }
};

export const applyModifiers = (
  team: Team,
  enemy: Enemy,
  modifiers: Array<Modifier>,
): [Team, Enemy] => {
  return produce([team, enemy], ([draftTeam, draftEnemy]) => {
    for (const modifier of modifiers) {
      applyModifierToTeamAndEnemy(draftTeam, draftEnemy, modifier);
    }
  });
};

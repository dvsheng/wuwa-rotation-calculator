import { mergeWith } from 'es-toolkit/object';
import { produce } from 'immer';

import type { Character, Enemy, Modifier, Team } from '@/types';

const applyModifierToCharacter = <T extends object>(
  target: Character<T>,
  modifier: Modifier<T>,
) => {
  target.stats = mergeWith(
    target.stats,
    modifier.modifiedStats,
    (objectValue, sourceValue) => [...objectValue, ...sourceValue],
  );
};

const applyModifierToEnemy = <T extends object>(
  target: Enemy<T>,
  modifier: Modifier<T>,
) => {
  target.stats = mergeWith(
    target.stats,
    modifier.modifiedStats,
    (objectValue, sourceValue) => [...objectValue, ...sourceValue],
  );
};

const applyModifierToTeamAndEnemy = <T extends object>(
  draftTeam: Team<T>,
  draftEnemy: Enemy<T>,
  modifier: Modifier<T>,
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

export const applyModifiers = <T extends object>(
  team: Team<T>,
  enemy: Enemy<T>,
  modifiers: Array<Modifier<T>>,
): [Team<T>, Enemy<T>] => {
  return produce([team, enemy], ([draftTeam, draftEnemy]) => {
    for (const modifier of modifiers) {
      applyModifierToTeamAndEnemy(
        draftTeam as Team<T>,
        draftEnemy as Enemy<T>,
        modifier,
      );
    }
  });
};

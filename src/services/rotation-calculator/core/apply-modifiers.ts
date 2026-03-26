import { produce } from 'immer';

import type { Character, Enemy, Modifier } from './types';

const applyModifier = <T extends object>(
  target: Character<T> | Enemy<T>,
  modifier: Modifier<T>,
) => {
  target.stats = [...target.stats, modifier];
};

const applyModifierToTargets = <T extends object>(
  draftTeam: Array<Character<T>>,
  draftEnemy: Enemy<T>,
  modifier: Modifier<T>,
) => {
  for (const targetIndex of modifier.targets) {
    const target = targetIndex === 'enemy' ? draftEnemy : draftTeam[targetIndex];
    applyModifier(target, modifier);
  }
};

export const applyModifiers = <T extends object>(
  team: Array<Character<T>>,
  enemy: Enemy<T>,
  modifiers: Array<Modifier<T>>,
): [Array<Character<T>>, Enemy<T>] => {
  return produce([team, enemy], ([draftTeam, draftEnemy]) => {
    for (const modifier of modifiers) {
      applyModifierToTargets(
        draftTeam as Array<Character<T>>,
        draftEnemy as Enemy<T>,
        modifier,
      );
    }
  });
};

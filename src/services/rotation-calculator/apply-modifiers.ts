import { mergeWith } from 'es-toolkit/object';
import { produce } from 'immer';

import { isCharacterModifier } from '@/types';
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
) => {
  if (isCharacterModifier(modifier)) {
    const { targets, modifiedStats } = modifier;
    for (const targetIndex of targets) {
      const character = draftTeam[targetIndex];
      applyModifierToCharacter(character, {
        targets: [targetIndex],
        modifiedStats,
      });
    }
  } else {
    applyModifierToEnemy(draftEnemy, modifier);
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

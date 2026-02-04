import type { Integer } from '@/types';

const PLAYER_CONSTANT = 800;
const ENEMY_CONSTANT = 792;
const LEVEL_MULTIPLER = 8;

/**
 * Calculates the defense multiplier based on the Wuthering Waves damage formula.
 * @see https://wutheringwaves.fandom.com/wiki/Damage#DEF_Multiplier
 */
export const calculateDefenseMultiplier = (properties: {
  characterLevel: Integer;
  enemyLevel: Integer;
  defenseReduction: number;
  defenseIgnore: number;
}) => {
  const enemyDefense = calculateEnemyDefense(
    properties.enemyLevel,
    properties.defenseReduction,
  );
  const playerDefense = calculatePlayerDefense(properties.characterLevel);
  return (
    playerDefense / (playerDefense + enemyDefense * (1 - properties.defenseIgnore))
  );
};

const calculateEnemyDefense = (enemyLevel: Integer, defenseReduction: number) => {
  return (LEVEL_MULTIPLER * enemyLevel + ENEMY_CONSTANT) * (1 - defenseReduction);
};

const calculatePlayerDefense = (characterLevel: Integer) => {
  return LEVEL_MULTIPLER * characterLevel + PLAYER_CONSTANT;
};

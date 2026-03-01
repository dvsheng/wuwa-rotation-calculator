import type { Attack } from './types';

/**
 * Sentinel ID for the virtual "Tune Break" attack that represents all characters'
 * tune break capabilities combined into a single palette item.
 *
 * When the server encounters this ID in the rotation, it expands it into one
 * CharacterAttack per team member that has Tune Break capabilities.
 */
export const TUNE_BREAK_ATTACK_ID = -2000;

export const isTuneBreakAttack = (attack: Attack) => {
  return attack.damageInstances.every((instance) =>
    instance.scalingStat.startsWith('tuneRupture'),
  );
};

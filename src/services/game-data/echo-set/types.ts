/**
 * Valid set piece counts for triggering echo set effects.
 */
export const SetEffectRequirement = {
  TWO: 2,
  THREE: 3,
  FIVE: 5,
};

export type SetEffectRequirement =
  (typeof SetEffectRequirement)[keyof typeof SetEffectRequirement];

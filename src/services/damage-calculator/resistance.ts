const RESISTANCE_SOFT_CAP = 0.8;

const HIGH_RESISTANCE_FACTOR = 5;

/**
 * Resistance calculations based on the Wuthering Waves damage formula.
 * @see https://wutheringwaves.fandom.com/wiki/Damage#RES_Multiplier
 */
export const calculateResistanceMultiplier = (props: {
  baseResistance: number;
  resistanceReduction: number;
  resistancePenetration: number;
}) => {
  const netResistance =
    props.baseResistance - props.resistanceReduction - props.resistancePenetration;
  if (netResistance < 0) {
    return 1 - netResistance / 2;
  }
  if (netResistance < RESISTANCE_SOFT_CAP) {
    return 1 - netResistance;
  }
  return 1 / (1 + HIGH_RESISTANCE_FACTOR * netResistance);
};

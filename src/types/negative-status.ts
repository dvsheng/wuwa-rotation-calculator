export const NegativeStatus = {
  FUSION_BURST: 'fusionBurst',
  GLACIO_CHAFE: 'glacioChafe',
  AERO_EROSION: 'aeroErosion',
  ELECTRO_FLARE: 'electroFlare',
  SPECTRO_FRAZZLE: 'spectroFrazzle',
  HAVOC_BANE: 'havocBane',
} as const;

export type NegativeStatus = (typeof NegativeStatus)[keyof typeof NegativeStatus];

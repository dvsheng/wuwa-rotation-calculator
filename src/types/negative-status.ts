import { Attribute } from './attribute';

export const NegativeStatus = {
  FUSION_BURST: 'fusionBurst',
  GLACIO_CHAFE: 'glacioChafe',
  AERO_EROSION: 'aeroErosion',
  ELECTRO_FLARE: 'electroFlare',
  SPECTRO_FRAZZLE: 'spectroFrazzle',
  HAVOC_BANE: 'havocBane',
} as const;

export type NegativeStatus = (typeof NegativeStatus)[keyof typeof NegativeStatus];

export const NEGATIVE_STATUS_TO_ATTRIBUTE: Record<NegativeStatus, Attribute> = {
  [NegativeStatus.FUSION_BURST]: Attribute.FUSION,
  [NegativeStatus.GLACIO_CHAFE]: Attribute.GLACIO,
  [NegativeStatus.AERO_EROSION]: Attribute.AERO,
  [NegativeStatus.ELECTRO_FLARE]: Attribute.ELECTRO,
  [NegativeStatus.SPECTRO_FRAZZLE]: Attribute.SPECTRO,
  [NegativeStatus.HAVOC_BANE]: Attribute.HAVOC,
};

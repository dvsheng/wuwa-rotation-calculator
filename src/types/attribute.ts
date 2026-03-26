/**
 * The element of an entity or attack
 */
export const Attribute = {
  GLACIO: 'glacio',
  FUSION: 'fusion',
  AERO: 'aero',
  ELECTRO: 'electro',
  HAVOC: 'havoc',
  SPECTRO: 'spectro',
  PHYSICAL: 'physical',
} as const;

export type Attribute = (typeof Attribute)[keyof typeof Attribute];

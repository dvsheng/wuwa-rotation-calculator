export const Attribute = {
  GLACIO: 'glacio',
  FUSION: 'fusion',
  AERO: 'aero',
  ELECTRO: 'electro',
  HAVOC: 'havoc',
  SPECTRO: 'spectro',
} as const;

export type Attribute = (typeof Attribute)[keyof typeof Attribute];

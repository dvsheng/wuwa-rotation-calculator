/**
 * The type of weapon used by a character
 */
export const WeaponType = {
  BROADBLADE: 'Broadblade',
  SWORD: 'Sword',
  PISTOLS: 'Pistols',
  GAUNTLETS: 'Gauntlets',
  RECTIFIER: 'Rectifier',
} as const;

export type WeaponType = (typeof WeaponType)[keyof typeof WeaponType];

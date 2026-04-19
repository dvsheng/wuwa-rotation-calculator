import { AttackScalingProperty, Attribute, DamageType, WeaponType } from '@/types';

export const DEFAULT_SKILL_LEVEL = 10;

export const ELEMENT_ID_TO_ATTRIBUTE_MAP: Partial<Record<number, Attribute>> = {
  0: Attribute.PHYSICAL,
  1: Attribute.GLACIO,
  2: Attribute.FUSION,
  3: Attribute.ELECTRO,
  4: Attribute.AERO,
  5: Attribute.SPECTRO,
  6: Attribute.HAVOC,
} as const;

export const WEAPON_TYPE_ID_MAP: Partial<Record<number, WeaponType>> = {
  1: WeaponType.BROADBLADE,
  2: WeaponType.SWORD,
  3: WeaponType.PISTOLS,
  4: WeaponType.GAUNTLETS,
  5: WeaponType.RECTIFIER,
} as const;

export const DAMAGE_INSTANCE_TYPE_TO_DAMAGE_TYPE_MAP: Partial<
  Record<number, DamageType>
> = {
  0: DamageType.BASIC_ATTACK,
  1: DamageType.HEAVY_ATTACK,
  2: DamageType.RESONANCE_LIBERATION,
  3: DamageType.INTRO,
  4: DamageType.RESONANCE_SKILL,
  5: DamageType.ECHO,
  7: DamageType.ECHO,
  10: DamageType.NEGATIVE_STATUS,
  12: DamageType.TUNE_RUPTURE,
} as const;

export const RELATED_PROPERTY_TO_SCALING_PROPERTY: Partial<
  Record<number, AttackScalingProperty>
> = {
  2: AttackScalingProperty.HP,
  7: AttackScalingProperty.ATK,
  10: AttackScalingProperty.DEF,
} as const;

export const CalculateType = {
  DAMAGE: 0,
  HEALING: 1,
  SHIELDING: 2,
} as const;

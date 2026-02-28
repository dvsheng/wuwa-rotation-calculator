import type { EchoMainStatOptionType, EchoSubstatOptionType } from '@/schemas/echo';
import { EchoMainStatOption, EchoSubstatOption } from '@/schemas/echo';
import type { Attribute } from '@/types';

export const ATTRIBUTE_COLORS: Record<Attribute, string> = {
  fusion: 'var(--color-attribute-fusion)',
  glacio: 'var(--color-attribute-glacio)',
  aero: 'var(--color-attribute-aero)',
  electro: 'var(--color-attribute-electro)',
  spectro: 'var(--color-attribute-spectro)',
  havoc: 'var(--color-attribute-havoc)',
  physical: 'var(--color-attribute-physical)',
} as const;

export const ATTRIBUTE_ICONS: Record<Attribute, string> = {
  havoc: '/attribute/icon/havoc.webp',
  spectro: '/attribute/icon/spectro.webp',
  aero: '/attribute/icon/aero.webp',
  electro: '/attribute/icon/electro.webp',
  fusion: '/attribute/icon/fusion.webp',
  glacio: '/attribute/icon/glacio.webp',
  physical: '/attribute/icon/physical.webp',
} as const;

export const SUBSTAT_OPTIONS: Array<EchoSubstatOptionType> =
  Object.values(EchoSubstatOption);

export const STAT_LABELS: Record<
  EchoSubstatOptionType | EchoMainStatOptionType,
  string
> = {
  [EchoMainStatOption.HP_PERCENT]: 'HP%',
  [EchoMainStatOption.ATK_PERCENT]: 'ATK%',
  [EchoMainStatOption.DEF_PERCENT]: 'DEF%',
  [EchoMainStatOption.CRIT_RATE]: 'Crit Rate',
  [EchoMainStatOption.CRIT_DMG]: 'Crit DMG',
  [EchoMainStatOption.HEALING_BONUS]: 'Healing Bonus',
  [EchoMainStatOption.ENERGY_REGEN]: 'Energy Regen',
  [EchoMainStatOption.DAMAGE_BONUS_GLACIO]: 'Glacio DMG',
  [EchoMainStatOption.DAMAGE_BONUS_FUSION]: 'Fusion DMG',
  [EchoMainStatOption.DAMAGE_BONUS_ELECTRO]: 'Electro DMG',
  [EchoMainStatOption.DAMAGE_BONUS_AERO]: 'Aero DMG',
  [EchoMainStatOption.DAMAGE_BONUS_SPECTRO]: 'Spectro DMG',
  [EchoMainStatOption.DAMAGE_BONUS_HAVOC]: 'Havoc DMG',
  [EchoSubstatOption.HP_FLAT]: 'HP',
  [EchoSubstatOption.ATK_FLAT]: 'ATK',
  [EchoSubstatOption.DEF_FLAT]: 'DEF',
  [EchoSubstatOption.DAMAGE_BONUS_BASIC_ATTACK]: 'Basic Atk DMG',
  [EchoSubstatOption.DAMAGE_BONUS_HEAVY_ATTACK]: 'Heavy Atk DMG',
  [EchoSubstatOption.DAMAGE_BONUS_RESONANCE_SKILL]: 'Res. Skill DMG',
  [EchoSubstatOption.DAMAGE_BONUS_RESONANCE_LIBERATION]: 'Res. Lib. DMG',
};

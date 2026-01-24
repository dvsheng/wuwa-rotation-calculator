import { Attribute } from '@/types/attribute';
import type {
  EchoMainStatOptionType,
  EchoSubstatOptionType,
} from '@/types/client/echo';
import { EchoMainStatOption, EchoSubstatOption } from '@/types/client/echo';

export const ATTRIBUTE_COLORS: Record<Attribute, string> = {
  [Attribute.FUSION]: '#C32439',
  [Attribute.GLACIO]: '#56B9D7',
  [Attribute.AERO]: '#36BA92',
  [Attribute.ELECTRO]: '#A242B1',
  [Attribute.SPECTRO]: '#BAA525',
  [Attribute.HAVOC]: '#8F1D4F',
} as const;

export const ATTRIBUTE_ICONS: Record<Attribute, string> = {
  [Attribute.HAVOC]: '/attribute/icon/havoc.webp',
  [Attribute.SPECTRO]: '/attribute/icon/spectro.webp',
  [Attribute.AERO]: '/attribute/icon/aero.webp',
  [Attribute.ELECTRO]: '/attribute/icon/electro.webp',
  [Attribute.FUSION]: '/attribute/icon/fusion.webp',
  [Attribute.GLACIO]: '/attribute/icon/glacio.webp',
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

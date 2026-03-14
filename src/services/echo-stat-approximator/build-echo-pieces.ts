import { compact, uniq } from 'es-toolkit/array';

import {
  ECHO_SUBSTAT_VALUES,
  EchoCost,
  EchoMainStatOption,
  EchoSubstatOption,
} from '@/schemas/echo';
import type {
  EchoMainStatOptionType,
  EchoPiece,
  EchoSubstatOptionType,
} from '@/schemas/echo';
import type { OriginType as OriginTypeType } from '@/services/game-data';
import { OriginType } from '@/services/game-data';
import { AttackScalingProperty, Attribute, CharacterStat, DamageType } from '@/types';
import type {
  AttackScalingProperty as AttackScalingPropertyType,
  Attribute as AttributeType,
  CharacterStat as CharacterStatType,
  DamageType as DamageTypeType,
} from '@/types';

import type { CharacterDetailsWithRuntimeStats, RuntimeStatTarget } from './types';

type PreferredScalingStat = 'atk' | 'def' | 'hp';

/** Selected substat roll tier used when approximating generated echo pieces. */
const APPROXIMATED_SUBSTAT_VALUE_INDEX = 2;
/** Four-cost plus the first three-cost piece receive the full preferred substat set. */
const FULLY_PREFERRED_PIECE_INDEXES = new Set([0, 1]);
/**
 * Runtime targets above this total are satisfied with a three-cost main stat.
 * Example: If a character has scaling up to 250% (2.5) energy regeneration, then their 3 cost main stat will
 * will be mapped to energy regeneration.
 */
const MAIN_STAT_RUNTIME_THRESHOLD = 2;

/** Maps character attributes to their matching three-cost elemental damage main stat. */
const ATTRIBUTE_MAIN_STAT_BY_ATTRIBUTE: Partial<
  Record<AttributeType, EchoMainStatOptionType>
> = {
  [Attribute.AERO]: EchoMainStatOption.DAMAGE_BONUS_AERO,
  [Attribute.ELECTRO]: EchoMainStatOption.DAMAGE_BONUS_ELECTRO,
  [Attribute.FUSION]: EchoMainStatOption.DAMAGE_BONUS_FUSION,
  [Attribute.GLACIO]: EchoMainStatOption.DAMAGE_BONUS_GLACIO,
  [Attribute.HAVOC]: EchoMainStatOption.DAMAGE_BONUS_HAVOC,
  [Attribute.SPECTRO]: EchoMainStatOption.DAMAGE_BONUS_SPECTRO,
};

/** Maps damage instance types to the corresponding echo substat option when one exists. */
const DAMAGE_TYPE_SUBSTAT_BY_DAMAGE_TYPE: Partial<
  Record<DamageTypeType, EchoSubstatOptionType>
> = {
  [DamageType.BASIC_ATTACK]: EchoSubstatOption.DAMAGE_BONUS_BASIC_ATTACK,
  [DamageType.HEAVY_ATTACK]: EchoSubstatOption.DAMAGE_BONUS_HEAVY_ATTACK,
  [DamageType.RESONANCE_LIBERATION]:
    EchoSubstatOption.DAMAGE_BONUS_RESONANCE_LIBERATION,
  [DamageType.RESONANCE_SKILL]: EchoSubstatOption.DAMAGE_BONUS_RESONANCE_SKILL,
};

/** Maps satisfiable runtime stats to the main stat options that can cover them. */
const MAIN_STAT_BY_RUNTIME_STAT: Partial<
  Record<CharacterStatType, EchoMainStatOptionType>
> = {
  [CharacterStat.ATTACK_SCALING_BONUS]: EchoMainStatOption.ATK_PERCENT,
  [CharacterStat.DEFENSE_SCALING_BONUS]: EchoMainStatOption.DEF_PERCENT,
  [CharacterStat.ENERGY_REGEN]: EchoMainStatOption.ENERGY_REGEN,
  [CharacterStat.HP_SCALING_BONUS]: EchoMainStatOption.HP_PERCENT,
};

/** Maps runtime stats to equivalent echo substats when they can be rolled as substats. */
const SUBSTAT_BY_RUNTIME_STAT: Partial<
  Record<CharacterStatType, EchoSubstatOptionType>
> = {
  [CharacterStat.ATTACK_SCALING_BONUS]: EchoSubstatOption.ATK_PERCENT,
  [CharacterStat.CRITICAL_DAMAGE]: EchoSubstatOption.CRIT_DMG,
  [CharacterStat.CRITICAL_RATE]: EchoSubstatOption.CRIT_RATE,
  [CharacterStat.DEFENSE_SCALING_BONUS]: EchoSubstatOption.DEF_PERCENT,
  [CharacterStat.ENERGY_REGEN]: EchoSubstatOption.ENERGY_REGEN,
  [CharacterStat.HP_SCALING_BONUS]: EchoSubstatOption.HP_PERCENT,
};

/** Ordered scaling-focused fallback substats used after the ranked preferred list is exhausted. */
const NON_PREFERRED_SCALING_SUBSTAT_FILL_ORDER: Array<EchoSubstatOptionType> = [
  EchoSubstatOption.ATK_PERCENT,
  EchoSubstatOption.HP_PERCENT,
  EchoSubstatOption.DEF_PERCENT,
  EchoSubstatOption.ATK_FLAT,
  EchoSubstatOption.HP_FLAT,
  EchoSubstatOption.DEF_FLAT,
];

/** Expected damage type for each attack origin, used to upweight mismatched instances. */
const DAMAGE_TYPE_BY_ORIGIN_TYPE: Partial<Record<OriginTypeType, DamageTypeType>> = {
  [OriginType.ECHO]: DamageType.ECHO,
  [OriginType.INTRO_SKILL]: DamageType.INTRO,
  [OriginType.NORMAL_ATTACK]: DamageType.BASIC_ATTACK,
  [OriginType.OUTRO_SKILL]: DamageType.OUTRO,
  [OriginType.RESONANCE_LIBERATION]: DamageType.RESONANCE_LIBERATION,
  [OriginType.RESONANCE_SKILL]: DamageType.RESONANCE_SKILL,
  [OriginType.TUNE_BREAK]: DamageType.TUNE_BREAK,
};

const getSubstatValue = (stat: EchoSubstatOptionType) =>
  ECHO_SUBSTAT_VALUES[stat][APPROXIMATED_SUBSTAT_VALUE_INDEX];

const normalizeScalingProperty = (
  property: AttackScalingPropertyType,
): PreferredScalingStat | undefined => {
  switch (property) {
    case AttackScalingProperty.ATK:
    case AttackScalingProperty.TUNE_RUPTURE_ATK: {
      return 'atk';
    }
    case AttackScalingProperty.DEF:
    case AttackScalingProperty.TUNE_RUPTURE_DEF: {
      return 'def';
    }
    case AttackScalingProperty.HP:
    case AttackScalingProperty.TUNE_RUPTURE_HP: {
      return 'hp';
    }
    default: {
      return undefined;
    }
  }
};

const getScalingMainStat = (
  scalingStat: PreferredScalingStat,
): EchoMainStatOptionType => {
  switch (scalingStat) {
    case 'def': {
      return EchoMainStatOption.DEF_PERCENT;
    }
    case 'hp': {
      return EchoMainStatOption.HP_PERCENT;
    }
    default: {
      return EchoMainStatOption.ATK_PERCENT;
    }
  }
};

const getScalingSubstat = (
  scalingStat: PreferredScalingStat,
): EchoSubstatOptionType => {
  switch (scalingStat) {
    case 'def': {
      return EchoSubstatOption.DEF_PERCENT;
    }
    case 'hp': {
      return EchoSubstatOption.HP_PERCENT;
    }
    default: {
      return EchoSubstatOption.ATK_PERCENT;
    }
  }
};

const getFlatScalingSubstat = (
  scalingStat: PreferredScalingStat,
): EchoSubstatOptionType => {
  switch (scalingStat) {
    case 'def': {
      return EchoSubstatOption.DEF_FLAT;
    }
    case 'hp': {
      return EchoSubstatOption.HP_FLAT;
    }
    default: {
      return EchoSubstatOption.ATK_FLAT;
    }
  }
};

const addWeight = <TKey extends string>(
  weights: Map<TKey, number>,
  key: TKey,
  weight: number,
) => {
  weights.set(key, (weights.get(key) ?? 0) + weight);
};

const getPreferredScalingStat = (
  entity: CharacterDetailsWithRuntimeStats,
): PreferredScalingStat => {
  const weights = new Map<PreferredScalingStat, number>();

  for (const attack of entity.capabilities.attacks) {
    for (const instance of attack.damageInstances) {
      const stat = normalizeScalingProperty(instance.scalingStat);
      if (!stat) continue;
      addWeight(weights, stat, 1);
    }
  }

  const hpWeight = weights.get('hp') ?? 0;
  const defenseWeight = weights.get('def') ?? 0;
  const atkWeight = weights.get('atk') ?? 0;

  if (hpWeight > 0 || defenseWeight > 0) {
    return hpWeight >= defenseWeight ? 'hp' : 'def';
  }

  return atkWeight > 0 ? 'atk' : 'atk';
};

const getDominantAttribute = (
  entity: CharacterDetailsWithRuntimeStats,
): AttributeType | undefined => {
  const weights = new Map<AttributeType, number>();

  for (const attack of entity.capabilities.attacks) {
    for (const instance of attack.damageInstances) {
      if (!(instance.attribute in ATTRIBUTE_MAIN_STAT_BY_ATTRIBUTE)) continue;
      addWeight(weights, instance.attribute, 1);
    }
  }

  return [...weights.entries()].toSorted((left, right) => right[1] - left[1])[0]?.[0];
};

const rankDamageTypes = (
  entity: CharacterDetailsWithRuntimeStats,
): Array<EchoSubstatOptionType> => {
  const weights = new Map<EchoSubstatOptionType, number>();

  for (const attack of entity.capabilities.attacks) {
    const expectedDamageType = DAMAGE_TYPE_BY_ORIGIN_TYPE[attack.originType];

    for (const instance of attack.damageInstances) {
      const substat = DAMAGE_TYPE_SUBSTAT_BY_DAMAGE_TYPE[instance.damageType];
      if (!substat) continue;
      addWeight(
        weights,
        substat,
        expectedDamageType && instance.damageType !== expectedDamageType ? 10 : 1,
      );
    }
  }

  return [...weights.entries()]
    .toSorted((left, right) => right[1] - left[1])
    .map(([substat]) => substat);
};

/**
 * Builds the concrete substat rolls for one echo piece by taking the highest-ranked preferred
 * substats first, then backfilling from the tail of the ranked list.
 */
const createSubstats = (
  rankedSubstats: Array<EchoSubstatOptionType>,
  preferredSubstatCount: number,
): EchoPiece['substats'] => {
  const preferredSlice = rankedSubstats.slice(0, preferredSubstatCount);
  const fallbackSlice = rankedSubstats.slice(-(5 - preferredSubstatCount));
  const statOptions = uniq([...preferredSlice, ...fallbackSlice]).slice(0, 5);

  return statOptions.map((stat) => ({
    stat,
    value: getSubstatValue(stat),
  }));
};

/**
 * Produces a full priority order for substats, starting with crit, the dominant scaling stat,
 * runtime targets, and ranked damage-type bonuses before falling back to generic scaling rolls.
 */
const rankSubstats = (
  scalingStat: PreferredScalingStat,
  runtimeTargets: Array<RuntimeStatTarget>,
  rankedDamageTypes: Array<EchoSubstatOptionType>,
): Array<EchoSubstatOptionType> => {
  const runtimeSubstats = compact(
    runtimeTargets.map((target) => SUBSTAT_BY_RUNTIME_STAT[target.stat]),
  );
  const preferredSubstats = uniq([
    EchoSubstatOption.CRIT_RATE,
    EchoSubstatOption.CRIT_DMG,
    getScalingSubstat(scalingStat),
    ...runtimeSubstats,
    rankedDamageTypes[0],
    getFlatScalingSubstat(scalingStat),
    EchoSubstatOption.ENERGY_REGEN,
    ...rankedDamageTypes.slice(1),
  ]);
  const nonPreferredScalingStats = NON_PREFERRED_SCALING_SUBSTAT_FILL_ORDER.filter(
    (stat) => !preferredSubstats.includes(stat),
  );
  return uniq([...preferredSubstats, ...nonPreferredScalingStats]);
};

const getThreeCostMainStat = (
  runtimeTargets: Array<RuntimeStatTarget>,
  dominantAttribute: AttributeType | undefined,
  scalingStat: PreferredScalingStat,
): EchoMainStatOptionType => {
  const runtimeMainStat = runtimeTargets.find(
    (target) =>
      target.requiredTotal > MAIN_STAT_RUNTIME_THRESHOLD &&
      MAIN_STAT_BY_RUNTIME_STAT[target.stat],
  );

  if (runtimeMainStat) {
    return MAIN_STAT_BY_RUNTIME_STAT[runtimeMainStat.stat]!;
  }

  return (
    (dominantAttribute && ATTRIBUTE_MAIN_STAT_BY_ATTRIBUTE[dominantAttribute]) ??
    getScalingMainStat(scalingStat)
  );
};

/** Builds the approximated five-piece echo setup for a character with precomputed runtime targets. */
export const buildEchoPieces = (
  entity: CharacterDetailsWithRuntimeStats,
): Array<EchoPiece> => {
  const scalingStat = getPreferredScalingStat(entity);
  const dominantAttribute = getDominantAttribute(entity);
  const rankedDamageTypes = rankDamageTypes(entity);
  const runtimeTargets = entity.runtimeStatTargets;
  const rankedSubstats = rankSubstats(scalingStat, runtimeTargets, rankedDamageTypes);
  const threeCostMainStat = getThreeCostMainStat(
    runtimeTargets,
    dominantAttribute,
    scalingStat,
  );
  const oneCostMainStat = getScalingMainStat(scalingStat);

  return [
    { cost: EchoCost.FOUR, mainStatType: EchoMainStatOption.CRIT_RATE },
    { cost: EchoCost.THREE, mainStatType: threeCostMainStat },
    { cost: EchoCost.THREE, mainStatType: threeCostMainStat },
    { cost: EchoCost.ONE, mainStatType: oneCostMainStat },
    { cost: EchoCost.ONE, mainStatType: oneCostMainStat },
  ].map((piece, index) => ({
    ...piece,
    substats: createSubstats(
      rankedSubstats,
      FULLY_PREFERRED_PIECE_INDEXES.has(index) ? 5 : 2,
    ),
  }));
};

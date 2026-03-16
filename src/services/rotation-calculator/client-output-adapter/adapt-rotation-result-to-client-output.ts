import { AttackScalingProperty, CharacterStat, EnemyStat } from '@/types';

import type { StatMeta } from '../client-input-adapter/adapt-client-input-to-rotation';
import { getAttackScalingType } from '../core/type-converters';
import { AttackScalingType } from '../core/types';
import type { RotationResult } from '../core/types';

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export type ClientCharacterStats = Partial<
  Record<CharacterStat | 'attackScalingPropertyValue' | 'level', number>
>;

export type ClientEnemyStats = Partial<Record<EnemyStat | 'level', number>>;

export type ClientDamageDetail = Omit<
  RotationResult<StatMeta>['damageDetails'][number],
  'character' | 'enemy'
> & {
  character: ClientCharacterStats;
  enemy: ClientEnemyStats;
};

export const SensitivityAnalysisCategory = {
  SUBSTAT_ROLL: 'substatRoll',
  THREE_COST_MAIN_STAT_SWAP: 'threeCostMainStatSwap',
  FOUR_COST_MAIN_STAT_SWAP: 'fourCostMainStatSwap',
} as const;

export type SensitivityAnalysisCategory =
  (typeof SensitivityAnalysisCategory)[keyof typeof SensitivityAnalysisCategory];

export interface ClientSensitivityAnalysisScenario {
  id: string;
  label: string;
  description: string;
  category: SensitivityAnalysisCategory;
  perturbedTotalDamage: number;
  totalDamageDelta: number;
  relativeDelta: number;
}

export interface ClientSensitivityAnalysis {
  baselineTotalDamage: number;
  characterIndex: number;
  scenarios: Array<ClientSensitivityAnalysisScenario>;
}

export interface ClientRotationCalculationOutput {
  totalDamage: number;
  damageDetails: Array<ClientDamageDetail>;
}

export interface ClientRotationResult extends ClientRotationCalculationOutput {
  sensitivityAnalysis: ClientSensitivityAnalysis;
}

// ---------------------------------------------------------------------------
// Character stat filtering
// ---------------------------------------------------------------------------

const UNIVERSAL_CHARACTER_KEYS: ReadonlyArray<string> = [
  'attackScalingPropertyValue',
  'level',
  CharacterStat.CRITICAL_RATE,
  CharacterStat.CRITICAL_DAMAGE,
  CharacterStat.DAMAGE_BONUS,
  CharacterStat.DAMAGE_AMPLIFICATION,
  CharacterStat.DAMAGE_MULTIPLIER_BONUS,
  CharacterStat.FINAL_DAMAGE_BONUS,
  CharacterStat.TUNE_STRAIN_DAMAGE_BONUS,
  CharacterStat.DEFENSE_IGNORE,
  CharacterStat.RESISTANCE_PENETRATION,
];

const BASE_STAT_KEYS: Partial<Record<AttackScalingProperty, ReadonlyArray<string>>> = {
  [AttackScalingProperty.ATK]: [
    CharacterStat.ATTACK_FLAT,
    CharacterStat.ATTACK_SCALING_BONUS,
    CharacterStat.ATTACK_FLAT_BONUS,
  ],
  [AttackScalingProperty.TUNE_RUPTURE_ATK]: [
    CharacterStat.ATTACK_FLAT,
    CharacterStat.ATTACK_SCALING_BONUS,
    CharacterStat.ATTACK_FLAT_BONUS,
  ],
  [AttackScalingProperty.HP]: [
    CharacterStat.HP_FLAT,
    CharacterStat.HP_SCALING_BONUS,
    CharacterStat.HP_FLAT_BONUS,
  ],
  [AttackScalingProperty.TUNE_RUPTURE_HP]: [
    CharacterStat.HP_FLAT,
    CharacterStat.HP_SCALING_BONUS,
    CharacterStat.HP_FLAT_BONUS,
  ],
  [AttackScalingProperty.DEF]: [
    CharacterStat.DEFENSE_FLAT,
    CharacterStat.DEFENSE_SCALING_BONUS,
    CharacterStat.DEFENSE_FLAT_BONUS,
  ],
  [AttackScalingProperty.TUNE_RUPTURE_DEF]: [
    CharacterStat.DEFENSE_FLAT,
    CharacterStat.DEFENSE_SCALING_BONUS,
    CharacterStat.DEFENSE_FLAT_BONUS,
  ],
};

const filterCharacterStats = (
  character: Record<string, number>,
  scalingStat: AttackScalingProperty,
): ClientCharacterStats => {
  const scalingType = getAttackScalingType(scalingStat);
  const keysToKeep = new Set<string>([
    ...UNIVERSAL_CHARACTER_KEYS,
    ...(BASE_STAT_KEYS[scalingStat] ?? []),
    ...(scalingType === AttackScalingType.TUNE_RUPTURE
      ? [CharacterStat.TUNE_BREAK_BOOST]
      : []),
  ]);
  return Object.fromEntries(
    Object.entries(character).filter(([key]) => keysToKeep.has(key)),
  ) as ClientCharacterStats;
};

// ---------------------------------------------------------------------------
// Enemy stat filtering
// ---------------------------------------------------------------------------

const UNIVERSAL_ENEMY_KEYS: ReadonlyArray<string> = [
  'level',
  EnemyStat.BASE_RESISTANCE,
  EnemyStat.RESISTANCE_REDUCTION,
];

const filterEnemyStats = (
  enemy: Record<string, number>,
  scalingStat: AttackScalingProperty,
): ClientEnemyStats => {
  const scalingType = getAttackScalingType(scalingStat);
  const keysToKeep = new Set<string>([
    ...UNIVERSAL_ENEMY_KEYS,
    ...(scalingType === AttackScalingType.FIXED ? [] : [EnemyStat.DEFENSE_REDUCTION]),
    ...(scalingType === AttackScalingType.NEGATIVE_STATUS ? [scalingStat] : []),
  ]);
  return Object.fromEntries(
    Object.entries(enemy).filter(([key]) => keysToKeep.has(key)),
  ) as ClientEnemyStats;
};

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export const adaptRotationResultToClientOutput = (
  result: RotationResult<StatMeta>,
): ClientRotationCalculationOutput => ({
  totalDamage: result.totalDamage,
  damageDetails: result.damageDetails.map((detail) => ({
    ...detail,
    character: filterCharacterStats(detail.character, detail.scalingStat),
    enemy: filterEnemyStats(detail.enemy, detail.scalingStat),
  })),
});

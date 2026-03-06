import { cloneDeep, mergeWith } from 'es-toolkit/object';

import type { EchoMainStatOptionType, EchoSubstatOptionType } from '@/schemas/echo';
import type { Enemy as ClientEnemy } from '@/schemas/enemy';
import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';
import type { Team as ClientTeam } from '@/schemas/team';
import type {
  Attack,
  GameDataStatParameterizedNumber,
  Modifier,
  PermanentStatBase,
} from '@/services/game-data';
import { getEchoStats } from '@/services/game-data';
import { CharacterStat, Tag } from '@/types';
import type {
  CharacterAttack,
  CharacterStats,
  EnemyStat,
  Modifier as RotationModifier,
  TaggedStatValue,
} from '@/types';

import type { StatParameterizedNumber } from '../core/resolve-runtime-number';
import type { Rotation } from '../core/types';

import { createGameDataEnricher } from './enrich-rotation-data';
import { expandModifiersByValueConfiguration } from './expand-modifiers-by-value-configuration';
import type { ResolveUserParameterizedType } from './resolve-user-parameterized-values';
import { resolveUserParameterizedValues } from './resolve-user-parameterized-values';

/**
 * Maps client-side echo stat types to server-side CharacterStat enums.
 */
export const ECHO_STAT_MAP: Record<
  EchoMainStatOptionType | EchoSubstatOptionType,
  [CharacterStat, Array<string>]
> = {
  hp_percent: [CharacterStat.HP_SCALING_BONUS, [Tag.ALL]],
  atk_percent: [CharacterStat.ATTACK_SCALING_BONUS, [Tag.ALL]],
  def_percent: [CharacterStat.DEFENSE_SCALING_BONUS, [Tag.ALL]],
  hp_flat: [CharacterStat.HP_FLAT_BONUS, [Tag.ALL]],
  atk_flat: [CharacterStat.ATTACK_FLAT_BONUS, [Tag.ALL]],
  def_flat: [CharacterStat.DEFENSE_FLAT_BONUS, [Tag.ALL]],
  energy_regen: [CharacterStat.ENERGY_REGEN, [Tag.ALL]],
  crit_rate: [CharacterStat.CRITICAL_RATE, [Tag.ALL]],
  crit_dmg: [CharacterStat.CRITICAL_DAMAGE, [Tag.ALL]],
  damage_bonus_basic_attack: [CharacterStat.DAMAGE_BONUS, [Tag.BASIC_ATTACK]],
  damage_bonus_heavy_attack: [CharacterStat.DAMAGE_BONUS, [Tag.HEAVY_ATTACK]],
  damage_bonus_resonance_skill: [CharacterStat.DAMAGE_BONUS, [Tag.RESONANCE_SKILL]],
  damage_bonus_resonance_liberation: [
    CharacterStat.DAMAGE_BONUS,
    [Tag.RESONANCE_LIBERATION],
  ],
  damage_bonus_glacio: [CharacterStat.DAMAGE_BONUS, [Tag.GLACIO]],
  damage_bonus_fusion: [CharacterStat.DAMAGE_BONUS, [Tag.FUSION]],
  damage_bonus_electro: [CharacterStat.DAMAGE_BONUS, [Tag.ELECTRO]],
  damage_bonus_aero: [CharacterStat.DAMAGE_BONUS, [Tag.AERO]],
  damage_bonus_spectro: [CharacterStat.DAMAGE_BONUS, [Tag.SPECTRO]],
  damage_bonus_havoc: [CharacterStat.DAMAGE_BONUS, [Tag.HAVOC]],
  healing_bonus: [CharacterStat.HEALING_BONUS, [Tag.ALL]],
} as const;

/**
 * Base character stats with default values for crit rate (5%), crit damage (50%), and energy regen (100%).
 */
export const CHARACTER_BASE_STATS: CharacterStats = {
  [CharacterStat.ATTACK_FLAT]: [],
  [CharacterStat.ATTACK_SCALING_BONUS]: [],
  [CharacterStat.ATTACK_FLAT_BONUS]: [],
  [CharacterStat.DEFENSE_FLAT]: [],
  [CharacterStat.DEFENSE_SCALING_BONUS]: [],
  [CharacterStat.DEFENSE_FLAT_BONUS]: [],
  [CharacterStat.HP_FLAT]: [],
  [CharacterStat.HP_SCALING_BONUS]: [],
  [CharacterStat.HP_FLAT_BONUS]: [],
  [CharacterStat.CRITICAL_RATE]: [],
  [CharacterStat.CRITICAL_DAMAGE]: [],
  [CharacterStat.DEFENSE_IGNORE]: [],
  [CharacterStat.RESISTANCE_PENETRATION]: [],
  [CharacterStat.DAMAGE_BONUS]: [],
  [CharacterStat.DAMAGE_AMPLIFICATION]: [],
  [CharacterStat.DAMAGE_MULTIPLIER_BONUS]: [],
  [CharacterStat.FINAL_DAMAGE_BONUS]: [],
  [CharacterStat.OFF_TUNE_BUILDUP_RATE]: [],
  [CharacterStat.TUNE_BREAK_BOOST]: [],
  [CharacterStat.TUNE_STRAIN_DAMAGE_BONUS]: [],
  [CharacterStat.ENERGY_REGEN]: [{ tags: [Tag.ALL], value: 1 }],
  [CharacterStat.HEALING_BONUS]: [],
};

const isStatParameterizedNode = (
  value: unknown,
): value is GameDataStatParameterizedNumber =>
  typeof value === 'object' &&
  value !== null &&
  'type' in value &&
  (value as Record<string, unknown>).type === 'statParameterizedNumber' &&
  'resolveWith' in value;

/**
 * Converts game-data statParameterizedNumber nodes into runtime stat references.
 * Works with union types, arrays, and objects (recursively).
 *
 * - GameDataStatParameterizedNumber → StatParameterizedNumber
 * - Array<GameDataStatParameterizedNumber> → Array<StatParameterizedNumber>
 * - Objects with GameDataStatParameterizedNumber → Objects with StatParameterizedNumber (recursive)
 * - number → number (passthrough)
 */
export type ResolveStatParameterizedType<T> = T extends GameDataStatParameterizedNumber
  ? StatParameterizedNumber
  : T extends Array<infer U>
    ? Array<ResolveStatParameterizedType<U>>
    : T extends object
      ? { [K in keyof T]: ResolveStatParameterizedType<T[K]> }
      : T;

/**
 * Resolves statParameterizedNumber nodes in a value tree to runtime stat references.
 *
 * - resolveWith: 'self'  → characterIndex: selfIndex
 * - resolveWith: 'enemy' → characterIndex: undefined
 *
 * - Recursively processes arrays and objects
 * - Preserves all other values
 */
export function resolveStatReferences<T>(
  value: T,
  index: number,
): ResolveStatParameterizedType<T> {
  if (isStatParameterizedNode(value)) {
    return {
      type: 'statParameterizedNumber',
      stat: value.stat,
      characterIndex: value.resolveWith === 'self' ? index : undefined,
    } as ResolveStatParameterizedType<T>;
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      resolveStatReferences(item, index),
    ) as ResolveStatParameterizedType<T>;
  }

  if (typeof value === 'object' && value !== null) {
    const resolved: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      resolved[key] = resolveStatReferences(nestedValue, index);
    }
    return resolved as ResolveStatParameterizedType<T>;
  }

  return value as ResolveStatParameterizedType<T>;
}

/**
 * Converts a client-side modifier instance to a rotation modifier.
 * Resolves modifier targets and maps stats from 'self' to the character's slot number.
 */
export const toRotationModifier = (
  modifier: ModifierInstance & ResolveUserParameterizedType<Modifier>,
  attack: Pick<AttackInstance, 'characterId'>,
  characterIdToSlotNumberMap: Record<number, number>,
): RotationModifier => {
  const characterSlotNumber = characterIdToSlotNumberMap[modifier.characterId];
  const statsWithResolvedIndex = modifier.modifiedStats.map((stat) => ({
    ...stat,
    value: resolveStatReferences(stat.value, characterSlotNumber),
  }));
  const modifiedStats = Object.groupBy(statsWithResolvedIndex, (_stat) => _stat.stat);

  let modifierTargets: Array<number | 'enemy'>;
  switch (modifier.target) {
    case 'self': {
      modifierTargets = [characterSlotNumber];
      break;
    }
    case 'team': {
      modifierTargets = [0, 1, 2];
      break;
    }
    case 'activeCharacter': {
      modifierTargets = [characterIdToSlotNumberMap[attack.characterId]];
      break;
    }
    default: {
      modifierTargets = ['enemy'];
    }
  }

  return {
    targets: modifierTargets,
    modifiedStats,
  };
};

/**
 * Converts a permanent stat to include the character's slot number for runtime resolution.
 */
export const toRotationPermanentStat = (
  stat: ResolveUserParameterizedType<PermanentStatBase>,
  characterIndex: number,
): TaggedStatValue & { stat: CharacterStat | EnemyStat } => {
  return {
    ...stat,
    value: resolveStatReferences(stat.value, characterIndex),
  };
};

/**
 * Converts an attack instance to a CharacterAttack for the rotation calculator.
 */
export const toRotationAttack = (
  instance: AttackInstance &
    ResolveUserParameterizedType<Attack> & { modifiers: Array<RotationModifier> },
  characterIdToSlotNumberMap: Record<number, number>,
): CharacterAttack => {
  return {
    characterIndex: characterIdToSlotNumberMap[instance.characterId],
    damageInstances: instance.damageInstances.map((di) => ({
      scalingStat: di.scalingStat,
      tags: di.tags,
      motionValue: di.motionValue,
    })),
  };
};

/**
 * Determines if a modifier should apply to an attack based on the attack's position
 * and the modifier's horizontal placement on the rotation timeline.
 */
export const shouldModifierApplyToAttack = (
  attackIndex: number,
  modifier: ModifierInstance,
): boolean => {
  return attackIndex >= modifier.x && attackIndex < modifier.x + modifier.w;
};

/**
 * Main adapter function that transforms client-side inputs into a Rotation object
 * for the rotation calculator.
 *
 * This function:
 * 1. Enriches client data with game data (character abilities, weapon stats, echo stats, etc.)
 * 2. Maps client team to rotation team format with all permanent stats
 * 3. Maps client enemy to rotation enemy format
 * 4. Transforms attacks and buffs into damage instances with their applicable modifiers
 *
 * @param clientTeam - Team configuration from the client
 * @param clientEnemy - Enemy configuration from the client
 * @param attacks - Array of attack instances to calculate
 * @param buffs - Array of modifier (buff/debuff) instances
 * @returns A Rotation object ready for damage calculation
 */
export const adaptClientInputToRotation = async (
  clientTeam: ClientTeam,
  clientEnemy: ClientEnemy,
  attacks: Array<AttackInstance>,
  buffs: Array<ModifierInstance>,
): Promise<Rotation> => {
  // 1. Create game data enricher with all necessary game data
  const enricher = await createGameDataEnricher(clientTeam);

  // 2. Map Client Team to Rotation Team
  const team = clientTeam.map((clientChar, charIndex) => {
    // 2a. Gather Permanent Stats from character, weapon, echo set
    const permanentStats = enricher.getPermanentStatsForCharacter(charIndex);

    // 2b. Gather Echo Stats (main stat + substats)
    const echoStats: Array<PermanentStatBase> = clientChar.echoStats.flatMap((echo) => {
      const [mainStatName, mainTags] = ECHO_STAT_MAP[echo.mainStatType];
      const { primary, secondary } = getEchoStats(echo.cost, echo.mainStatType);
      if (!primary) throw new Error('Invalid Echo Stat Configuration Provided');
      const mainStatEntry = {
        stat: mainStatName,
        value: primary.value,
        tags: mainTags,
      };
      const subStatEntries = echo.substats.map((substat) => {
        const [subName, subTags] = ECHO_STAT_MAP[substat.stat];
        return {
          stat: subName,
          value: Number.isInteger(substat.value) ? substat.value : substat.value / 100,
          tags: subTags,
        };
      });
      return [mainStatEntry, secondary, ...subStatEntries];
    });

    // 2c. Group all stats by their stat type and merge with base stats
    const characterInstancePermanentStats = Object.groupBy(
      [...permanentStats, ...echoStats].map((stat) =>
        toRotationPermanentStat(stat, charIndex),
      ),
      (item) => item.stat,
    );

    const finalStats = mergeWith(
      cloneDeep(CHARACTER_BASE_STATS),
      characterInstancePermanentStats,
      (objectValue, sourceValue) => [...objectValue, ...sourceValue],
    );

    return {
      id: clientChar.id,
      level: 90,
      stats: finalStats,
    };
  });

  // 3. Map Client Enemy to Rotation Enemy
  const enemy = {
    level: clientEnemy.level,
    stats: {
      baseResistance: Object.entries(clientEnemy.resistances).map(
        ([attribute, value]) => ({
          value: value / 100,
          tags: [attribute],
        }),
      ),
      defenseReduction: [],
      resistanceReduction: [],
      glacioChafe: [],
      spectroFrazzle: [],
      fusionBurst: [],
      havocBane: [],
      aeroErosion: [],
      electroFlare: [],
      tuneStrainStacks: [],
    },
  };

  // 4. Map Attacks and Buffs to Damage Instances
  const characterIdToSlotNumberMap = Object.fromEntries(
    clientTeam.map((c, index) => [c.id, index]),
  ) as Record<number, number>;

  const expandedBuffs = buffs.flatMap((buff) =>
    expandModifiersByValueConfiguration(buff),
  );

  const buildModifiers = (
    storedIndex: number,
    activeCharacterId: number,
  ): Array<RotationModifier> =>
    expandedBuffs
      .filter((modifier) => shouldModifierApplyToAttack(storedIndex, modifier))
      .flatMap((modifier): Array<RotationModifier> => {
        return [
          toRotationModifier(
            resolveUserParameterizedValues(enricher.enrichModifier(modifier)),
            { characterId: activeCharacterId },
            characterIdToSlotNumberMap,
          ),
        ];
      });

  const rotationAttacks = attacks.flatMap((attack, storedIndex) => {
    const enriched = enricher.enrichAttack(attack);
    const resolved = resolveUserParameterizedValues(enriched);
    const modifiers = buildModifiers(storedIndex, attack.characterId);
    return [
      {
        attack: toRotationAttack(
          { ...resolved, modifiers },
          characterIdToSlotNumberMap,
        ),
        modifiers,
        storedAttackIndex: storedIndex,
      },
    ];
  });

  return {
    team,
    enemy,
    duration: 25,
    attacks: rotationAttacks,
  };
};

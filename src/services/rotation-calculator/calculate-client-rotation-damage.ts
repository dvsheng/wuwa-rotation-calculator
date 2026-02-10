import { createServerFn } from '@tanstack/react-start';
import { cloneDeep, mergeWith } from 'es-toolkit/object';

import type { EchoMainStatOptionType, EchoSubstatOptionType } from '@/schemas/echo';
import type { Enemy as ClientEnemy } from '@/schemas/enemy';
import { CalculateRotationInputSchema } from '@/schemas/game-data-service';
import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';
import type { Team as ClientTeam } from '@/schemas/team';
import { getEchoStats } from '@/services/game-data/get-echo-stats';
import type {
  Attack,
  Modifier as GameDataModifier,
  PermanentStatBase,
} from '@/services/game-data/types';
import { CharacterStat, Tag } from '@/types';
import type {
  CharacterDamageInstance,
  CharacterSlotNumber,
  CharacterStats,
  EnemyStat,
  Integer,
  Modifier as RotationModifier,
  RotationRuntimeResolvableNumber,
  TaggedStatValue,
} from '@/types';

import {
  GameDataNotFoundError,
  createGameDataEnricher,
} from './client-input-adapter/enrich-rotation-data';
import type { ResolveUserParameterizedType } from './client-input-adapter/resolve-user-parameterized-values';
import { resolveUserParameterizedValues } from './client-input-adapter/resolve-user-parameterized-values';
import { calculateRotationDamage } from './core/calculate-rotation-damage';
import type { RotationResult } from './core/types';

/**
 * Maps client-side echo stat types to server-side CharacterStat enums.
 */
const ECHO_STAT_MAP: Record<
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

const CHARACTER_BASE_STATS: CharacterStats = {
  [CharacterStat.ATTACK_FLAT]: [],
  [CharacterStat.ATTACK_SCALING_BONUS]: [],
  [CharacterStat.ATTACK_FLAT_BONUS]: [],
  [CharacterStat.DEFENSE_FLAT]: [],
  [CharacterStat.DEFENSE_SCALING_BONUS]: [],
  [CharacterStat.DEFENSE_FLAT_BONUS]: [],
  [CharacterStat.HP_FLAT]: [],
  [CharacterStat.HP_SCALING_BONUS]: [],
  [CharacterStat.HP_FLAT_BONUS]: [],
  [CharacterStat.CRITICAL_RATE]: [{ tags: [Tag.ALL], value: 0.05 }],
  [CharacterStat.CRITICAL_DAMAGE]: [{ tags: [Tag.ALL], value: 0.5 }],
  [CharacterStat.DEFENSE_IGNORE]: [],
  [CharacterStat.RESISTANCE_PENETRATION]: [],
  [CharacterStat.DAMAGE_BONUS]: [],
  [CharacterStat.DAMAGE_AMPLIFICATION]: [],
  [CharacterStat.DAMAGE_MULTIPLIER_BONUS]: [],
  [CharacterStat.FINAL_DAMAGE_BONUS]: [],
  [CharacterStat.FLAT_DAMAGE]: [],
  [CharacterStat.OFF_TUNE_BUILDUP_RATE]: [],
  [CharacterStat.TUNE_BREAK_BOOST]: [],
  [CharacterStat.ENERGY_REGEN]: [{ tags: [Tag.ALL], value: 1 }],
  [CharacterStat.HEALING_BONUS]: [],
};

export const toRotationModifier = (
  modifier: ModifierInstance & ResolveUserParameterizedType<GameDataModifier>,
  attack: AttackInstance & ResolveUserParameterizedType<Attack>,
  characterIdToSlotNumberMap: Record<number, CharacterSlotNumber>,
): RotationModifier => {
  // Map resolveWith from 'self' to character index for each stat value
  const characterSlotNumber = characterIdToSlotNumberMap[modifier.characterId];
  const statsWithResolvedIndex = modifier.modifiedStats.map((stat) => {
    return typeof stat.value === 'number'
      ? stat
      : {
          ...stat,
          value: {
            ...stat.value,
            resolveWith: characterSlotNumber,
          } satisfies RotationRuntimeResolvableNumber,
        };
  }) as Array<TaggedStatValue & { stat: CharacterStat | EnemyStat }>;
  const modifiedStats = Object.groupBy(statsWithResolvedIndex, (_stat) => _stat.stat);

  let modifierTargets: Array<0 | 1 | 2 | 'enemy'>;
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

export const toRotationPermanentStat = (
  stat: PermanentStatBase,
  characterIndex: number,
): TaggedStatValue & { stat: CharacterStat | EnemyStat } => {
  const value =
    typeof stat.value === 'object'
      ? ({
          ...stat.value,
          resolveWith: characterIndex as CharacterSlotNumber,
        } satisfies RotationRuntimeResolvableNumber)
      : stat.value;
  return {
    ...stat,
    value,
  };
};

const toRotationDamageInstance = (
  instance: AttackInstance &
    ResolveUserParameterizedType<Attack> & { modifiers: Array<RotationModifier> },
  characterIdToSlotNumberMap: Record<number, CharacterSlotNumber>,
): CharacterDamageInstance => {
  return {
    scalingStat: instance.scalingStat,
    tags: instance.tags,
    motionValues: instance.motionValues,
    characterIndex: characterIdToSlotNumberMap[instance.characterId],
  };
};

const shouldModifierApplyToAttack = (
  attackIndex: number,
  modifier: ModifierInstance,
) => {
  return attackIndex >= modifier.x && attackIndex < modifier.x + modifier.w;
};

/**
 * Bridge service to connect frontend store data to the rotation calculator.
 */
export const calculateRotationHandler = async (
  clientTeam: ClientTeam,
  clientEnemy: ClientEnemy,
  attacks: Array<AttackInstance>,
  buffs: Array<ModifierInstance>,
): Promise<RotationResult> => {
  // 1. Create game data enricher with all necessary game data
  const enricher = await createGameDataEnricher(clientTeam);

  // 2. Map Client Team to Server Team
  const serverTeam = clientTeam.map((clientChar, charIndex) => {
    // 2a. Gather Permanent Stats (Flat Array)
    const permanentStats = enricher.getPermanentStatsForCharacter(charIndex);

    // 2b. Gather Echo Stats (Flat Array)
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
          value: substat.value / 100,
          tags: subTags,
        };
      });
      return [mainStatEntry, secondary, ...subStatEntries];
    });

    // 2c. Group all new incoming stats by their stat name
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
      level: 90 as Integer,
      stats: finalStats,
    };
  });

  // 3. Map Client Enemy to Server Enemy
  const serverEnemy = {
    level: clientEnemy.level as Integer,
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
    },
  };

  // 4. Map Attacks and active Buffs to Damage Instances
  const characterIdToSlotNumberMap = Object.fromEntries(
    clientTeam.map((c, index) => [c.id, index]),
  ) as Record<number, CharacterSlotNumber>;

  const damageInstances = attacks
    .map((attack) => enricher.enrichAttack(attack))
    .map((attack) => resolveUserParameterizedValues(attack))
    .map((attack, index) => ({
      ...attack,
      modifiers: buffs
        .filter((modifier) => shouldModifierApplyToAttack(index, modifier))
        .map((modifier) => enricher.enrichModifier(modifier))
        .map((modifier) => resolveUserParameterizedValues(modifier))
        .map((modifier) =>
          toRotationModifier(modifier, attack, characterIdToSlotNumberMap),
        ),
    }))
    .map((instance) => ({
      instance: toRotationDamageInstance(instance, characterIdToSlotNumberMap),
      modifiers: instance.modifiers,
    }));

  return calculateRotationDamage({
    team: serverTeam,
    enemy: serverEnemy,
    duration: 25,
    damageInstances,
  });
};

export const calculateRotation = createServerFn({
  method: 'POST',
})
  .inputValidator(CalculateRotationInputSchema)
  .handler(async ({ data }) => {
    try {
      return calculateRotationHandler(data.team, data.enemy, data.attacks, data.buffs);
    } catch (error) {
      console.error(error);

      if (error instanceof GameDataNotFoundError) {
        throw new Error(`Unable to calculate rotation: ${error.message}`);
      }

      throw new Error('Failed to calculate rotation damage');
    }
  });

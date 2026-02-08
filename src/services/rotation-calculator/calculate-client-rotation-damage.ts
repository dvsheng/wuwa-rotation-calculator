import { createServerFn } from '@tanstack/react-start';
import { mapAsync } from 'es-toolkit/array';
import { cloneDeep, mergeWith } from 'es-toolkit/object';

import { EchoMainStatOption } from '@/schemas/echo';
import type {
  EchoCost,
  EchoMainStatOptionType,
  EchoSubstatOptionType,
} from '@/schemas/echo';
import type { Enemy as ClientEnemy } from '@/schemas/enemy';
import { CalculateRotationInputSchema } from '@/schemas/game-data-service';
import type {
  AttackInstance,
  ModifierInstance,
  ParameterInstance,
} from '@/schemas/rotation';
import type { Team as ClientTeam } from '@/schemas/team';
import type {
  Attack,
  BaseCapability,
  Modifier as GameDataModifier,
  PermanentStatBase,
} from '@/services/game-data/types';
import { calculateParameterizedNumberValue } from '@/services/rotation-calculator/calculate-parameterized-number';
import { CharacterStat, Tag, isUserParameterizedNumber } from '@/types';
import type {
  CharacterDamageInstance,
  CharacterSlotNumber,
  CharacterStats,
  EnemyStat,
  EnemyStats,
  Integer,
  Modifier as RotationModifier,
  RotationRuntimeResolvableNumber,
  TaggedStatValue,
  UserParameterizedNumber,
} from '@/types';

import { getEntityByHakushinId } from '../game-data/get-entity-details.function';

import { calculateRotationDamage } from './calculate-rotation-damage';
import type { RotationResult } from './types';

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

const ECHO_SECONDARY_STAT_BY_COST: Record<EchoCost, PermanentStatBase> = {
  1: { stat: CharacterStat.HP_FLAT_BONUS, value: 2280, tags: [Tag.ALL] },
  3: { stat: CharacterStat.ATTACK_FLAT_BONUS, value: 100, tags: [Tag.ALL] },
  4: { stat: CharacterStat.ATTACK_FLAT_BONUS, value: 150, tags: [Tag.ALL] },
} as const;

const ECHO_PRIMARY_STAT_BY_COST_BY_STAT: Record<
  EchoCost,
  Partial<Record<EchoMainStatOptionType, PermanentStatBase>>
> = {
  1: {
    [EchoMainStatOption.HP_PERCENT]: {
      stat: CharacterStat.HP_SCALING_BONUS,
      value: 0.18,
      tags: [Tag.ALL],
    },
    [EchoMainStatOption.ATK_PERCENT]: {
      stat: CharacterStat.ATTACK_SCALING_BONUS,
      value: 0.18,
      tags: [Tag.ALL],
    },
    [EchoMainStatOption.DEF_PERCENT]: {
      stat: CharacterStat.DEFENSE_SCALING_BONUS,
      value: 0.228,
      tags: [Tag.ALL],
    },
  },
  3: {
    [EchoMainStatOption.HP_PERCENT]: {
      stat: CharacterStat.HP_SCALING_BONUS,
      value: 0.3,
      tags: [Tag.ALL],
    },
    [EchoMainStatOption.ATK_PERCENT]: {
      stat: CharacterStat.ATTACK_SCALING_BONUS,
      value: 0.3,
      tags: [Tag.ALL],
    },
    [EchoMainStatOption.DEF_PERCENT]: {
      stat: CharacterStat.DEFENSE_SCALING_BONUS,
      value: 0.38,
      tags: [Tag.ALL],
    },
    [EchoMainStatOption.DAMAGE_BONUS_AERO]: {
      stat: CharacterStat.DAMAGE_BONUS,
      value: 0.3,
      tags: [Tag.AERO],
    },
    [EchoMainStatOption.DAMAGE_BONUS_ELECTRO]: {
      stat: CharacterStat.DAMAGE_BONUS,
      value: 0.3,
      tags: [Tag.ELECTRO],
    },
    [EchoMainStatOption.DAMAGE_BONUS_GLACIO]: {
      stat: CharacterStat.DAMAGE_BONUS,
      value: 0.3,
      tags: [Tag.GLACIO],
    },
    [EchoMainStatOption.DAMAGE_BONUS_FUSION]: {
      stat: CharacterStat.DAMAGE_BONUS,
      value: 0.3,
      tags: [Tag.FUSION],
    },
    [EchoMainStatOption.DAMAGE_BONUS_HAVOC]: {
      stat: CharacterStat.DAMAGE_BONUS,
      value: 0.3,
      tags: [Tag.HAVOC],
    },
    [EchoMainStatOption.DAMAGE_BONUS_SPECTRO]: {
      stat: CharacterStat.DAMAGE_BONUS,
      value: 0.3,
      tags: [Tag.SPECTRO],
    },
    [EchoMainStatOption.ENERGY_REGEN]: {
      stat: CharacterStat.ENERGY_REGEN,
      value: 0.32,
      tags: [Tag.ALL],
    },
  },
  4: {
    [EchoMainStatOption.HP_PERCENT]: {
      stat: CharacterStat.HP_SCALING_BONUS,
      value: 0.33,
      tags: [Tag.ALL],
    },
    [EchoMainStatOption.ATK_PERCENT]: {
      stat: CharacterStat.ATTACK_SCALING_BONUS,
      value: 0.33,
      tags: [Tag.ALL],
    },
    [EchoMainStatOption.DEF_PERCENT]: {
      stat: CharacterStat.DEFENSE_SCALING_BONUS,
      value: 0.415,
      tags: [Tag.ALL],
    },
    [EchoMainStatOption.CRIT_DMG]: {
      stat: CharacterStat.CRITICAL_DAMAGE,
      value: 0.22,
      tags: [Tag.ALL],
    },
    [EchoMainStatOption.CRIT_RATE]: {
      stat: CharacterStat.CRITICAL_RATE,
      value: 0.44,
      tags: [Tag.ALL],
    },
    [EchoMainStatOption.HEALING_BONUS]: {
      stat: CharacterStat.HEALING_BONUS,
      value: 0.26,
      tags: [Tag.ALL],
    },
  },
};

const enrichWith = <TCapability extends BaseCapability>(store: Array<TCapability>) => {
  const map = new Map(store.map((s) => [s.id, s]));
  return <T extends { id: number }>(base: T) => {
    const details = map.get(base.id);
    if (!details) {
      throw new Error(`Capability details not found for entity with ID ${base.id}`);
    }
    return {
      ...base,
      ...details,
    };
  };
};

const resolveUserParameterizedNumber = <T>(
  number: T | UserParameterizedNumber,
  parameters: Array<ParameterInstance>,
) => {
  if (isUserParameterizedNumber(number)) {
    return calculateParameterizedNumberValue(
      number,
      Object.fromEntries(
        parameters.map((parameter) => [parameter.id, parameter.value]),
      ),
    );
  }
  return number;
};

const resolveUserParameterizedAttack = (attack: AttackInstance & Attack) => {
  const parameterValues = attack.parameterValues ?? [];
  return {
    ...attack,
    motionValues: attack.motionValues.map((mv) =>
      resolveUserParameterizedNumber(mv, parameterValues),
    ),
  };
};

const resolveModifierUserParameters = (
  modifier: ModifierInstance & GameDataModifier,
) => {
  console.log('Resolving modifier user parametersa', modifier);
  const parameterValues = modifier.parameterValues ?? [];
  const modifiedStats = modifier.modifiedStats.map((stat) => ({
    ...stat,
    value: resolveUserParameterizedNumber(stat.value, parameterValues),
  }));
  return {
    ...modifier,
    modifiedStats,
  };
};

export const toRotationModifier = (
  modifier: ModifierInstance & GameDataModifier,
  attack: AttackInstance & Attack,
  characterIdToSlotNumberMap: Record<string, number>,
): RotationModifier => {
  // Map resolveWith from 'self' to character index for each stat value
  const characterSlotNumber = characterIdToSlotNumberMap[
    modifier.characterId
  ] as CharacterSlotNumber;
  const statsWithResolvedIndex = modifier.modifiedStats
    .map((stat) => {
      if (typeof stat.value === 'object' && !isUserParameterizedNumber(stat.value)) {
        return {
          ...stat,
          value: {
            ...stat.value,
            resolveWith: characterSlotNumber,
          } satisfies RotationRuntimeResolvableNumber,
        };
      }
      return stat;
    })
    .filter((stat) => !isUserParameterizedNumber(stat.value)) as Array<
    TaggedStatValue & { stat: CharacterStat | EnemyStat }
  >;

  const modifiedStats: Partial<CharacterStats> | Partial<EnemyStats> = Object.groupBy(
    statsWithResolvedIndex,
    (_stat) => _stat.stat,
  );

  switch (modifier.target) {
    case 'self': {
      return {
        targets: [characterSlotNumber],
        modifiedStats: modifiedStats,
      };
    }
    case 'team': {
      return {
        targets: [0, 1, 2],
        modifiedStats: modifiedStats,
      };
    }
    case 'activeCharacter': {
      return {
        targets: [
          characterIdToSlotNumberMap[attack.characterId] as CharacterSlotNumber,
        ],
        modifiedStats: modifiedStats,
      };
    }
    default: {
      return {
        targets: ['enemy'],
        modifiedStats: modifiedStats,
      };
    }
  }
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
  instance: AttackInstance & Attack & { modifiers: Array<RotationModifier> },
): CharacterDamageInstance => {
  return {
    scalingStat: instance.scalingStat,
    tags: instance.tags,
    motionValues: instance.motionValues as Array<number>,
    characterId: instance.characterId,
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
  // 1. Fetch all necessary game data in parallel
  const entityDetails = await Promise.all([
    mapAsync(clientTeam, (c) =>
      getEntityByHakushinId({ data: { id: c.primarySlotEcho.id, entityType: 'echo' } }),
    ),
    mapAsync(clientTeam, (c) =>
      getEntityByHakushinId({
        data: {
          id: c.id,
          entityType: 'character',
          activatedSequence: c.sequence,
        },
      }),
    ),
    mapAsync(clientTeam, (c) =>
      getEntityByHakushinId({
        data: {
          id: c.weapon.id,
          entityType: 'weapon',
          refineLevel: c.weapon.refine,
        },
      }),
    ),
    mapAsync(
      clientTeam.flatMap((c) => c.echoSets),
      (set) =>
        getEntityByHakushinId({
          data: {
            id: set.id,
            entityType: 'echo_set',
            activatedSetBonus: Number.parseInt(set.requirement),
          },
        }),
    ),
  ]);
  const modifierDetails = entityDetails.flatMap((entity) =>
    entity.flatMap((detail) => detail.capabilities.modifiers),
  );
  const attackDetails = entityDetails.flatMap((entity) =>
    entity.flatMap((detail) => detail.capabilities.attacks),
  );
  const enrichAttackWithDetails = enrichWith(attackDetails);
  const enrichModifierWithDetails = enrichWith(modifierDetails);

  // 2. Map Client Team to Server Team
  const serverTeam = clientTeam.map((clientChar, charIndex) => {
    // 2a. Gather Permanent Stats (Flat Array)
    const permanentStats = entityDetails.flatMap(
      (entity) => entity[charIndex].capabilities.permanentStats,
    );

    // 2b. Gather Echo Stats (Flat Array)
    const echoStats: Array<PermanentStatBase> = clientChar.echoStats.flatMap((echo) => {
      const [mainStatName, mainTags] = ECHO_STAT_MAP[echo.mainStatType];
      const mainStatEntry = {
        stat: mainStatName,
        value:
          ECHO_PRIMARY_STAT_BY_COST_BY_STAT[echo.cost][echo.mainStatType]?.value ?? 0,
        tags: mainTags,
      };
      const secondaryStatEntry = ECHO_SECONDARY_STAT_BY_COST[echo.cost];
      const subStatEntries = echo.substats.map((substat) => {
        const [subName, subTags] = ECHO_STAT_MAP[substat.stat];
        return {
          stat: subName,
          value: substat.value / 100,
          tags: subTags,
        };
      });
      return [mainStatEntry, secondaryStatEntry, ...subStatEntries];
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
  );
  const damageInstances = attacks
    .map((attack) => enrichAttackWithDetails(attack))
    .map((attack) => resolveUserParameterizedAttack(attack))
    .map((attack, index) => ({
      ...attack,
      modifiers: buffs
        .filter((modifier) => shouldModifierApplyToAttack(index, modifier))
        .map((modifier) => enrichModifierWithDetails(modifier))
        .map((modifier) => resolveModifierUserParameters(modifier))
        .map((modifier) =>
          toRotationModifier(modifier, attack, characterIdToSlotNumberMap),
        ),
    }))
    .map((instance) => ({
      instance: toRotationDamageInstance(instance),
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
      throw new Error('Failed to calculate rotation damage');
    }
  });

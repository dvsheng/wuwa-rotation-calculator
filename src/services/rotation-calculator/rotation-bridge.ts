import type { EchoMainStatOptionType, EchoSubstatOptionType } from '@/schemas/echo';
import type { Enemy as ClientEnemy } from '@/schemas/enemy';
import type { Attack, BuffWithPosition } from '@/schemas/rotation';
import type { Team as ClientTeam } from '@/schemas/team';
import { getCharacterDetails } from '@/services/game-data/character/get-character-details';
import type { Attack as ServerAttack } from '@/services/game-data/common-types';
import { getEchoDetails } from '@/services/game-data/echo/get-echo-details';
import { getWeaponDetails } from '@/services/game-data/weapon/get-weapon-details';
import { Attribute } from '@/types';
import type { Integer } from '@/types';
import { isUserParameterizedNumber } from '@/types/parameterized-number';
import { Tag } from '@/types/server';
import type {
  CharacterStats,
  EnemyStats,
  Modifier,
  Enemy as ServerEnemy,
  Team as ServerTeam,
  TaggedStatValue,
} from '@/types/server';
import { CharacterStat } from '@/types/server/character';
import { calculateParameterizedNumberValue } from '@/utils/math-utils';

import { getEchoSetDetails } from '../game-data/echo-set/get-echo-set-details';

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

/**
 * Bridge service to connect frontend store data to the rotation calculator.
 */
export const calculateRotation = async (
  clientTeam: ClientTeam,
  clientEnemy: ClientEnemy,
  attacks: Array<Attack>,
  buffs: Array<BuffWithPosition>,
): Promise<RotationResult> => {
  // 1. Fetch all necessary game data in parallel
  const [characterDetails, weaponDetails, primaryEchoDetails, echoSetDetails] =
    await Promise.all([
      Promise.all(clientTeam.map((c) => getCharacterDetails({ data: c.id }))),
      Promise.all(clientTeam.map((c) => getWeaponDetails({ data: c.weapon.id }))),
      Promise.all(
        clientTeam.map((c) => getEchoDetails({ data: c.primarySlotEcho.id })),
      ),
      Promise.all(
        clientTeam.map((c) =>
          Promise.all(c.echoSets.map((set) => getEchoSetDetails({ data: set.id }))),
        ),
      ),
    ]);

  const modifierDetails = [
    ...characterDetails.flatMap((char) => char.capabilities.modifiers),
    ...weaponDetails.flatMap((weapon) => weapon.capabilities[1].modifiers),
    ...echoSetDetails.flatMap((sets) =>
      sets.flatMap((set) => set.setEffects[5]?.modifiers),
    ),
    ...primaryEchoDetails.flatMap((echo) => echo.capabilities.modifiers),
  ].filter((mod) => mod !== undefined);

  const attackDetails = [
    ...characterDetails.flatMap((char) => char.capabilities.attacks),
    ...weaponDetails.flatMap((weapon) => weapon.capabilities[1].attacks),
    ...echoSetDetails.flatMap((sets) =>
      sets.flatMap((set) => set.setEffects[5]?.attacks),
    ),
    ...primaryEchoDetails.flatMap((echo) => echo.capabilities.attacks),
  ].filter((attack) => attack !== undefined);

  // 2. Map Client Team to Server Team
  const serverTeam = clientTeam.map((clientChar, charIndex) => {
    // 1. Gather Permanent Stats (Flat Array)
    const permanentStats = [
      ...characterDetails[charIndex].capabilities.permanentStats.map(
        ({ name, originType, parentName, ...stat }) => stat,
      ),
      ...weaponDetails[charIndex].capabilities[1].permanentStats,
      ...primaryEchoDetails[charIndex].capabilities.permanentStats,
      ...echoSetDetails[charIndex].flatMap((set) => set.setEffects[5]?.permanentStats),
    ]
      .filter((stat) => stat !== undefined)
      .map(
        ({ id, description, ...stat }) =>
          stat as TaggedStatValue & { stat: CharacterStat },
      );

    // 2. Gather Echo Stats (Flat Array)
    const echoStats = clientChar.echoStats.flatMap((echo) => {
      const [mainStatName, mainTags] = ECHO_STAT_MAP[echo.mainStatType];
      const mainStatEntry = {
        stat: mainStatName,
        value: 0,
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
      return [mainStatEntry, ...subStatEntries];
    });

    // 3. Group all new incoming stats by their stat name
    // Note: We combine both sources before grouping to reduce passes
    const characterInstancePermanentStats = Object.groupBy(
      [...permanentStats, ...echoStats],
      (item) => item.stat,
    );

    // 4. Merge into Base Stats (Immutable Creation)
    // We iterate over the keys of the Base Stats to ensure the shape is preserved
    const finalStats = Object.fromEntries(
      Object.entries(CHARACTER_BASE_STATS).map(([statName, baseValues]) => {
        const statValues = characterInstancePermanentStats[statName] ?? [];
        const sanitizedStatValues = statValues.map(({ stat, ...rest }) => rest);

        return [statName, [...baseValues, ...sanitizedStatValues]];
      }),
    );
    return {
      id: clientChar.id,
      level: 90,
      stats: finalStats,
    };
  }) as ServerTeam;

  // 3. Map Client Enemy to Server Enemy
  const serverEnemy: ServerEnemy = {
    level: clientEnemy.level as Integer,
    stats: {
      baseResistance: Object.entries(clientEnemy.resistances).map(([attr, val]) => ({
        value: val / 100,
        tags: [attr],
      })),
      defenseReduction: [],
      resistanceReduction: [],
      glacioChafe: [],
      spectroFrazzle: [],
      fusionBurst: [],
      havocBane: [],
      aeroErosion: [],
      electroFlare: [],
    } as EnemyStats,
  };

  // 4. Map Attacks and active Buffs to Damage Instances
  const damageInstances = attacks
    .map(
      (attack) =>
        ({
          ...attack,
          ...attackDetails.find((attackDetail) => attackDetail.id === attack.id),
        }) as ServerAttack & { parameterValues: Array<number> } & Attack,
    )
    .map((attack) => ({
      ...attack,
      motionValues: attack.motionValues.map((mv) =>
        isUserParameterizedNumber(mv)
          ? calculateParameterizedNumberValue(
              mv,
              Object.fromEntries(
                attack.parameterValues.map((value, index) => [String(index), value]),
              ),
            )
          : mv,
      ),
    }))
    .map((attack, index) => ({
      ...attack,
      modifiers: buffs
        .filter((buff) => index >= buff.x && index < buff.x + buff.w)
        .map((buff) => modifierDetails.find((modifier) => modifier.id === buff.id))
        .filter((modifier) => modifier !== undefined)
        .map(
          ({ description, id, ...modifier }) =>
            ({
              ...modifier,
              modifiedStats: Object.groupBy(
                modifier.modifiedStats,
                (stat) => stat.stat,
              ),
            }) as Modifier,
        ),
    }))
    .map((instance) => ({
      instance: {
        scalingStat: instance.scalingStat,
        tags: instance.tags,
        motionValues: instance.motionValues,
        originCharacterName: instance.characterId,
        attribute: Attribute.AERO,
      },
      modifiers: instance.modifiers,
    }));
  console.log(
    JSON.stringify(
      {
        team: serverTeam,
        enemy: serverEnemy,
        duration: 25,
        damageInstances,
      },
      null,
      2,
    ),
  );
  return calculateRotationDamage({
    team: serverTeam,
    enemy: serverEnemy,
    duration: 25,
    damageInstances,
  });
};

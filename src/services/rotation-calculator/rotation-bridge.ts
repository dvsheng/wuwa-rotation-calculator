/* eslint-disable */
// @ts-nocheck

import type { EchoMainStatOptionType, EchoSubstatOptionType } from '@/schemas/echo';
import type { Enemy as ClientEnemy } from '@/schemas/enemy';
import type { Attack, BuffWithPosition } from '@/schemas/rotation';
import type { Team as ClientTeam } from '@/schemas/team';
import { getCharacterDetails } from '@/services/game-data/character/get-character-details';
import { getEchoDetails } from '@/services/game-data/echo/get-echo-details';
import { getWeaponDetails } from '@/services/game-data/weapon/get-weapon-details';
import { NegativeStatus } from '@/types';
import type { Integer } from '@/types';
import { isUserParameterizedNumber } from '@/types/parameterized-number';
import { Tag } from '@/types/server';
import type {
  CharacterDamageInstance,
  CharacterStats,
  EnemyStats,
  Modifier,
  Character as ServerCharacter,
  Enemy as ServerEnemy,
  Team as ServerTeam,
  StatValue,
  Team,
} from '@/types/server';
import { CharacterStat } from '@/types/server/character';
import { calculateParameterizedNumberValue } from '@/utils/math-utils';

import { getEchoSetDetails } from '../game-data/echo-set/get-echo-set-details';
import type { RefineLevel } from '../game-data/weapon/types';

import { calculateRotationDamage } from './calculate-rotation-damage';
import type { RotationResult } from './types';

/**
 * Resolves a modifier's user parameters if they are provided.
 */
const applyUserParameters = (
  modifier: Modifier<any>,
  value?: number,
): Modifier<any> => {
  if (value === undefined) return modifier;

  const resolvedStats: any = {};

  Object.entries(modifier.modifiedStats).forEach(([stat, values]) => {
    if (!Array.isArray(values)) return;

    resolvedStats[stat] = values.map((sv) => {
      if (isUserParameterizedNumber(sv.value)) {
        const configs = sv.value.parameterConfigs;
        const key = Object.keys(configs)[0];
        const resolvedValue = calculateParameterizedNumberValue(sv.value, {
          [key as any]: value,
        });
        return { ...sv, value: resolvedValue };
      }
      return sv;
    });
  });

  return { ...modifier, modifiedStats: resolvedStats };
};

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

/**
 * Bridge service to connect frontend store data to the rotation calculator.
 */
export const calculateRotation = async (
  clientTeam: ClientTeam,
  clientEnemy: ClientEnemy,
  attacks: Array<Attack>,
  buffs: Array<BuffWithPosition>,
): Promise<RotationResult> => {
  // 0. Validate input parameters
  attacks.forEach((attack) => {
    if (attack.parameters?.some((p) => p.value === undefined)) {
      throw new Error(
        `Attack "${attack.name}" (Character: ${attack.characterName ?? 'Unknown'}) has missing parameter values.`,
      );
    }
  });

  buffs.forEach(({ buff }) => {
    if (buff.parameters?.some((p) => p.value === undefined)) {
      throw new Error(
        `Buff "${buff.name}" (Character: ${buff.characterName ?? 'Unknown'}) has missing parameter values.`,
      );
    }
  });

  // 1. Fetch all necessary game data in parallel
  const characterDetails = await Promise.all(
    clientTeam.map((c) => (c.id ? getCharacterDetails({ data: c.id }) : null)),
  );

  const weaponDetails = await Promise.all(
    clientTeam.map((c) =>
      c.weapon.name ? getWeaponDetails({ data: c.weapon.name }) : null,
    ),
  );

  const primaryEchoDetails = await Promise.all(
    clientTeam.map((c) =>
      c.primarySlotEcho.name ? getEchoDetails({ data: c.primarySlotEcho.name }) : null,
    ),
  );

  // Helper to find a modifier definition across all data sources for a character
  const findModifierDefinition = (charIndex: number, buffName: string) => {
    const char = characterDetails[charIndex];
    const weapon = weaponDetails[charIndex];
    const echo = primaryEchoDetails[charIndex];

    const charMod = char?.modifiers.find((m) => m.name === buffName);
    if (charMod) return charMod;

    if (weapon) {
      const refine = String(clientTeam[charIndex].weapon.refine) as RefineLevel;
      const weaponMod = weapon.attributes[refine].modifiers.find(
        (m: any) => m.name === buffName,
      );
      if (weaponMod) return weaponMod;
    }

    const echoMod = echo?.modifiers.find((m) => m.description === buffName);
    if (echoMod) return echoMod;

    return null;
  };

  // 2. Map Client Team to Server Team
  const serverTeamResults = clientTeam.map((clientChar, charIndex) => {
    const charData = characterDetails[charIndex];
    if (!charData)
      throw new Error(`Missing details for Character at index ${charIndex}`);

    const stats = { ...charData.stats };

    clientChar.echoStats.forEach((echo) => {
      const [mainStatKey, mainStatTags] = ECHO_STAT_MAP[echo.mainStatType];
      if (!stats[mainStatKey]) {
        stats[mainStatKey] = [];
      }
      stats[mainStatKey].push({
        value: 0,
        tags: mainStatTags,
      });

      echo.substats.forEach((sub) => {
        const [subKey, subTags] = ECHO_STAT_MAP[sub.stat];
        if (!stats[subKey]) {
          stats[subKey] = [];
        }
        stats[subKey].push({
          value: sub.value / 100,
          tags: subTags,
        });
      });
    });

    return {
      name: clientChar.name,
      level: 90,
      stats: stats as CharacterStats,
    } as ServerCharacter;
  });

  const serverTeam: ServerTeam = [
    serverTeamResults[0],
    serverTeamResults[1],
    serverTeamResults[2],
  ];

  // 3. Map Client Enemy to Server Enemy
  const serverEnemy: ServerEnemy = {
    level: clientEnemy.level as Integer,
    // @ts-expect-error - Complex dynamic mapping of stats
    stats: {
      baseResistance: Object.entries(clientEnemy.resistances).map(([attr, val]) => ({
        value: val / 100,
        tags: [attr],
      })),
      defenseReduction: [],
      resistanceReduction: [],
      ...Object.fromEntries(
        Object.values(NegativeStatus).map((status) => [status, []]),
      ),
    } as EnemyStats,
  };

  // 4. Map Attacks and active Buffs to Damage Instances
  const damageInstances = attacks.map((attack, index) => {
    const charData = characterDetails.find((d) => d?.name === attack.characterName);
    if (!charData) {
      throw new Error(`Could not find character data for ${attack.characterName}`);
    }
    const serverInstance = charData.attacks.find((a) => a.name === attack.name);

    if (!serverInstance) {
      throw new Error(
        `Could not find attack ${attack.name} for character ${attack.characterName}`,
      );
    }

    // Resolve parameterized motion values if user provided a value
    const userAttackValue = attack.parameters?.[0]?.value;
    let motionValues = serverInstance.motionValues || [];

    if (userAttackValue !== undefined && serverInstance.parameterizedMotionValues) {
      motionValues = serverInstance.parameterizedMotionValues.map((pmv) => {
        const key = Object.keys(pmv.parameterConfigs)[0];
        return calculateParameterizedNumberValue(pmv, {
          [key as any]: userAttackValue,
        });
      });
    }

    const activeModifiers = buffs
      .filter((b) => index >= b.x && index < b.x + b.w)
      .map((b) => {
        const charIdx = clientTeam.findIndex((c) => c.name === b.buff.characterName);
        const definition = findModifierDefinition(charIdx, b.buff.name);

        if (!definition) return null;

        return applyUserParameters(definition, b.buff.parameters?.[0]?.value);
      })
      .filter((m): m is Modifier => m !== null);

    return {
      instance: {
        originCharacterName: attack.characterName,
        attribute: charData.attribute,
        scalingStat: serverInstance.scalingStat,
        motionValues,
        tags: serverInstance.tags,
      } as CharacterDamageInstance,
      modifiers: activeModifiers,
    };
  });

  const calculateRotationDamageProps = {
    team: serverTeam,
    enemy: serverEnemy,
    duration: attacks.length,
    damageInstances,
  };
  return calculateRotationDamage(calculateRotationDamageProps);
};

const mapClientCharacterToServer = async (
  character: ClientTeam[number],
): Promise<Team[number]> => {
  const [characterDetails, weaponDetails, echoDetails, ...echoSetDetails] =
    await Promise.all([
      getCharacterDetails({ data: character.id }),
      getWeaponDetails({ data: character.weapon.id }),
      getEchoDetails({ data: character.primarySlotEcho.id }),
      ...character.echoSets.map((echo) => getEchoSetDetails({ data: echo.id })),
    ]);
  const stats: CharacterStats = Object.fromEntries(
    Object.values(CharacterStat).map((key) => [key, []]),
  ) as CharacterStats;

  const characterStats = characterDetails.stats;

  // 🔥 Properly typed key iteration
  Object.keys(characterStats).forEach((key) => {
    stats[key] = [...stats[key], ...(characterStats[key] ?? [])];
  });
  clientChar.echoStats.forEach((echo) => {
    const [mainStatKey, mainStatTags] = ECHO_STAT_MAP[echo.mainStatType];
    if (!stats[mainStatKey]) {
      stats[mainStatKey] = [];
    }
    stats[mainStatKey].push({
      value: 0,
      tags: mainStatTags,
    });

    echo.substats.forEach((sub) => {
      const [subKey, subTags] = ECHO_STAT_MAP[sub.stat];
      if (!stats[subKey]) {
        stats[subKey] = [];
      }
      stats[subKey].push({
        value: sub.value / 100,
        tags: subTags,
      });
    });
  });

  return {
    name: clientChar.name,
    level: 90,
    stats: stats,
  } as ServerCharacter;
};

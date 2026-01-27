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
  values?: Array<number>,
): Modifier<any> => {
  if (!values || values.length === 0) return modifier;

  const resolvedStats: any = {};

  Object.entries(modifier.modifiedStats).forEach(([stat, statValues]) => {
    if (!Array.isArray(statValues)) return;

    resolvedStats[stat] = statValues.map((sv) => {
      if (isUserParameterizedNumber(sv.value)) {
        const configs = sv.value.parameterConfigs;
        const key = Object.keys(configs)[0];
        const resolvedValue = calculateParameterizedNumberValue(sv.value, {
          [key as any]: values[0],
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
  // 1. Fetch all necessary game data in parallel
  const characterDetails = await Promise.all(
    clientTeam.map((c) => (c.id ? getCharacterDetails({ data: c.id }) : null)),
  );

  const weaponDetails = await Promise.all(
    clientTeam.map((c) =>
      c.weapon.id ? getWeaponDetails({ data: c.weapon.id }) : null,
    ),
  );

  const primaryEchoDetails = await Promise.all(
    clientTeam.map((c) =>
      c.primarySlotEcho.id ? getEchoDetails({ data: c.primarySlotEcho.id }) : null,
    ),
  );

  // Helper to find a modifier definition across all data sources for a character
  const findModifierDefinition = (charIndex: number, modifierId: string) => {
    const char = characterDetails[charIndex];
    const weapon = weaponDetails[charIndex];
    const echo = primaryEchoDetails[charIndex];

    const charMod = char?.capabilities.modifiers.find((m) => m.id === modifierId);
    if (charMod) return charMod;

    if (weapon) {
      const refine = String(clientTeam[charIndex].weapon.refine) as RefineLevel;
      const weaponMod = weapon.attributes[refine].modifiers.find(
        (m: any) => m.id === modifierId,
      );
      if (weaponMod) return weaponMod;
    }

    const echoMod = echo?.capabilities.modifiers.find((m) => m.id === modifierId);
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
      const mainStatOption = ECHO_STAT_MAP[echo.mainStatType];
      if (mainStatOption) {
        const [mainStatKey, mainStatTags] = mainStatOption;
        if (!stats[mainStatKey]) {
          stats[mainStatKey] = [];
        }
        stats[mainStatKey].push({
          value: 0,
          tags: mainStatTags,
        });
      }

      echo.substats.forEach((sub) => {
        const subOption = ECHO_STAT_MAP[sub.stat];
        if (subOption) {
          const [subKey, subTags] = subOption;
          if (!stats[subKey]) {
            stats[subKey] = [];
          }
          stats[subKey].push({
            value: sub.value / 100,
            tags: subTags,
          });
        }
      });
    });

    return {
      id: clientChar.id,
      name: charData.name,
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
    const charIndex = clientTeam.findIndex((c) => c.id === attack.characterId);
    const charData = characterDetails[charIndex];
    const weaponData = weaponDetails[charIndex];
    const echoData = primaryEchoDetails[charIndex];

    if (!charData) {
      throw new Error(`Could not find character data for ${attack.characterId}`);
    }

    // Find attack definition in character, weapon, or echo
    let serverInstance = charData.capabilities.attacks.find((a) => a.id === attack.id);
    if (!serverInstance && weaponData) {
      const refine = String(clientTeam[charIndex].weapon.refine) as RefineLevel;
      if (weaponData.attributes[refine].attack?.id === attack.id) {
        serverInstance = weaponData.attributes[refine].attack;
      }
    }
    if (!serverInstance && echoData) {
      if (echoData.capabilities.attacks?.[0]?.id === attack.id) {
        serverInstance = echoData.capabilities.attacks[0];
      }
    }

    if (!serverInstance) {
      throw new Error(
        `Could not find attack ${attack.id} for character ${attack.characterId}`,
      );
    }

    // Resolve parameterized motion values if user provided values
    let motionValues = serverInstance.motionValues || [];
    if (
      attack.parameterValues &&
      attack.parameterValues.length > 0 &&
      serverInstance.parameterizedMotionValues
    ) {
      motionValues = serverInstance.parameterizedMotionValues.map((pmv) => {
        const key = Object.keys(pmv.parameterConfigs)[0];
        return calculateParameterizedNumberValue(pmv, {
          [key as any]: attack.parameterValues[0], // assume first value for now
        });
      });
    }

    const activeModifiers = buffs
      .filter((b) => index >= b.x && index < b.x + b.w)
      .map((b) => {
        const bCharIdx = clientTeam.findIndex((c) => c.id === b.characterId);
        const definition = findModifierDefinition(bCharIdx, b.id);

        if (!definition) return null;

        return applyUserParameters(definition, b.parameterValues);
      })
      .filter((m): m is Modifier => m !== null);

    return {
      instance: {
        originCharacterName: charData.name,
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

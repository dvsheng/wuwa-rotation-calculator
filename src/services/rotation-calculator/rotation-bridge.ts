import type { Enemy as ClientEnemy } from '@/schemas/enemy';
import type { Attack, BuffWithPosition } from '@/schemas/rotation';
import type { Team as ClientTeam } from '@/schemas/team';
import { getCharacterDetails } from '@/services/game-data/character/get-character-details';
import { getEchoDetails } from '@/services/game-data/echo/get-echo-details';
import { getWeaponDetails } from '@/services/game-data/weapon/get-weapon-details';
import { NegativeStatus } from '@/types';
import type { Integer } from '@/types';
import { Tag } from '@/types/server';
import type {
  CharacterDamageInstance,
  CharacterStat,
  CharacterStats,
  EnemyStats,
  Modifier,
  Character as ServerCharacter,
  Enemy as ServerEnemy,
  Team as ServerTeam,
} from '@/types/server';
import { CharacterStat as CharacterStatEnum } from '@/types/server/character';

import type { RefineLevel } from '../game-data/weapon/types';

import { calculateRotationDamage } from './calculate-rotation-damage';
import type { RotationResult } from './types';

/**
 * Maps client-side echo stat types to server-side CharacterStat enums.
 */
const ECHO_STAT_MAP: Record<string, string | undefined> = {
  hp_percent: CharacterStatEnum.HP_SCALING_BONUS,
  atk_percent: CharacterStatEnum.ATTACK_SCALING_BONUS,
  def_percent: CharacterStatEnum.DEFENSE_SCALING_BONUS,
  hp_flat: CharacterStatEnum.HP_FLAT_BONUS,
  atk_flat: CharacterStatEnum.ATTACK_FLAT_BONUS,
  def_flat: CharacterStatEnum.DEFENSE_FLAT_BONUS,
  energy_regen: CharacterStatEnum.ENERGY_REGEN,
  crit_rate: CharacterStatEnum.CRITICAL_RATE,
  crit_dmg: CharacterStatEnum.CRITICAL_DAMAGE,
  damage_bonus_basic_attack: CharacterStatEnum.DAMAGE_BONUS,
  damage_bonus_heavy_attack: CharacterStatEnum.DAMAGE_BONUS,
  damage_bonus_resonance_skill: CharacterStatEnum.DAMAGE_BONUS,
  damage_bonus_resonance_liberation: CharacterStatEnum.DAMAGE_BONUS,
  damage_bonus_glacio: CharacterStatEnum.DAMAGE_BONUS,
  damage_bonus_fusion: CharacterStatEnum.DAMAGE_BONUS,
  damage_bonus_electro: CharacterStatEnum.DAMAGE_BONUS,
  damage_bonus_aero: CharacterStatEnum.DAMAGE_BONUS,
  damage_bonus_spectro: CharacterStatEnum.DAMAGE_BONUS,
  damage_bonus_havoc: CharacterStatEnum.DAMAGE_BONUS,
  healing_bonus: CharacterStatEnum.HEALING_BONUS,
};

/**
 * Maps client main stat types to their corresponding Tags.
 */
const STAT_TYPE_TO_TAG: Record<string, string | undefined> = {
  damage_bonus_glacio: 'glacio',
  damage_bonus_fusion: 'fusion',
  damage_bonus_electro: 'electro',
  damage_bonus_aero: 'aero',
  damage_bonus_spectro: 'spectro',
  damage_bonus_havoc: 'havoc',
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
    // TODO: Fix This
    const echoMod = echo?.modifiers.find((m) => m.description === buffName);
    if (echoMod) return echoMod;

    return null;
  };

  // 2. Map Client Team to Server Team
  const serverTeamResults = await Promise.all(
    clientTeam.map((clientChar, charIndex) => {
      const charData = characterDetails[charIndex];
      if (!charData) {
        return {
          name: 'Unknown',
          level: 90,
          stats: {} as CharacterStats,
        } as ServerCharacter;
      }

      const stats = { ...charData.stats } as unknown as Partial<CharacterStats>;

      clientChar.echoStats.forEach((echo) => {
        const mainStatKey = ECHO_STAT_MAP[echo.mainStatType] as CharacterStat;
        if (!stats[mainStatKey]) {
          stats[mainStatKey] = [];
        }
        stats[mainStatKey].push({
          value: 0,
          tags: [STAT_TYPE_TO_TAG[echo.mainStatType] ?? Tag.ALL],
        });

        echo.substats.forEach((sub) => {
          const subKey = ECHO_STAT_MAP[sub.stat] as CharacterStat;
          if (!stats[subKey]) {
            stats[subKey] = [];
          }
          stats[subKey].push({
            value: sub.value / 100,
            tags: [Tag.ALL],
          });
        });
      });

      return {
        name: clientChar.name,
        level: 90,
        stats: stats as CharacterStats,
      } as ServerCharacter;
    }),
  );

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

    const activeModifiers = buffs
      .filter((b) => index >= b.x && index < b.x + b.w)
      .map((b) => {
        const charIdx = clientTeam.findIndex((c) => c.name === b.buff.characterName);
        const definition = findModifierDefinition(charIdx, b.buff.name);

        if (!definition) return null;

        return {
          target: definition.target,
          modifiedStats: definition.modifiedStats,
        } as Modifier;
      })
      .filter((m): m is Modifier => m !== null);

    return {
      instance: {
        originCharacterName: attack.characterName,
        attribute: charData.attribute,
        scalingStat: serverInstance.scalingStat,
        motionValues: serverInstance.motionValues || [],
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

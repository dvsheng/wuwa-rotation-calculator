import { EchoMainStatOption } from '@/schemas/echo';
import type { EchoCost, EchoMainStatOptionType } from '@/schemas/echo';
import { CharacterStat, Tag } from '@/types';

import type { PermanentStatBase } from './types';

const ECHO_SECONDARY_STAT_BY_COST: Record<EchoCost, PermanentStatBase> = {
  1: { stat: CharacterStat.HP_FLAT_BONUS, value: 2280, tags: [Tag.ALL] },
  3: { stat: CharacterStat.ATTACK_FLAT_BONUS, value: 100, tags: [Tag.ALL] },
  4: { stat: CharacterStat.ATTACK_FLAT_BONUS, value: 150, tags: [Tag.ALL] },
};

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
      value: 0.44,
      tags: [Tag.ALL],
    },
    [EchoMainStatOption.CRIT_RATE]: {
      stat: CharacterStat.CRITICAL_RATE,
      value: 0.22,
      tags: [Tag.ALL],
    },
    [EchoMainStatOption.HEALING_BONUS]: {
      stat: CharacterStat.HEALING_BONUS,
      value: 0.26,
      tags: [Tag.ALL],
    },
  },
};

/**
 * Get echo stats for the given cost and main stat option.
 * Returns an object containing both the primary and secondary stats.
 */
export const getEchoStats = (
  cost: EchoCost,
  mainStatOption: EchoMainStatOptionType,
): {
  primary: PermanentStatBase | undefined;
  secondary: PermanentStatBase;
} => {
  return {
    primary: ECHO_PRIMARY_STAT_BY_COST_BY_STAT[cost][mainStatOption],
    secondary: ECHO_SECONDARY_STAT_BY_COST[cost],
  };
};

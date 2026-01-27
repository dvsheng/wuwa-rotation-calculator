import { z } from 'zod';

export const ECHO_PIECE_COUNT = 5;

export const EchoSubstatOption = {
  HP_PERCENT: 'hp_percent',
  ATK_PERCENT: 'atk_percent',
  DEF_PERCENT: 'def_percent',
  HP_FLAT: 'hp_flat',
  ATK_FLAT: 'atk_flat',
  DEF_FLAT: 'def_flat',
  ENERGY_REGEN: 'energy_regen',
  CRIT_RATE: 'crit_rate',
  CRIT_DMG: 'crit_dmg',
  DAMAGE_BONUS_BASIC_ATTACK: 'damage_bonus_basic_attack',
  DAMAGE_BONUS_HEAVY_ATTACK: 'damage_bonus_heavy_attack',
  DAMAGE_BONUS_RESONANCE_SKILL: 'damage_bonus_resonance_skill',
  DAMAGE_BONUS_RESONANCE_LIBERATION: 'damage_bonus_resonance_liberation',
} as const;

export const EchoSubstatOptionSchema = z.enum(EchoSubstatOption);
export type EchoSubstatOptionType = z.infer<typeof EchoSubstatOptionSchema>;

export const ECHO_SUBSTAT_VALUES: Record<EchoSubstatOptionType, Array<number>> = {
  [EchoSubstatOption.ATK_FLAT]: [30, 40, 50, 60],
  [EchoSubstatOption.DEF_FLAT]: [40, 50, 60, 70],
  [EchoSubstatOption.HP_FLAT]: [320, 360, 390, 430, 470, 510, 540, 580],
  [EchoSubstatOption.DEF_PERCENT]: [8.1, 9.0, 10.0, 10.9, 11.8, 12.8, 13.8, 14.7],
  [EchoSubstatOption.ATK_PERCENT]: [6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6],
  [EchoSubstatOption.HP_PERCENT]: [6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6],
  [EchoSubstatOption.DAMAGE_BONUS_RESONANCE_LIBERATION]: [
    6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6,
  ],
  [EchoSubstatOption.DAMAGE_BONUS_HEAVY_ATTACK]: [
    6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6,
  ],
  [EchoSubstatOption.DAMAGE_BONUS_RESONANCE_SKILL]: [
    6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6,
  ],
  [EchoSubstatOption.DAMAGE_BONUS_BASIC_ATTACK]: [
    6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6,
  ],
  [EchoSubstatOption.ENERGY_REGEN]: [6.8, 7.6, 8.4, 9.2, 10.0, 10.8, 11.6, 12.4],
  [EchoSubstatOption.CRIT_RATE]: [6.3, 6.9, 7.5, 8.1, 8.7, 9.3, 9.9, 10.5],
  [EchoSubstatOption.CRIT_DMG]: [12.6, 13.8, 15.0, 16.2, 17.4, 18.6, 19.8, 21.0],
} as const;

export const EchoMainStatOption = {
  HP_PERCENT: 'hp_percent',
  ATK_PERCENT: 'atk_percent',
  DEF_PERCENT: 'def_percent',
  CRIT_RATE: 'crit_rate',
  CRIT_DMG: 'crit_dmg',
  HEALING_BONUS: 'healing_bonus',
  ENERGY_REGEN: 'energy_regen',
  DAMAGE_BONUS_GLACIO: 'damage_bonus_glacio',
  DAMAGE_BONUS_FUSION: 'damage_bonus_fusion',
  DAMAGE_BONUS_ELECTRO: 'damage_bonus_electro',
  DAMAGE_BONUS_AERO: 'damage_bonus_aero',
  DAMAGE_BONUS_SPECTRO: 'damage_bonus_spectro',
  DAMAGE_BONUS_HAVOC: 'damage_bonus_havoc',
} as const;

export const EchoMainStatOptionSchema = z.enum(EchoMainStatOption);

export type EchoMainStatOptionType = z.infer<typeof EchoMainStatOptionSchema>;

export const EchoCost = {
  ONE: 1,
  THREE: 3,
  FOUR: 4,
} as const;

export const EchoCostSchema = z.enum(EchoCost);

export type EchoCost = z.infer<typeof EchoCostSchema>;

export const VALID_MAIN_STATS: Record<EchoCost, Array<EchoMainStatOptionType>> = {
  [EchoCost.ONE]: [
    EchoMainStatOption.HP_PERCENT,
    EchoMainStatOption.ATK_PERCENT,
    EchoMainStatOption.DEF_PERCENT,
  ],
  [EchoCost.THREE]: [
    EchoMainStatOption.HP_PERCENT,
    EchoMainStatOption.ATK_PERCENT,
    EchoMainStatOption.DEF_PERCENT,
    EchoMainStatOption.DAMAGE_BONUS_AERO,
    EchoMainStatOption.DAMAGE_BONUS_GLACIO,
    EchoMainStatOption.DAMAGE_BONUS_ELECTRO,
    EchoMainStatOption.DAMAGE_BONUS_HAVOC,
    EchoMainStatOption.DAMAGE_BONUS_SPECTRO,
    EchoMainStatOption.DAMAGE_BONUS_FUSION,
    EchoMainStatOption.ENERGY_REGEN,
  ],
  [EchoCost.FOUR]: [
    EchoMainStatOption.HP_PERCENT,
    EchoMainStatOption.ATK_PERCENT,
    EchoMainStatOption.DEF_PERCENT,
    EchoMainStatOption.CRIT_DMG,
    EchoMainStatOption.CRIT_RATE,
    EchoMainStatOption.HEALING_BONUS,
  ],
} as const;

export const EchoSubstatSchema = z
  .object({
    stat: EchoSubstatOptionSchema,
    value: z.number(),
  })
  .superRefine((data, ctx) => {
    const validValues = ECHO_SUBSTAT_VALUES[data.stat];
    if (!validValues.includes(data.value)) {
      ctx.addIssue({
        code: 'custom',
        message: `Invalid value for ${data.stat}. Expected one of: ${validValues.join(', ')}`,
        path: ['value'],
      });
    }
  });

export type EchoSubstat = z.infer<typeof EchoSubstatSchema>;

export const EchoPieceSchema = z
  .object({
    cost: EchoCostSchema,
    mainStatType: EchoMainStatOptionSchema,
    substats: z.array(EchoSubstatSchema).length(5),
  })
  .superRefine((data, ctx) => {
    const validMainStats = VALID_MAIN_STATS[data.cost];
    if (!validMainStats.includes(data.mainStatType)) {
      ctx.addIssue({
        code: 'custom',
        message: `Invalid main stat ${data.mainStatType} for cost ${data.cost}. Expected one of: ${validMainStats.join(', ')}`,
        path: ['mainStatType'],
      });
    }
  });

export type EchoPiece = z.infer<typeof EchoPieceSchema>;

export const EchoStatsSchema = z.array(EchoPieceSchema).length(ECHO_PIECE_COUNT);

export type EchoStats = z.infer<typeof EchoStatsSchema>;

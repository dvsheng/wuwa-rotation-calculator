import { describe, expect, it } from 'vitest';

import {
  ECHO_SUBSTAT_VALUES,
  EchoMainStatOption,
  EchoSubstatOption,
} from '@/schemas/echo';
import { CharacterStat } from '@/types';

import { buildEchoPieces } from './build-echo-pieces';

const makeEntity = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 1,
    name: 'Test Character',
    derivedAttributes: {
      preferredScalingStat: 'atk',
      dominantAttribute: 'fusion',
      preferredThreeCostScalingMainStat: EchoMainStatOption.ATK_PERCENT,
      preferredThreeCostAttributeMainStat: EchoMainStatOption.DAMAGE_BONUS_FUSION,
    },
    capabilities: [],
    runtimeStatTargets: [],
    ...overrides,
  }) as any;

const makeAttack = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 1,
    name: 'Attack',
    originType: 'Normal Attack',
    skillId: 1,
    entityId: 1,
    capabilityJson: {
      type: 'attack',
      damageInstances: [],
    },
    ...overrides,
  }) as any;

describe('buildEchoPieces', () => {
  it('uses ER 3-cost mains for Shorekeeper-style 250% ER runtime scaling', () => {
    const response = buildEchoPieces(
      makeEntity({
        capabilities: [
          makeAttack({
            capabilityJson: {
              type: 'attack',
              damageInstances: [
                {
                  attribute: 'spectro',
                  damageType: 'basicAttack',
                  motionValue: 2,
                  scalingStat: 'atk',
                  tags: [],
                },
                {
                  attribute: 'spectro',
                  damageType: 'resonanceLiberation',
                  motionValue: 0.6,
                  scalingStat: 'hp',
                  tags: [],
                },
                {
                  attribute: 'spectro',
                  damageType: 'resonanceLiberation',
                  motionValue: 0.6,
                  scalingStat: 'hp',
                  tags: [],
                },
              ],
            },
          }),
        ],
        runtimeStatTargets: [
          {
            requiredTotal: 2.5,
            stat: CharacterStat.ENERGY_REGEN,
          },
        ],
        derivedAttributes: {
          preferredScalingStat: 'hp',
          dominantAttribute: 'spectro',
          preferredThreeCostScalingMainStat: EchoMainStatOption.HP_PERCENT,
          preferredThreeCostAttributeMainStat: EchoMainStatOption.DAMAGE_BONUS_SPECTRO,
        },
      }),
    );

    expect(response.map((echo) => echo.cost)).toEqual([4, 3, 3, 1, 1]);
    expect(response[0].mainStatType).toBe(EchoMainStatOption.CRIT_RATE);
    expect(response[1].mainStatType).toBe(EchoMainStatOption.ENERGY_REGEN);
    expect(response[2].mainStatType).toBe(EchoMainStatOption.ENERGY_REGEN);
    expect(response[3].mainStatType).toBe(EchoMainStatOption.HP_PERCENT);
    expect(response[4].mainStatType).toBe(EchoMainStatOption.HP_PERCENT);
    expect(response[1].substats.map((substat) => substat.stat)).toEqual([
      EchoSubstatOption.CRIT_RATE,
      EchoSubstatOption.CRIT_DMG,
      EchoSubstatOption.HP_PERCENT,
      EchoSubstatOption.ENERGY_REGEN,
      EchoSubstatOption.DAMAGE_BONUS_RESONANCE_LIBERATION,
    ]);
    expect(response[0].substats.map((substat) => substat.stat)).toEqual([
      EchoSubstatOption.CRIT_RATE,
      EchoSubstatOption.CRIT_DMG,
      EchoSubstatOption.HP_PERCENT,
      EchoSubstatOption.ENERGY_REGEN,
      EchoSubstatOption.DAMAGE_BONUS_RESONANCE_LIBERATION,
    ]);
    for (const echo of response) {
      expect(new Set(echo.substats.map((substat) => substat.stat)).size).toBe(5);
    }
  });

  it('uses the approximated substat roll value index', () => {
    const response = buildEchoPieces(
      makeEntity({
        capabilities: [
          makeAttack({
            capabilityJson: {
              type: 'attack',
              damageInstances: [
                {
                  attribute: 'fusion',
                  damageType: 'resonanceSkill',
                  motionValue: 1,
                  scalingStat: 'atk',
                  tags: [],
                },
              ],
            },
          }),
        ],
      }),
    );

    expect(response[0].substats).toEqual([
      {
        stat: EchoSubstatOption.CRIT_RATE,
        value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.CRIT_RATE][2],
      },
      {
        stat: EchoSubstatOption.CRIT_DMG,
        value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.CRIT_DMG][2],
      },
      {
        stat: EchoSubstatOption.ATK_PERCENT,
        value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.ATK_PERCENT][2],
      },
      {
        stat: EchoSubstatOption.DAMAGE_BONUS_RESONANCE_SKILL,
        value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.DAMAGE_BONUS_RESONANCE_SKILL][2],
      },
      {
        stat: EchoSubstatOption.ATK_FLAT,
        value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.ATK_FLAT][2],
      },
    ]);
  });

  it('uses ER 3-cost mains for Mornye-style 260% ER runtime scaling', () => {
    const response = buildEchoPieces(
      makeEntity({
        capabilities: [
          makeAttack({
            capabilityJson: {
              type: 'attack',
              damageInstances: [
                {
                  attribute: 'fusion',
                  damageType: 'resonanceSkill',
                  motionValue: 1.5,
                  scalingStat: 'atk',
                  tags: [],
                },
              ],
            },
          }),
        ],
        runtimeStatTargets: [
          {
            requiredTotal: 2.6,
            stat: CharacterStat.ENERGY_REGEN,
          },
        ],
      }),
    );

    expect(response[1].mainStatType).toBe(EchoMainStatOption.ENERGY_REGEN);
    expect(response[2].mainStatType).toBe(EchoMainStatOption.ENERGY_REGEN);
    expect(response[3].mainStatType).toBe(EchoMainStatOption.ATK_PERCENT);
    expect(response[1].substats.map((substat) => substat.stat)).toEqual([
      EchoSubstatOption.CRIT_RATE,
      EchoSubstatOption.CRIT_DMG,
      EchoSubstatOption.ATK_PERCENT,
      EchoSubstatOption.ENERGY_REGEN,
      EchoSubstatOption.DAMAGE_BONUS_RESONANCE_SKILL,
    ]);
    expect(response[0].substats.map((substat) => substat.stat)).toEqual([
      EchoSubstatOption.CRIT_RATE,
      EchoSubstatOption.CRIT_DMG,
      EchoSubstatOption.ATK_PERCENT,
      EchoSubstatOption.ENERGY_REGEN,
      EchoSubstatOption.DAMAGE_BONUS_RESONANCE_SKILL,
    ]);
    for (const echo of response) {
      expect(new Set(echo.substats.map((substat) => substat.stat)).size).toBe(5);
    }
  });

  it('keeps elemental 3-cost mains when the runtime scaling target is only 150%', () => {
    const response = buildEchoPieces(
      makeEntity({
        capabilities: [
          makeAttack({
            capabilityJson: {
              type: 'attack',
              damageInstances: [
                {
                  attribute: 'aero',
                  damageType: 'resonanceSkill',
                  motionValue: 2,
                  scalingStat: 'atk',
                  tags: [],
                },
              ],
            },
          }),
        ],
        runtimeStatTargets: [
          {
            requiredTotal: 1.5,
            stat: CharacterStat.ENERGY_REGEN,
          },
        ],
        derivedAttributes: {
          preferredScalingStat: 'atk',
          dominantAttribute: 'aero',
          preferredThreeCostScalingMainStat: EchoMainStatOption.ATK_PERCENT,
          preferredThreeCostAttributeMainStat: EchoMainStatOption.DAMAGE_BONUS_AERO,
        },
      }),
    );

    expect(response[1].mainStatType).toBe(EchoMainStatOption.DAMAGE_BONUS_AERO);
    expect(response[2].mainStatType).toBe(EchoMainStatOption.DAMAGE_BONUS_AERO);
    expect(response[1].substats.map((substat) => substat.stat)).toEqual([
      EchoSubstatOption.CRIT_RATE,
      EchoSubstatOption.CRIT_DMG,
      EchoSubstatOption.ATK_PERCENT,
      EchoSubstatOption.ENERGY_REGEN,
      EchoSubstatOption.DAMAGE_BONUS_RESONANCE_SKILL,
    ]);
    expect(response[0].substats.map((substat) => substat.stat)).toEqual([
      EchoSubstatOption.CRIT_RATE,
      EchoSubstatOption.CRIT_DMG,
      EchoSubstatOption.ATK_PERCENT,
      EchoSubstatOption.ENERGY_REGEN,
      EchoSubstatOption.DAMAGE_BONUS_RESONANCE_SKILL,
    ]);
    for (const echo of response) {
      expect(new Set(echo.substats.map((substat) => substat.stat)).size).toBe(5);
    }
  });

  it('heavily favors damage types that do not match the parent origin type', () => {
    const response = buildEchoPieces(
      makeEntity({
        capabilities: [
          makeAttack({
            originType: 'Normal Attack',
            capabilityJson: {
              type: 'attack',
              damageInstances: [
                {
                  attribute: 'fusion',
                  damageType: 'basicAttack',
                  motionValue: 1,
                  scalingStat: 'atk',
                  tags: [],
                },
                {
                  attribute: 'fusion',
                  damageType: 'basicAttack',
                  motionValue: 1,
                  scalingStat: 'atk',
                  tags: [],
                },
                {
                  attribute: 'fusion',
                  damageType: 'resonanceSkill',
                  motionValue: 1,
                  scalingStat: 'atk',
                  tags: [],
                },
              ],
            },
          }),
        ],
      }),
    );

    expect(response[1].substats.map((substat) => substat.stat)).toEqual([
      EchoSubstatOption.CRIT_RATE,
      EchoSubstatOption.CRIT_DMG,
      EchoSubstatOption.ATK_PERCENT,
      EchoSubstatOption.DAMAGE_BONUS_RESONANCE_SKILL,
      EchoSubstatOption.ATK_FLAT,
    ]);
  });

  it('fills non-specialized pieces from the end of the ranked substat list', () => {
    const response = buildEchoPieces(
      makeEntity({
        capabilities: [
          makeAttack({
            capabilityJson: {
              type: 'attack',
              damageInstances: [
                {
                  attribute: 'fusion',
                  damageType: 'resonanceSkill',
                  motionValue: 1,
                  scalingStat: 'atk',
                  tags: [],
                },
              ],
            },
          }),
        ],
        runtimeStatTargets: [
          {
            requiredTotal: 2,
            stat: CharacterStat.HP_SCALING_BONUS,
          },
          {
            requiredTotal: 2,
            stat: CharacterStat.DEFENSE_SCALING_BONUS,
          },
        ],
      }),
    );

    expect(response[0].substats.map((substat) => substat.stat)).toEqual([
      EchoSubstatOption.CRIT_RATE,
      EchoSubstatOption.CRIT_DMG,
      EchoSubstatOption.ATK_PERCENT,
      EchoSubstatOption.HP_PERCENT,
      EchoSubstatOption.DEF_PERCENT,
    ]);
  });
});

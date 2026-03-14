import { describe, expect, it } from 'vitest';

import type { RotationResultMergedDamageDetail } from '@/hooks/useRotationCalculation';
import { OriginType } from '@/services/game-data';
import {
  AttackScalingProperty,
  Attribute,
  CharacterStat,
  DamageType,
  EnemyStat,
} from '@/types';

import {
  buildRotationResultCsv,
  buildRotationResultExportRows,
} from './rotation-result-export.utilities';

const createMergedDamageDetail = ({
  attackIndex,
  damage,
  damageType,
  attribute,
}: {
  attackIndex: number;
  damage: number;
  damageType: string;
  attribute: string;
}): RotationResultMergedDamageDetail =>
  ({
    detail: {
      attackIndex,
      characterIndex: 0,
      scalingStat: AttackScalingProperty.ATK,
      motionValue: 0.196,
      damage,
      baseDamage: 6559.26,
      character: {
        attackScalingPropertyValue: 33_397.84,
        [CharacterStat.ATTACK_FLAT]: 21_273,
        [CharacterStat.ATTACK_SCALING_BONUS]: 0.57,
        [CharacterStat.ATTACK_FLAT_BONUS]: 350,
        [CharacterStat.CRITICAL_RATE]: 1,
        [CharacterStat.CRITICAL_DAMAGE]: 1.31,
        [CharacterStat.DAMAGE_BONUS]: 0.3,
        [CharacterStat.DAMAGE_AMPLIFICATION]: 0.15,
        [CharacterStat.DAMAGE_MULTIPLIER_BONUS]: 0.12,
        [CharacterStat.TUNE_STRAIN_DAMAGE_BONUS]: 0.08,
        [CharacterStat.FINAL_DAMAGE_BONUS]: 0.05,
        [CharacterStat.DEFENSE_IGNORE]: 0.1,
        [CharacterStat.RESISTANCE_PENETRATION]: 0.2,
        [CharacterStat.TUNE_BREAK_BOOST]: 44,
      },
      enemy: {
        [EnemyStat.DEFENSE_REDUCTION]: 0.08,
        [EnemyStat.BASE_RESISTANCE]: 0.2,
        [EnemyStat.RESISTANCE_REDUCTION]: 0.1,
      },
      teamDetails: [],
      enemyDetails: {},
    },
    attack: {
      id: 101,
      name: 'Sequence, Finale',
      parentName: 'Sigrika S0R1',
      originType: OriginType.FORTE_CIRCUIT,
      capabilityType: 'attack',
      characterName: 'Sigrika',
      damageInstances: [
        {
          damageType,
          attribute,
        },
        {
          damageType: DamageType.BASIC_ATTACK,
          attribute: Attribute.PHYSICAL,
        },
      ],
    },
  }) as unknown as RotationResultMergedDamageDetail;

describe('rotation result export utilities', () => {
  it('flattens each damage instance into an export row with metadata and top-level stats', () => {
    const mergedDamageDetails = [
      createMergedDamageDetail({
        attackIndex: 0,
        damage: 8851.34,
        damageType: DamageType.RESONANCE_SKILL,
        attribute: Attribute.GLACIO,
      }),
      createMergedDamageDetail({
        attackIndex: 0,
        damage: 1725.18,
        damageType: DamageType.BASIC_ATTACK,
        attribute: Attribute.PHYSICAL,
      }),
    ];

    const rows = buildRotationResultExportRows(mergedDamageDetails);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      attack_number: 1,
      hit_number: 1,
      character_name: 'Sigrika',
      capability_id: 101,
      parent_name: 'Sigrika S0R1',
      attack_name: 'Sequence, Finale',
      origin_type: OriginType.FORTE_CIRCUIT,
      attribute: Attribute.GLACIO,
      damage_type: DamageType.RESONANCE_SKILL,
      scaling_stat: AttackScalingProperty.ATK,
      motion_value_percent: 19.6,
      attack_scaling_property_value: 33_397.8,
      base_damage: 6559.3,
      damage: 8851.3,
      base_atk: 21_273,
      atk_percent: 57,
      atk_flat_bonus: 350,
      crit_rate_percent: 100,
      crit_dmg_percent: 131,
      damage_bonus_percent: 30,
      amplification_percent: 15,
      multiplier_bonus_percent: 12,
      tune_strain_bonus_percent: 8,
      final_damage_bonus_percent: 5,
      defense_ignore_percent: 10,
      resistance_pen_percent: 20,
      tune_break_boost: 44,
      enemy_defense_reduction_percent: 8,
      enemy_base_resistance_percent: 20,
      enemy_resistance_reduction_percent: 10,
    });
    expect(rows[0]?.base_hp).toBeUndefined();
    expect(rows[1]).toMatchObject({
      attack_number: 1,
      hit_number: 2,
      attribute: Attribute.PHYSICAL,
      damage_type: DamageType.BASIC_ATTACK,
      damage: 1725.2,
    });
  });

  it('builds CSV output with the expected headers and escaped values', () => {
    const csv = buildRotationResultCsv([
      createMergedDamageDetail({
        attackIndex: 0,
        damage: 8851.34,
        damageType: DamageType.RESONANCE_SKILL,
        attribute: Attribute.GLACIO,
      }),
    ]);

    const [headerRow, dataRow] = csv.split('\n');

    expect(headerRow).toContain('Attack #');
    expect(headerRow).toContain('Motion Value %');
    expect(headerRow).toContain('Base Resistance');
    expect(dataRow).toContain('"Sequence, Finale"');
    expect(dataRow).toContain('19.6');
    expect(dataRow).toContain('20');
  });
});

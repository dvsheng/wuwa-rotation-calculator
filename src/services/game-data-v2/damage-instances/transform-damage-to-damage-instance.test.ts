import { describe, expect, it } from 'vitest';

import { AttackScalingProperty, Attribute, DamageType, Tag } from '@/types';

import type { Damage } from '../repostiory';

import { tryTransformToDamageInstance } from './transform-damage-to-damage-instance';

const baseDamage = {
  id: 123_456_789,
  condition: '',
  constVariables: [],
  calculateType: 0,
  element: 2,
  damageTextType: 0,
  damageTextAreaId: 0,
  payloadId: 0,
  type: 4,
  subType: [0, 1005, 9999, 1201],
  smashType: 0,
  cureBaseValue: [],
  relatedProperty: 7,
  rateLv: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  hardnessLv: [],
  toughLv: [],
  energy: [5],
  specialEnergy1: [],
  specialEnergy2: [],
  specialEnergy3: [],
  specialEnergy4: [],
  specialEnergy5: [],
  formulaType: 0,
  formulaParam1: [],
  formulaParam2: [],
  formulaParam3: [],
  formulaParam4: [],
  formulaParam5: [0],
  formulaParam6: [],
  formulaParam7: [],
  formulaParam8: [],
  formulaParam9: [],
  formulaParam10: [],
  fluctuationLower: [],
  fluctuationUpper: [],
  elementPowerType: 0,
  elementPower: [3],
  weaknessLvl: [2],
  weaknessRatio: [],
  specialWeaknessDamageRatio: 0,
  immuneType: 0,
  percent0: [],
  percent1: [],
} satisfies Damage;

describe('tryTransformToDamageInstance', () => {
  it('extracts recognized subtype tags and drops unknown subtype ids', () => {
    const damageInstance = tryTransformToDamageInstance(baseDamage);

    expect(damageInstance).toBeDefined();
    expect(damageInstance).toMatchObject({
      id: baseDamage.id,
      motionValue: 100,
      attribute: Attribute.FUSION,
      type: DamageType.RESONANCE_SKILL,
      scalingAttribute: AttackScalingProperty.ATK,
      subtypes: [Tag.COORDINATED_ATTACK, Tag.SPECTRO_FRAZZLE, Tag.TUNE_RUPTURE],
      offTuneBuildup: 2,
      energy: 5,
      concertoRegen: 3,
    });
  });
});

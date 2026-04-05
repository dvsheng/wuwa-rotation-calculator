import { describe, expect, it, vi } from 'vitest';

import type { Buff as RepositoryBuff } from '../repostiory';

import { getBuffStat } from './transform';

vi.mock('../get-capabilities', () => ({
  getDamageByPrefix: vi.fn(() => []),
  getIdsFromString: vi.fn((value: string) =>
    value
      .split('#')
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => Number.isFinite(id)),
  ),
}));

const buff1306008020 = {
  id: 1_306_008_020,
  geDesc: '~',
  durationPolicy: 1,
  formationPolicy: 0,
  probability: 10_000,
  period: 0,
  periodicInhibitionPolicy: 0,
  gameAttributeId: 9,
  stackingType: 2,
  defaultStackCount: 1,
  stackAppendCount: 0,
  stackLimitCount: 1,
  stackDurationRefreshPolicy: 0,
  stackPeriodResetPolicy: 0,
  stackExpirationRemoveNumber: 1,
  extraEffectId: 0,
  extraEffectRemoveStackNum: 0,
  extraEffectReqSetting: 0,
  bDurationAffectedByBulletTime: false,
  bExecutePeriodicEffectOnApplication: true,
  bDenyOverflowApplication: false,
  bClearStackOnOverflow: false,
  bOnlyLocalAdd: false,
  deadRemove: true,
  bRequireModifierSuccessToTriggerCues: true,
  bSuppressStackingCues: true,
  durationCalculationPolicy: [0],
  durationMagnitude: [],
  durationMagnitude2: [],
  calculationPolicy: [2, 8, 0, 1, 0, 10_000, 1, 10_000],
  modifierMagnitude: [20_000],
  modifierMagnitude2: [],
  buffAction: [],
  ongoingTagRequirements: [],
  ongoingTagIgnores: [],
  applicationTagRequirements: [],
  applicationTagIgnores: [],
  applicationSourceTagRequirements: [],
  applicationSourceTagIgnores: [],
  removalTagRequirements: [],
  removalTagIgnores: [],
  grantedTags: ['角色.177fd2b0.6dedeb39.fa713ad9'],
  grantedApplicationImmunityTags: [],
  grantedApplicationImmunityTagIgnores: [],
  extraEffectRequirements: [],
  extraEffectReqPara: [],
  extraEffectProbability: [10_000],
  extraEffectCd: [-1],
  extraEffectParameters: [],
  extraEffectParametersGrow1: [0],
  extraEffectParametersGrow2: [0],
  gameplayCueIds: [],
  overflowEffects: [],
  prematureExpirationEffects: [],
  routineExpirationEffects: [],
  relatedExtraEffectBuffId: [],
  removeBuffWithTags: [],
  tagLogic: [],
} satisfies RepositoryBuff;

const buff1412607001 = {
  id: 1_412_607_001,
  geDesc: '~',
  durationPolicy: 1,
  formationPolicy: 0,
  probability: 10_000,
  period: 0,
  periodicInhibitionPolicy: 0,
  gameAttributeId: 114,
  stackingType: 2,
  defaultStackCount: 1,
  stackAppendCount: 0,
  stackLimitCount: 1,
  stackDurationRefreshPolicy: 0,
  stackPeriodResetPolicy: 0,
  stackExpirationRemoveNumber: 1,
  extraEffectId: 0,
  extraEffectRemoveStackNum: 0,
  extraEffectReqSetting: 0,
  bDurationAffectedByBulletTime: false,
  bExecutePeriodicEffectOnApplication: true,
  bDenyOverflowApplication: false,
  bClearStackOnOverflow: false,
  bOnlyLocalAdd: false,
  deadRemove: true,
  bRequireModifierSuccessToTriggerCues: true,
  bSuppressStackingCues: true,
  durationCalculationPolicy: [0],
  durationMagnitude: [],
  durationMagnitude2: [],
  calculationPolicy: [2, 11, 0, 1, 0, 12_500, 1, 5000],
  modifierMagnitude: [20_000],
  modifierMagnitude2: [],
  buffAction: [],
  ongoingTagRequirements: [],
  ongoingTagIgnores: [],
  applicationTagRequirements: [],
  applicationTagIgnores: [],
  applicationSourceTagRequirements: [],
  applicationSourceTagIgnores: [],
  removalTagRequirements: [],
  removalTagIgnores: [],
  grantedTags: [],
  grantedApplicationImmunityTags: [],
  grantedApplicationImmunityTagIgnores: [],
  extraEffectRequirements: [],
  extraEffectReqPara: [],
  extraEffectProbability: [10_000],
  extraEffectCd: [-1],
  extraEffectParameters: [],
  extraEffectParametersGrow1: [0],
  extraEffectParametersGrow2: [0],
  gameplayCueIds: [],
  overflowEffects: [],
  prematureExpirationEffects: [],
  routineExpirationEffects: [],
  relatedExtraEffectBuffId: [],
  removeBuffWithTags: [],
  tagLogic: [],
} satisfies RepositoryBuff;

const buff1206000400 = {
  id: 1_206_000_400,
  geDesc: '~',
  durationPolicy: 1,
  formationPolicy: 0,
  probability: 10_000,
  period: 0,
  periodicInhibitionPolicy: 0,
  gameAttributeId: 7,
  stackingType: 2,
  defaultStackCount: 1,
  stackAppendCount: 0,
  stackLimitCount: 1,
  stackDurationRefreshPolicy: 0,
  stackPeriodResetPolicy: 0,
  stackExpirationRemoveNumber: 1,
  extraEffectId: 0,
  extraEffectRemoveStackNum: 0,
  extraEffectReqSetting: 0,
  bDurationAffectedByBulletTime: false,
  bExecutePeriodicEffectOnApplication: true,
  bDenyOverflowApplication: false,
  bClearStackOnOverflow: false,
  bOnlyLocalAdd: false,
  deadRemove: true,
  bRequireModifierSuccessToTriggerCues: true,
  bSuppressStackingCues: true,
  durationCalculationPolicy: [0],
  durationMagnitude: [],
  durationMagnitude2: [],
  calculationPolicy: [2, 11, 1, 1, 0, 15_000, 100, 1560],
  modifierMagnitude: [120_000],
  modifierMagnitude2: [],
  buffAction: [],
  ongoingTagRequirements: [],
  ongoingTagIgnores: ['角色.R2T1BulanteMd10011.状态标识.特殊能量充能强化状态'],
  applicationTagRequirements: [],
  applicationTagIgnores: [],
  applicationSourceTagRequirements: [],
  applicationSourceTagIgnores: [],
  removalTagRequirements: [],
  removalTagIgnores: [],
  grantedTags: [],
  grantedApplicationImmunityTags: [],
  grantedApplicationImmunityTagIgnores: [],
  extraEffectRequirements: [],
  extraEffectReqPara: [],
  extraEffectProbability: [10_000],
  extraEffectCd: [-1],
  extraEffectParameters: [],
  extraEffectParametersGrow1: [0],
  extraEffectParametersGrow2: [0],
  gameplayCueIds: [],
  overflowEffects: [],
  prematureExpirationEffects: [],
  routineExpirationEffects: [],
  relatedExtraEffectBuffId: [],
  removeBuffWithTags: [],
  tagLogic: [],
} satisfies RepositoryBuff;

const buff1505402120 = {
  id: 1_505_402_120,
  geDesc: '~',
  durationPolicy: 2,
  formationPolicy: 5,
  probability: 10_000,
  period: 0,
  periodicInhibitionPolicy: 0,
  gameAttributeId: 8,
  stackingType: 2,
  defaultStackCount: 1,
  stackAppendCount: 0,
  stackLimitCount: 1,
  stackDurationRefreshPolicy: 0,
  stackPeriodResetPolicy: 0,
  stackExpirationRemoveNumber: 1,
  extraEffectId: 0,
  extraEffectRemoveStackNum: 0,
  extraEffectReqSetting: 0,
  bDurationAffectedByBulletTime: false,
  bExecutePeriodicEffectOnApplication: true,
  bDenyOverflowApplication: false,
  bClearStackOnOverflow: false,
  bOnlyLocalAdd: false,
  deadRemove: true,
  bRequireModifierSuccessToTriggerCues: true,
  bSuppressStackingCues: true,
  durationCalculationPolicy: [0],
  durationMagnitude: [-1],
  durationMagnitude2: [],
  calculationPolicy: [2, 11, 1, 1, 1, 0, 20, 1250],
  modifierMagnitude: [10_000],
  modifierMagnitude2: [],
  buffAction: [],
  ongoingTagRequirements: ['角色.R2T1ShouanrenMd10011.动作标识.领域2'],
  ongoingTagIgnores: [],
  applicationTagRequirements: [],
  applicationTagIgnores: [],
  applicationSourceTagRequirements: [],
  applicationSourceTagIgnores: [],
  removalTagRequirements: [],
  removalTagIgnores: [],
  grantedTags: [],
  grantedApplicationImmunityTags: [],
  grantedApplicationImmunityTagIgnores: [],
  extraEffectRequirements: [],
  extraEffectReqPara: [],
  extraEffectProbability: [10_000],
  extraEffectCd: [-1],
  extraEffectParameters: [],
  extraEffectParametersGrow1: [0],
  extraEffectParametersGrow2: [0],
  gameplayCueIds: [],
  overflowEffects: [],
  prematureExpirationEffects: [],
  routineExpirationEffects: [],
  relatedExtraEffectBuffId: [],
  removeBuffWithTags: [],
  tagLogic: [],
} satisfies RepositoryBuff;

const buff31000024011 = {
  id: 31_000_024_011,
  geDesc: '~',
  durationPolicy: 2,
  formationPolicy: 0,
  probability: 10_000,
  period: 0,
  periodicInhibitionPolicy: 0,
  gameAttributeId: 7,
  stackingType: 2,
  defaultStackCount: 1,
  stackAppendCount: 0,
  stackLimitCount: 1,
  stackDurationRefreshPolicy: 0,
  stackPeriodResetPolicy: 0,
  stackExpirationRemoveNumber: 1,
  extraEffectId: 0,
  extraEffectRemoveStackNum: 0,
  extraEffectReqSetting: 0,
  bDurationAffectedByBulletTime: false,
  bExecutePeriodicEffectOnApplication: true,
  bDenyOverflowApplication: false,
  bClearStackOnOverflow: false,
  bOnlyLocalAdd: false,
  deadRemove: true,
  bRequireModifierSuccessToTriggerCues: true,
  bSuppressStackingCues: true,
  durationCalculationPolicy: [0],
  durationMagnitude: [15],
  durationMagnitude2: [],
  calculationPolicy: [9, 142, 0, 1, 0, 0, 1, 1500],
  modifierMagnitude: [300_000],
  modifierMagnitude2: [],
  buffAction: [],
  ongoingTagRequirements: [],
  ongoingTagIgnores: [],
  applicationTagRequirements: [],
  applicationTagIgnores: [],
  applicationSourceTagRequirements: [],
  applicationSourceTagIgnores: [],
  removalTagRequirements: [],
  removalTagIgnores: ['行为状态.逻辑状态.前台'],
  grantedTags: [],
  grantedApplicationImmunityTags: [],
  grantedApplicationImmunityTagIgnores: [],
  extraEffectRequirements: [],
  extraEffectReqPara: [],
  extraEffectProbability: [10_000],
  extraEffectCd: [-1],
  extraEffectParameters: [],
  extraEffectParametersGrow1: [0],
  extraEffectParametersGrow2: [0],
  gameplayCueIds: [],
  overflowEffects: [],
  prematureExpirationEffects: [],
  routineExpirationEffects: [],
  relatedExtraEffectBuffId: [],
  removeBuffWithTags: [],
  tagLogic: [],
} satisfies RepositoryBuff;

function expectRuntimeParameterizedValue(
  value: unknown,
  expected: {
    maximum: number;
    coefficient: number;
    stat: string;
    offset?: number;
  },
) {
  expect(value).toBeTypeOf('object');
  expect(value).toMatchObject({
    type: 'clamp',
    minimum: 0,
    maximum: expected.maximum,
    operand: {
      type: 'product',
    },
  });

  const clamp = value as {
    type: 'clamp';
    maximum: number;
    minimum: number;
    operand: {
      type: 'product';
      operands: Array<unknown>;
    };
  };
  expect(clamp.operand.operands[0]).toBe(expected.coefficient);

  const statOperand = clamp.operand.operands[1];
  if (expected.offset === undefined) {
    expect(statOperand).toEqual({
      type: 'statParameterizedNumber',
      stat: expected.stat,
      resolveWith: 'self',
    });
    return;
  }

  expect(statOperand).toEqual({
    type: 'sum',
    operands: [
      {
        type: 'statParameterizedNumber',
        stat: expected.stat,
        resolveWith: 'self',
      },
      expected.offset,
    ],
  });
}

describe('getBuffStat', () => {
  it('locks in the runtime-parameterized expression for buff 1306008020', () => {
    const stat = getBuffStat(buff1306008020);

    expect(stat).toBeDefined();
    expect(stat?.stat).toBe('criticalDamage');
    expect(stat?.tags).toEqual(['all']);
    expect(typeof stat?.value).not.toBe('number');
    expectRuntimeParameterizedValue(stat?.value, {
      maximum: 1,
      coefficient: 2,
      stat: 'criticalRate',
      offset: -1,
    });
  });

  it('locks in the runtime-parameterized expression for buff 1412607001', () => {
    const stat = getBuffStat(buff1412607001);

    expect(stat).toBeDefined();
    expect(stat?.stat).toBe('damageBonus');
    expect(stat?.tags).toEqual(['echo']);
    expect(typeof stat?.value).not.toBe('number');
    expectRuntimeParameterizedValue(stat?.value, {
      maximum: 0.5,
      coefficient: 2,
      stat: 'energyRegen',
      offset: -1.25,
    });
  });

  it('locks in the flat-output runtime-parameterized expression for buff 1206000400', () => {
    const stat = getBuffStat(buff1206000400);

    expect(stat).toBeDefined();
    expect(stat?.stat).toBe('attackFlat');
    expect(stat?.tags).toEqual(['all']);
    expect(typeof stat?.value).not.toBe('number');
    expectRuntimeParameterizedValue(stat?.value, {
      maximum: 1560,
      coefficient: 1200,
      stat: 'energyRegen',
      offset: -1.5,
    });
  });

  it('locks in the direct-stat runtime-parameterized expression for buff 1505402120', () => {
    const stat = getBuffStat(buff1505402120);

    expect(stat).toBeDefined();
    expect(stat?.stat).toBe('criticalRate');
    expect(stat?.tags).toEqual(['all']);
    expect(typeof stat?.value).not.toBe('number');
    expectRuntimeParameterizedValue(stat?.value, {
      maximum: 0.125,
      coefficient: 0.05,
      stat: 'energyRegen',
    });
  });

  it('locks in the large-coefficient runtime-parameterized expression for buff 31000024011', () => {
    const stat = getBuffStat(buff31000024011);

    expect(stat).toBeDefined();
    expect(stat?.stat).toBe('attackScalingBonus');
    expect(stat?.tags).toEqual(['all']);
    expect(typeof stat?.value).not.toBe('number');
    expectRuntimeParameterizedValue(stat?.value, {
      maximum: 0.15,
      coefficient: 30,
      stat: 'tuneBreakBoost',
    });
  });
});

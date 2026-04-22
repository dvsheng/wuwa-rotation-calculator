import { z } from 'zod';

const makeScalarShape = <
  TKey extends string,
  TSchema extends z.ZodNumber | z.ZodString | z.ZodBoolean,
>(
  keys: ReadonlyArray<TKey>,
  schema: TSchema,
): { [K in TKey]: TSchema } =>
  Object.fromEntries(keys.map((key) => [key, schema])) as { [K in TKey]: TSchema };

const NumberArraySchema = z.array(z.number());
const StringArraySchema = z.array(z.string());
const NumberMapEntrySchema = z.object({ Key: z.number(), Value: z.number() }).strict();
const NumberMapArraySchema = z.array(NumberMapEntrySchema);
const ScalarMapEntrySchema = z
  .object({
    Key: z.union([z.number(), z.string()]),
    Value: z.union([z.number(), z.string()]),
  })
  .strict();
const ScalarMapArraySchema = z.array(ScalarMapEntrySchema);
const StringArrayWrapperSchema = z.object({ ArrayString: StringArraySchema }).strict();
const PropertyValueSchema = z
  .object({
    Id: z.number(),
    Value: z.number(),
    IsRatio: z.boolean(),
  })
  .strict();

const JsonObjectSchema: z.ZodType<Record<string, unknown>> = z.lazy(() =>
  z.record(z.string(), JsonValueSchema),
);
const JsonArraySchema: z.ZodType<Array<unknown>> = z.lazy(() =>
  z.array(JsonValueSchema),
);
const JsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    JsonObjectSchema,
    JsonArraySchema,
  ]),
);

const ObjectReferenceSchema = z
  .object({
    ObjectName: z.string(),
    ObjectPath: z.string(),
  })
  .strict();
const AssetReferenceSchema = z
  .object({
    AssetPathName: z.string(),
    SubPathString: z.string(),
  })
  .strict();
const GameplayTagSchema = z
  .object({
    TagName: z.string(),
  })
  .strict();
const GameplayTagOrStringSchema = z.union([GameplayTagSchema, z.string()]);

function stripHashedKeySuffix(key: string) {
  return key.replace(/_\d+_[\dA-F]+$/i, '');
}

function stripHashedKeySuffixes(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stripHashedKeySuffixes(entry));
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      stripHashedKeySuffix(key),
      stripHashedKeySuffixes(entryValue),
    ]),
  );
}

function withStrippedHashedKeySuffixes<TSchema extends z.ZodType>(
  schema: TSchema,
): z.ZodPipe<z.ZodTransform<unknown, unknown>, TSchema> {
  return z.transform(stripHashedKeySuffixes).pipe(schema);
}

const SkillTriggerSchema = z
  .object({
    TriggerType_2_A4B916C949F97F67C63AEFA1E4A3F1CC: z.string(),
    TriggerPreset_5_7766F7AA48C4AA380971A9B4FA085B6F: z.array(
      GameplayTagOrStringSchema,
    ),
    TriggerParams_10_0B8BCCB6424F70FCD32451BF5E363B27: z.string(),
    TriggerFormula_11_05C6F52D48C9B57ACB5C85A076462A38: z.string(),
    TriggerTarget_14_4FBFA2194402F3F89FE451AFA771EC33: z.string(),
    TriggerTargetSocket_17_D17D9CE14BEEC1E628D4109AF3AB4F78: z.string(),
  })
  .strict();

const SkillBehaviorConditionSchema = z.looseObject({
  ConditionType: z.string(),
  IgnoreZ: z.boolean(),
  Sign: z.boolean(),
  ComparisonLogic: z.string(),
  Value: z.number(),
  RangeL: z.number(),
  RangeR: z.number(),
  AttributeId1: z.number(),
  AttributeId2: z.number(),
  AttributeRate: z.number(),
  TagToCheck: z.array(GameplayTagOrStringSchema),
  AnyTag: z.boolean(),
  Reverse: z.boolean(),
});

const SkillBehaviorBulletSchema = z.looseObject({
  bulletRowName: z.string(),
  bulletCount: z.number(),
  BlackboardKey: z.string(),
});

const SkillBehaviorActionSchema = z.looseObject({
  ActionType: z.string().optional(),
  Bullets: z.array(SkillBehaviorBulletSchema).optional(),
  BuffId: z.number().optional(),
  Tag: GameplayTagSchema.optional(),
  Duration: z.number().optional(),
});

const SkillBehaviorGroupSchema = z
  .object({
    SkillBehaviorConditionGroup: z.array(SkillBehaviorConditionSchema),
    SkillBehaviorConditionFormula: z.string(),
    SkillBehaviorActionGroup: z.array(SkillBehaviorActionSchema),
    SkillBehaviorContinue: z.boolean(),
  })
  .strict();

const MontageNotifyLinkSchema = z
  .object({
    LinkedMontage: ObjectReferenceSchema.nullish(),
    SlotIndex: z.number(),
    SegmentIndex: z.number(),
    LinkMethod: z.string(),
    CachedLinkMethod: z.string(),
    SegmentBeginTime: z.number(),
    SegmentLength: z.number(),
    LinkValue: z.number(),
    LinkedSequence: ObjectReferenceSchema.nullish(),
  })
  .strict();

const MontageNotifySchema = z
  .object({
    TriggerTimeOffset: z.number(),
    EndTriggerTimeOffset: z.number(),
    TriggerWeightThreshold: z.number(),
    NotifyName: z.string(),
    Notify: ObjectReferenceSchema.nullish(),
    NotifyStateClass: ObjectReferenceSchema.nullish(),
    Duration: z.number(),
    EndLink: MontageNotifyLinkSchema,
    bConvertedFromBranchingPoint: z.boolean(),
    MontageTickType: z.string(),
    bEnabled: z.boolean(),
    NotifyTriggerChance: z.number(),
    NotifyFilterType: z.string(),
    NotifyFilterLOD: z.number(),
    bTriggerOnDedicatedServer: z.boolean(),
    bTriggerOnFollower: z.boolean(),
    bForceTriggerOnState: z.boolean(),
    TrackIndex: z.number(),
    LinkedMontage: ObjectReferenceSchema.nullish(),
    SlotIndex: z.number(),
    SegmentIndex: z.number(),
    LinkMethod: z.string(),
    CachedLinkMethod: z.string(),
    SegmentBeginTime: z.number(),
    SegmentLength: z.number(),
    LinkValue: z.number(),
    LinkedSequence: ObjectReferenceSchema.nullish(),
    DurationLinkValue: z.number().optional(),
  })
  .strict();

const MontagePropertiesSchema = z.looseObject({
  Notifies: z.array(MontageNotifySchema).optional(),
  SequenceLength: z.number(),
});

const MontageRootSchema = z.looseObject({
  Type: z.literal('AnimMontage'),
  Name: z.string(),
  Flags: z.string(),
  Class: z.string(),
  Package: z.string(),
  Properties: MontagePropertiesSchema,
  SkeletonGuid: z.string().optional(),
});

const BaseNotifyDetailFields = {
  Name: z.string(),
  Flags: z.string(),
  Class: z.string(),
  Package: z.string().optional(),
  SkeletonGuid: z.string().optional(),
};

const ReSkillEventPropertiesSchema = z.looseObject({
  子弹数据名: z.string().optional(),
  使用子弹id数组: z.boolean().optional(),
  子弹id数组: z.array(z.string()).optional(),
  骨骼名字: z.string().optional(),
  子弹出生位置偏移: JsonObjectSchema.optional(),
  传入当前实体位置: z.boolean().optional(),
  exportIndex: z.number().optional(),
});

const StateAddTagPropertiesSchema = z.looseObject({
  Tag: GameplayTagSchema.optional(),
  CurrentTimeLength: z.number().optional(),
  exportIndex: z.number().optional(),
});

const SendGamePlayEventPropertiesSchema = z.looseObject({
  事件Tag: GameplayTagSchema.optional(),
  exportIndex: z.number().optional(),
});

const ReSkillEventDetailsSchema = z.looseObject({
  ...BaseNotifyDetailFields,
  Type: z.literal('TsAnimNotifyReSkillEvent_C'),
  Properties: ReSkillEventPropertiesSchema.optional(),
});

const StateAddTagDetailsSchema = z.looseObject({
  ...BaseNotifyDetailFields,
  Type: z.literal('TsAnimNotifyStateAddTag_C'),
  Properties: StateAddTagPropertiesSchema.optional(),
});

const SendGamePlayEventDetailsSchema = z.looseObject({
  ...BaseNotifyDetailFields,
  Type: z.literal('TsAnimNotifySendGamePlayEvent_C'),
  Properties: SendGamePlayEventPropertiesSchema.optional(),
});

const SkillBehaviorPropertiesSchema = z.looseObject({
  技能行为: z.array(SkillBehaviorGroupSchema).optional(),
  exportIndex: z.number().optional(),
});

const SkillBehaviorDetailsSchema = z.looseObject({
  ...BaseNotifyDetailFields,
  Type: z.literal('TsAnimNotifySkillBehavior_C'),
  Properties: SkillBehaviorPropertiesSchema.optional(),
});

const AddBuffPropertiesSchema = z.looseObject({
  BuffId: z.number().optional(),
  exportIndex: z.number().optional(),
});

const AddBuffDetailsSchema = z.looseObject({
  ...BaseNotifyDetailFields,
  Type: z.literal('TsAnimNotifyAddBuff_C'),
  Properties: AddBuffPropertiesSchema.optional(),
});

const StateAddBuffPropertiesSchema = z.looseObject({
  BuffId: z.number().optional(),
  CurrentTimeLength: z.number().optional(),
  exportIndex: z.number().optional(),
});

const StateAddBuffDetailsSchema = z.looseObject({
  ...BaseNotifyDetailFields,
  Type: z.literal('TsAnimNotifyStateAddBuff_C'),
  Properties: StateAddBuffPropertiesSchema.optional(),
});

const GenericMontageNotifyTypes = [
  'ANS_Bianshenweizhi_C',
  'ANS_Jueyuan_Huaban_C',
  'ANS_ShowSpecMesh_C',
  'ANS_Yinlin_Beam_C',
  'AnimNotifyAddMaterialControllerDataGroup_C',
  'AnimNotifyAddMaterialControllerData_C',
  'AnimNotifyAddMotionVertexOffset_C',
  'AnimNotifyEffect_C',
  'AnimNotifyStateAddMaterialControllerDataGroup_C',
  'AnimNotifyStateAddMaterialControllerData_C',
  'AnimNotifyStateEffect_C',
  'AnimNotifyStateGhost_C',
  'AnimNotifyStateScreenEffect_C',
  'AnimNotifyState_DisableRootMotion',
  'TsAnimNotifyAddTag_C',
  'TsAnimNotifyAirAttack_C',
  'TsAnimNotifyAudioEvent_C',
  'TsAnimNotifyBattleQte_C',
  'TsAnimNotifyBounce_C',
  'TsAnimNotifyBreakPoint_C',
  'TsAnimNotifyCameraEffect_C',
  'TsAnimNotifyCameraModify_C',
  'TsAnimNotifyCameraShake_C',
  'TsAnimNotifyCatapult_C',
  'TsAnimNotifyChangeSkillPriority_C',
  'TsAnimNotifyChangeSlot_C',
  'TsAnimNotifyClearInputCache_C',
  'TsAnimNotifyClientEvent_C',
  'TsAnimNotifyControllerShake_C',
  'TsAnimNotifyDestroySpecBullet_C',
  'TsAnimNotifyDisableAllRoleWithoutControl_C',
  'TsAnimNotifyEndSkill_C',
  'TsAnimNotifyFightStand_C',
  'TsAnimNotifyFootstepAudio_C',
  'TsAnimNotifyBonesShowControl_C',
  'TsAnimNotifyHideBone_C',
  'TsAnimNotifyHideMesh_C',
  'TsAnimNotifyJoinTeamQte_C',
  'TsAnimNotifyPanelQte_C',
  'TsAnimNotifyReSkillByTagCount_C',
  'TsAnimNotifyRemoveSummonedEntity_C',
  'TsAnimNotifyResetPositionToGround_C',
  'TsAnimNotifyResetSkillTarget_C',
  'TsAnimNotifyRoleFinishInteract_C',
  'TsAnimNotifySetMovementMode_C',
  'TsAnimNotifyStateAbsoluteTimeStop_C',
  'TsAnimNotifyStateAccelInSplineMove_C',
  'TsAnimNotifyStateAddGameplayCue_C',
  'TsAnimNotifyStateAddMaterialController_C',
  'TsAnimNotifyStateAddMoveByInputDirect_C',
  'TsAnimNotifyStateAudioEvent_C',
  'TsAnimNotifyStateBulletDuration_C',
  'TsAnimNotifyStateBonesShowControl_C',
  'TsAnimNotifyStateBurst_C',
  'TsAnimNotifyStateCameraModify_C',
  'TsAnimNotifyStateCameraShake_C',
  'TsAnimNotifyStateCameraStateChange_C',
  'TsAnimNotifyStateCaughtBinding_C',
  'TsAnimNotifyStateCaughtTrigger_C',
  'TsAnimNotifyStateChangeSlot_C',
  'TsAnimNotifyStateCleanBurstCamera_C',
  'TsAnimNotifyStateControllerShake_C',
  'TsAnimNotifyStateCurveMove_C',
  'TsAnimNotifyStateDisableCameraCollision_C',
  'TsAnimNotifyStateEnableSequenceCameraDither_C',
  'TsAnimNotifyStateFoleyAudioEvent_C',
  'TsAnimNotifyStateGoThrough_C',
  'TsAnimNotifyStateHideActor_C',
  'TsAnimNotifyStateHideBone_C',
  'TsAnimNotifyStateHideMesh_C',
  'TsAnimNotifyStateInteractionRotateToLocation_C',
  'TsAnimNotifyStateJumpLandDetect_C',
  'TsAnimNotifyStateKeepAwayFromGround_C',
  'TsAnimNotifyStateMeshDitherDetect_C',
  'TsAnimNotifyStateMontageSpeedChange_C',
  'TsAnimNotifyStateNextAtt_C',
  'TsAnimNotifyStatePositionBranchTarget_C',
  'TsAnimNotifyStatePositionTarget_C',
  'TsAnimNotifyStatePosition_C',
  'TsAnimNotifyStateReplaceHitEffect_C',
  'TsAnimNotifyStateRoleRotate_C',
  'TsAnimNotifyStateRotateAlignGravity_C',
  'TsAnimNotifyStateRotateBonesToTarget_C',
  'TsAnimNotifyStateRotateMesh_C',
  'TsAnimNotifyStateRotate_C',
  'TsAnimNotifyStateSceneInteract_C',
  'TsAnimNotifyStateSetCollisionChannel_C',
  'TsAnimNotifyStateSetCollisionLv_C',
  'TsAnimNotifyStateSetHitPriority_C',
  'TsAnimNotifyStateSetMass_C',
  'TsAnimNotifyStateSetMovementMode_C',
  'TsAnimNotifyStateShowUiWeapon_C',
  'TsAnimNotifyStateSimpleDisableCollision_C',
  'TsAnimNotifyStateSkeletalMeshAnimPlay_C',
  'TsAnimNotifyStateSkillBehavior_C',
  'TsAnimNotifyStateSoftLock_C',
  'TsAnimNotifyStateSubMeshControl_C',
  'TsAnimNotifyStateTimeStopRequest_C',
  'TsAnimNotifyStateTurnModelBlackboard_C',
  'TsAnimNotifyStateWeaponHang_C',
  'TsAnimNotifySwitchSequenceCamera_C',
  'TsAnimNotifyTeleport_C',
  'TsAnimNotifyWeaponHide_C',
  'TsSeqAnimNotifyPlayPlot_C',
] as const;

const GenericNotifyDetailsSchema = z.looseObject({
  ...BaseNotifyDetailFields,
  Type: z.enum(GenericMontageNotifyTypes),
  Properties: JsonObjectSchema.optional(),
  Rows: JsonObjectSchema.optional(),
});

const MontageNotifyDetailsSchema = z.discriminatedUnion('Type', [
  ReSkillEventDetailsSchema,
  StateAddTagDetailsSchema,
  SendGamePlayEventDetailsSchema,
  SkillBehaviorDetailsSchema,
  AddBuffDetailsSchema,
  StateAddBuffDetailsSchema,
  GenericNotifyDetailsSchema,
]);

const SkillTargetSchema = z
  .object({
    LockOnConfigId_13_9240CDCD4A7C75F715B64899EE8F2DC1: z.number(),
    SkillTargetPriority_32_6503AE024BF0D5CB5D542B84F997BBB4: z.string(),
    ShowTarget_28_4A5D9B40438221B0FC28ACA3361C6C06: z.boolean(),
    HateOrLockOnChanged_21_D264B269445DCEAE86F9BEAE40EE18CA: z.boolean(),
    TargetDied_23_07DBB3684ACF90FA21FB5EB88B580C67: z.boolean(),
    GlobalTarget_35_C8F0C6EE4E19DE7DD23820B99040632C: z.boolean(),
    BlackboardKey_39_4B3BDD654E196A674D080AB04ADE7C0A: z.string(),
    SkillTargetRemainTime_42_8895E5CB41289FAAAAF2DF9791A19C1F: z.number(),
  })
  .strict();

const CooldownConfigSchema = z
  .object({
    CdTime_17_53AFB6144F31B1FC690BC4B495391CEC: z.number(),
    CdDelay_18_88077BCA45D7C83C6F9595BE90E19E91: z.number(),
    IsShareAllCdSkill_16_0490446C45E16F9607CA3DA11969A16E: z.boolean(),
    MaxCount_21_BE52BC1A408FD925BE8848A76E57F08D: z.number(),
    ShareGroupId_23_F1F57AFA439C48D1F17446B85631B005: z.number(),
    SectionCount_31_F71122154E43E38C3F673ABA2F018785: z.number(),
    SectionRemaining_32_B8FF4E36428915E3484F2FBF5FC484ED: z.number(),
    NextSkillId_49_F3D3171641CEFF1E81E768AE04F83E49: z.number(),
    StartTime_26_C726665545379542EF1611A3601D3796: z.number(),
    StopTime_35_11B3875946A9CBDFB1443F8B5AC1E367: z.number(),
    IsReset_38_CA73D145447E07AA5E4619828AF561CD: z.boolean(),
    IsResetOnChangeRole_43_4E270B634727E782FF05A2897DEBE424: z.boolean(),
    CdTags_48_8502F43749E48F6FFD3FA0AD331D0DC2: z.array(GameplayTagOrStringSchema),
  })
  .strict();

const SkillInfoPatternValidators = [
  [/^SkillName_/, z.string()],
  [/^SkillIcon_/, AssetReferenceSchema],
  [/^SkillMode_/, z.string()],
  [/^SkillTriggers_/, z.array(SkillTriggerSchema)],
  [/^SkillBehaviorGroup_/, z.array(SkillBehaviorGroupSchema)],
  [/^SkillGA_/, AssetReferenceSchema],
  [/^Animations_/, z.array(AssetReferenceSchema)],
  [/^MontagePaths_/, z.array(z.string())],
  [/^SkillTag_/, z.array(GameplayTagSchema)],
  [/^GroupId_/, z.number()],
  [/^InterruptLevel_/, z.number()],
  [/^SkillGenre_/, z.string()],
  [/^IsLockOn_/, z.boolean()],
  [/^SkillTarget_/, SkillTargetSchema],
  [/^SkillDirection_/, z.string()],
  [/^CooldownConfig_/, CooldownConfigSchema],
  [/^WalkOffLedge_/, z.boolean()],
  [/^SkillStartBuff_/, z.array(z.number())],
  [/^SkillBuff_/, z.array(z.number())],
  [/^SkillEndBuff_/, z.array(z.number())],
  [/^ToughRatio_/, z.number()],
  [/^StrengthCost_/, z.number()],
  [/^IsFullBodySkill_/, z.boolean()],
  [/^AutonomouslyBySimulate_/, z.boolean()],
  [/^MoveControllerTime_/, z.number()],
  [/^ImmuneFallDamageTime_/, z.number()],
  [/^OverrideHit_/, z.boolean()],
  [/^OverrideType_/, z.string()],
  [/^ExportSpecialAnim_/, z.array(JsonObjectSchema)],
  [/^SkillStepUp_/, z.boolean()],
  [/^SkillCanBeginWithoutControl_/, z.boolean()],
  [/^MaxCounterCount_/, z.number()],
  [/^SpecialBuffInCode_/, z.array(z.number())],
] as const;

const SkillInfoRowSchema = z
  .record(z.string(), JsonValueSchema)
  .superRefine((row, context) => {
    for (const [key, value] of Object.entries(row)) {
      const validator = SkillInfoPatternValidators.find(([pattern]) =>
        pattern.test(key),
      );
      if (!validator) continue;

      const [, schema] = validator;
      const result = schema.safeParse(value);
      if (result.success) continue;

      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: z.prettifyError(result.error),
      });
    }
  });

const NormalizedSkillTargetSchema = z
  .object({
    LockOnConfigId: z.number(),
    SkillTargetPriority: z.string(),
    ShowTarget: z.boolean(),
    HateOrLockOnChanged: z.boolean(),
    TargetDied: z.boolean(),
    GlobalTarget: z.boolean(),
    BlackboardKey: z.string(),
    SkillTargetRemainTime: z.number(),
  })
  .strict();

const NormalizedCooldownConfigSchema = z
  .object({
    CdTime: z.number(),
    CdDelay: z.number(),
    IsShareAllCdSkill: z.boolean(),
    MaxCount: z.number(),
    ShareGroupId: z.number(),
    SectionCount: z.number(),
    SectionRemaining: z.number(),
    NextSkillId: z.number(),
    StartTime: z.number(),
    StopTime: z.number(),
    IsReset: z.boolean(),
    IsResetOnChangeRole: z.boolean(),
    CdTags: z.array(GameplayTagOrStringSchema),
  })
  .strict();

const RawSkillInfoRowDataSchema = withStrippedHashedKeySuffixes(
  z
    .object({
      SkillName: z.string(),
      SkillIcon: AssetReferenceSchema,
      SkillMode: z.string(),
      SkillTriggers: z.array(JsonObjectSchema),
      SkillBehaviorGroup: z.array(JsonObjectSchema),
      SkillGA: AssetReferenceSchema,
      Animations: z.array(AssetReferenceSchema),
      MontagePaths: z.array(z.string()),
      SkillTag: z.array(GameplayTagSchema),
      GroupId: z.number(),
      InterruptLevel: z.number(),
      SkillGenre: z.string(),
      IsLockOn: z.boolean(),
      SkillTarget: NormalizedSkillTargetSchema,
      SkillDirection: z.string(),
      CooldownConfig: NormalizedCooldownConfigSchema,
      WalkOffLedge: z.boolean(),
      SkillStartBuff: z.array(z.number()),
      SkillBuff: z.array(z.number()),
      SkillEndBuff: z.array(z.number()),
      ToughRatio: z.number(),
      StrengthCost: z.number(),
      IsFullBodySkill: z.boolean(),
      AutonomouslyBySimulate: z.boolean(),
      MoveControllerTime: z.number(),
      ImmuneFallDamageTime: z.number(),
      OverrideHit: z.boolean(),
      OverrideType: z.string(),
      ExportSpecialAnim: z.array(AssetReferenceSchema),
      SkillStepUp: z.boolean(),
      SkillCanBeginWithoutControl: z.boolean(),
      MaxCounterCount: z.number(),
      SpecialBuffInCode: z.array(z.number()),
    })
    .strict(),
);

const SkillInfoRootExportSchema = z.looseObject({
  Type: z.literal('DataTable'),
  Name: z.literal('DT_SkillInfo'),
  Flags: z.string(),
  Class: z.string(),
  Package: z.string(),
  Properties: z.looseObject({
    RowStruct: ObjectReferenceSchema,
  }),
  Rows: z.record(z.string(), SkillInfoRowSchema),
});

const RawSkillInfoRowRootExportSchema = z.looseObject({
  Type: z.literal('DataTable'),
  Name: z.literal('DT_SkillInfo'),
  Flags: z.string(),
  Class: z.string(),
  Package: z.string(),
  Properties: z.looseObject({
    RowStruct: ObjectReferenceSchema,
  }),
  Rows: z.record(z.string(), RawSkillInfoRowDataSchema),
});

const BasePropertyNumberKeys = [
  'Id',
  'Lv',
  'LifeMax',
  'Life',
  'Sheild',
  'SheildDamageChange',
  'SheildDamageReduce',
  'Atk',
  'Crit',
  'CritDamage',
  'Def',
  'EnergyEfficiency',
  'CdReduse',
  'DamageChangeNormalSkill',
  'DamageChange',
  'DamageReduce',
  'DamageChangeAuto',
  'DamageChangeCast',
  'DamageChangeUltra',
  'DamageChangeQte',
  'DamageChangePhantom',
  'DamageChangePhys',
  'DamageChangeElement1',
  'DamageChangeElement2',
  'DamageChangeElement3',
  'DamageChangeElement4',
  'DamageChangeElement5',
  'DamageChangeElement6',
  'DamageResistancePhys',
  'DamageResistanceElement1',
  'DamageResistanceElement2',
  'DamageResistanceElement3',
  'DamageResistanceElement4',
  'DamageResistanceElement5',
  'DamageResistanceElement6',
  'DamageReducePhys',
  'DamageReduceElement1',
  'DamageReduceElement2',
  'DamageReduceElement3',
  'DamageReduceElement4',
  'DamageReduceElement5',
  'DamageReduceElement6',
  'IgnoreDamageResistancePhys',
  'IgnoreDamageResistanceElement1',
  'IgnoreDamageResistanceElement2',
  'IgnoreDamageResistanceElement3',
  'IgnoreDamageResistanceElement4',
  'IgnoreDamageResistanceElement5',
  'IgnoreDamageResistanceElement6',
  'IgnoreDefRate',
  'AutoAttackSpeed',
  'CastAttackSpeed',
  'SpecialDamageChange',
  'HealedChange',
  'HealChange',
  'ElementPropertyType',
  'ElementPower1',
  'ElementPower2',
  'ElementPower3',
  'ElementPower4',
  'ElementPower5',
  'ElementPower6',
  'ElementEnergyMax',
  'ElementEnergy',
  'ElementEfficiency',
  'StrengthMax',
  'Strength',
  'StrengthRecover',
  'StrengthPunishTime',
  'StrengthFastSwim',
  'StrengthRun',
  'StrengthClimbJump',
  'StrengthFastClimbCost',
  'StrengthSwim',
  'StrengthGliding',
  'ToughMax',
  'Tough',
  'ToughRecover',
  'ToughRecoverDelayTime',
  'ToughChange',
  'ToughReduce',
  'SkillToughRatio',
  'HardnessMax',
  'Hardness',
  'HardnessRecover',
  'HardnessPunishTime',
  'HardnessChange',
  'HardnessReduce',
  'RageMax',
  'Rage',
  'RageRecover',
  'RagePunishTime',
  'RageChange',
  'RageReduce',
  'SpecialEnergy1Max',
  'SpecialEnergy1',
  'SpecialEnergy2Max',
  'SpecialEnergy2',
  'SpecialEnergy3Max',
  'SpecialEnergy3',
  'SpecialEnergy4Max',
  'SpecialEnergy4',
  'SpecialEnergy5Max',
  'SpecialEnergy5',
  'WeaknessBuildUpMax',
  'WeaknessBuildUp',
  'WeaknessMastery',
  'WeaknessTotalBonus',
  'BreakWeaknessRatio',
  'WeakTime',
  'StatusBuildUp1Max',
  'StatusBuildUp1',
  'StatusBuildUp2Max',
  'StatusBuildUp2',
  'StatusBuildUp3Max',
  'StatusBuildUp3',
  'StatusBuildUp4Max',
  'StatusBuildUp4',
  'StatusBuildUp5Max',
  'StatusBuildUp5',
  'EnergyMax',
  'Energy',
  'Mass',
  'GravityScale',
  'ParalysisTimeMax',
  'ParalysisTime',
  'ParalysisTimeRecover',
  'BrakingFrictionFactor',
  'SpeedRatio',
] as const;

/**
 * Raw combat skill rows for characters.
 *
 * Model:
 * One row per authored skill definition inside a character skill group.
 *
 * Important fields:
 * - `SkillGroupId`: the character/entity id we group skills under.
 * - `SkillType`: maps to Basic / Skill / Liberation / Forte / Intro / Outro / etc.
 * - `SkillName`, `SkillDescribe`: text keys resolved through the text maps.
 * - `SkillLevelGroupId`: join key into `skilldescription.json` for parameter labels/values.
 * - `DamageList`: engine damage ids later matched into user-facing params.
 * - `MaxSkillLevel`: used when choosing the last relevant scaling entry.
 * - `SortIndex`: preserves in-game display order for the output skill list.
 */
const SkillSchema = z
  .object({
    Id: z.number(),
    SkillGroupId: z.number(),
    SkillType: z.number(),
    UpgradeCondition: z.number(),
    UpgradeSkillId: z.number(),
    SkillName: z.string(),
    SkillLevelGroupId: z.number(),
    LeftSkillEffect: z.number(),
    MaxSkillLevel: z.number(),
    SkillInfoList: NumberArraySchema,
    BuffList: NumberArraySchema,
    DamageList: NumberArraySchema.nullable(),
    Icon: z.string(),
    EffectSkillPath: z.string(),
    SortIndex: z.number(),
    SkillDescribe: z.string(),
    SkillDetailNum: StringArraySchema.optional(),
    MultiSkillDescribe: z.string(),
    MultiSkillDetailNum: StringArraySchema,
    SkillResume: z.string(),
    SkillResumeNum: StringArraySchema,
    SkillTagList: NumberArraySchema,
  })
  .strict();

/**
 * Raw engine damage formulas referenced by skills and echoes.
 *
 * Model:
 * One row per settle/damage definition used by attacks, echoes, and some effects.
 *
 * Important fields:
 * - `Id`: referenced from `Skill.DamageList` and `PhantomSkill.SettleIds`.
 * - `Element`: element id later mapped to Physical / Glacio / Fusion / etc.
 * - `Type`: low-level engine subtype preserved in output for debugging.
 * - `RelatedProperty`: which stat the damage scales from (HP / ATK / DEF).
 * - `RateLv`: level-based multiplier array; we use max skill/echo level entries.
 * - `HardnessLv`, `ToughLv`, `Energy`: break / stagger / resource metadata surfaced with instances.
 */
const DamageSchema = z
  .object({
    Id: z.number(),
    Condition: z.string(),
    ConstVariables: ScalarMapArraySchema,
    CalculateType: z.number(),
    Element: z.number(),
    DamageTextType: z.number(),
    DamageTextAreaId: z.number(),
    PayloadId: z.number(),
    Type: z.number(),
    SubType: NumberArraySchema,
    SmashType: z.number(),
    CureBaseValue: NumberArraySchema,
    RelatedProperty: z.number(),
    RateLv: NumberArraySchema,
    HardnessLv: NumberArraySchema,
    ToughLv: NumberArraySchema,
    Energy: NumberArraySchema,
    SpecialEnergy1: NumberArraySchema,
    SpecialEnergy2: NumberArraySchema,
    SpecialEnergy3: NumberArraySchema,
    SpecialEnergy4: NumberArraySchema,
    SpecialEnergy5: NumberArraySchema,
    FormulaType: z.number(),
    FormulaParam1: NumberArraySchema,
    FormulaParam2: NumberArraySchema,
    FormulaParam3: NumberArraySchema,
    FormulaParam4: NumberArraySchema,
    FormulaParam5: NumberArraySchema,
    FormulaParam6: NumberArraySchema,
    FormulaParam7: NumberArraySchema,
    FormulaParam8: NumberArraySchema,
    FormulaParam9: NumberArraySchema,
    FormulaParam10: NumberArraySchema,
    FluctuationLower: NumberArraySchema,
    FluctuationUpper: NumberArraySchema,
    ElementPowerType: z.number(),
    ElementPower: NumberArraySchema,
    WeaknessLvl: NumberArraySchema,
    WeaknessRatio: NumberArraySchema,
    SpecialWeaknessDamageRatio: z.number(),
    ImmuneType: z.number(),
    Percent0: NumberArraySchema,
    Percent1: NumberArraySchema,
  })
  .strict();

/**
 * Parameter rows for a skill's descriptive breakdown.
 *
 * Model:
 * One row per labeled parameter inside a skill description panel.
 *
 * Important fields:
 * - `SkillLevelGroupId`: join key back to `skill.json`.
 * - `AttributeName`: localized label key such as "Stage 1 DMG".
 * - `SkillDetailNum`: array-of-arrays containing the level-scaled display strings.
 * - `Order`: preserves author-defined parameter ordering.
 *
 * These rows are what let us turn raw `DamageList` entries into labeled user-facing hits.
 */
const SkillDescriptionSchema = z
  .object({
    Id: z.number(),
    SkillLevelGroupId: z.number(),
    AttributeName: z.string(),
    SkillDetailNum: z.array(StringArrayWrapperSchema).nullable(),
    Description: z.string(),
    Order: z.number(),
  })
  .strict();

/**
 * Raw buff / modifier definitions used across characters, weapons, echoes, and sets.
 *
 * Model:
 * One row per low-level gameplay effect. Many rows are opaque, but a useful subset can be
 * decoded into stat modifiers for capabilities or passive effects.
 *
 * Important fields:
 * - `GameAttributeID` + `ModifierMagnitude`: direct stat modifiers.
 * - `ExtraEffectID` + `ExtraEffectParameters*`: indirection/dispatch into child effects.
 * - `ApplicationSourceTagRequirements`: used to detect resonant chain gating.
 * - `FormationPolicy`: whether the buff is self-only or team-wide.
 * - `DurationMagnitude`, `StackLimitCount`: duration and stacking behavior.
 * - `DurationPolicy`: 0 | 1 | 2; 1 represents always active (if conditions are met), 2 represents timed buff
 * - `Id`: used to join from chain nodes, weapon resonance effects, and echo/echo-set buffs.
 */
const BuffSchema = z
  .object({
    ...makeScalarShape(['GeDesc'] as const, z.string()),
    ...makeScalarShape(
      [
        'Id',
        'DurationPolicy',
        'FormationPolicy',
        'Probability',
        'Period',
        'PeriodicInhibitionPolicy',
        'GameAttributeID',
        'StackingType',
        'DefaultStackCount',
        'StackAppendCount',
        'StackLimitCount',
        'StackDurationRefreshPolicy',
        'StackPeriodResetPolicy',
        'StackExpirationRemoveNumber',
        'ExtraEffectID',
        'ExtraEffectRemoveStackNum',
        'ExtraEffectReqSetting',
      ] as const,
      z.number(),
    ),
    ...makeScalarShape(
      [
        'bDurationAffectedByBulletTime',
        'bExecutePeriodicEffectOnApplication',
        'bDenyOverflowApplication',
        'bClearStackOnOverflow',
        'bOnlyLocalAdd',
        'DeadRemove',
        'bRequireModifierSuccessToTriggerCues',
        'bSuppressStackingCues',
      ] as const,
      z.boolean(),
    ),
    DurationCalculationPolicy: NumberArraySchema,
    DurationMagnitude: NumberArraySchema,
    DurationMagnitude2: NumberArraySchema,
    CalculationPolicy: NumberArraySchema,
    ModifierMagnitude: NumberArraySchema,
    ModifierMagnitude2: NumberArraySchema,
    BuffAction: StringArraySchema,
    OngoingTagRequirements: StringArraySchema,
    OngoingTagIgnores: StringArraySchema,
    ApplicationTagRequirements: StringArraySchema,
    ApplicationTagIgnores: StringArraySchema,
    ApplicationSourceTagRequirements: StringArraySchema,
    ApplicationSourceTagIgnores: StringArraySchema,
    RemovalTagRequirements: StringArraySchema,
    RemovalTagIgnores: StringArraySchema,
    GrantedTags: StringArraySchema,
    GrantedApplicationImmunityTags: StringArraySchema,
    GrantedApplicationImmunityTagIgnores: z.array(z.unknown()),
    ExtraEffectRequirements: NumberArraySchema,
    ExtraEffectReqPara: StringArraySchema,
    ExtraEffectProbability: NumberArraySchema,
    ExtraEffectCD: NumberArraySchema,
    ExtraEffectParameters: StringArraySchema,
    ExtraEffectParametersGrow1: NumberArraySchema,
    ExtraEffectParametersGrow2: NumberArraySchema,
    GameplayCueIds: NumberArraySchema,
    OverflowEffects: NumberArraySchema,
    PrematureExpirationEffects: NumberArraySchema,
    RoutineExpirationEffects: NumberArraySchema,
    RelatedExtraEffectBuffId: NumberArraySchema,
    RemoveBuffWithTags: StringArraySchema,
    TagLogic: z.array(z.unknown()),
  })
  .strict();

/**
 * Resonant chain node definitions for characters.
 *
 * Model:
 * One row per S1-S6 node in a character's resonant chain.
 *
 * Important fields:
 * - `GroupId`: character/entity id the node belongs to.
 * - `GroupIndex`: the S1-S6 position, also used for synthetic output skill types.
 * - `NodeName`, `AttributesDescription`, `AttributesDescriptionParams`: localized chain text.
 * - `BuffIds`: links chain nodes to buffs that should be marked as chain-gated.
 */
const ChainSchema = z
  .object({
    Id: z.number(),
    GroupId: z.number(),
    GroupIndex: z.number(),
    NodeType: z.number(),
    NodeIndex: z.string(),
    NodeName: z.string(),
    AttributesDescription: z.string(),
    BgDescription: z.string(),
    BuffIds: NumberArraySchema.optional(),
    AddProp: z.array(PropertyValueSchema),
    ActivateConsume: NumberMapArraySchema,
    AttributesDescriptionParams: StringArraySchema.optional(),
    NodeIcon: z.string(),
  })
  .strict();

const RogueCharacterBuffSchema = z
  .object({
    Id: z.number(),
    BuffId: z.number(),
    BuffIds: NumberArraySchema,
    AffixDesc: z.string(),
    AffixDescParam: StringArraySchema,
    AffixDescSimple: z.string(),
    AffixTitle: z.string(),
    AffixIcon: z.string(),
  })
  .strict();

const RoguePermanentBuffPoolSchema = z
  .object({
    Id: z.number(),
    BuffId: z.number(),
    PerIds: NumberArraySchema,
    EffectId: z.number(),
    Quality: z.number(),
    BuffElement: NumberMapArraySchema,
    BuffIcon: z.string(),
    BuffDesc: z.string(),
    BuffDescParam: StringArraySchema,
    BuffDescSimple: z.string(),
    BuffName: z.string(),
  })
  .strict();

const RogueWeeklyBuffPoolSchema = z
  .object({
    Id: z.number(),
    RelatedArtifactId: z.number(),
    BuffId: z.number(),
    PerIds: NumberArraySchema,
    BuffType: z.number(),
    BuffTriggerTagId: z.number(),
    BuffTriggerActionName: z.string(),
    BuffTagId: NumberArraySchema,
    Quality: z.number(),
    BuffIcon: z.string(),
    ButtonIcon: z.string(),
    BuffDesc: z.string(),
    BuffDescParam: StringArraySchema,
    BuffDescSimple: z.string(),
    BuffName: z.string(),
  })
  .strict();

/**
 * Base stats for characters and other entities at a given level.
 *
 * Model:
 * One row per property id per level snapshot.
 *
 * Important fields:
 * - `Id`: property id, which matches `RoleInfo.PropertyId` for characters.
 * - `Lv`: used to pick the level 1 base row before applying growth ratios.
 * - `LifeMax`, `Atk`, `Def`: base stat inputs for level 90 stat generation.
 * - `Crit`, `CritDamage`, `EnergyEfficiency`, `WeaknessMastery`: secondary stats surfaced in output.
 */
const BasePropertySchema = z
  .object(makeScalarShape(BasePropertyNumberKeys, z.number()))
  .strict();

/**
 * Universal level-growth ratios for character HP / ATK / DEF.
 *
 * Model:
 * One row per level / breach breakpoint in the role growth table.
 *
 * Important fields:
 * - `Level`: we currently select the level 90 row.
 * - `LifeMaxRatio`, `AtkRatio`, `DefRatio`: multipliers applied to base property stats.
 */
const RolePropertyGrowthSchema = z
  .object({
    Id: z.number(),
    Level: z.number(),
    BreachLevel: z.number(),
    LifeMaxRatio: z.number(),
    AtkRatio: z.number(),
    DefRatio: z.number(),
  })
  .strict();

const SkillTreeNodeSchema = z
  .object({
    Id: z.number(),
    NodeIndex: z.number(),
    NodeGroup: z.number(),
    ParentNodes: z.array(z.number()),
    NodeType: z.number(),
    Coordinate: z.number(),
    Condition: z.array(z.number()),
    SkillId: z.number(),
    SkillBranchIds: z.array(z.number()),
    PropertyNodeTitle: z.string(),
    PropertyNodeDescribe: z.string(),
    PropertyNodeParam: z.array(z.string()),
    PropertyNodeIcon: z.string(),
    Property: z.array(
      z
        .object({
          Id: z.number(),
          Value: z.number(),
          IsRatio: z.boolean(),
        })
        .strict(),
    ),
    Consume: z.array(
      z
        .object({
          Key: z.number(),
          Value: z.number(),
        })
        .strict(),
    ),
    UnLockCondition: z.number(),
  })
  .strict();

/**
 * Character metadata rows.
 *
 * Model:
 * One row per playable or displayable role definition.
 *
 * Important fields:
 * - `Id`: character/entity id and primary join key for the character pipeline.
 * - `Name`, `NickName`, `Introduction`: localized text keys for display content.
 * - `ElementId`, `WeaponType`, `QualityId`: core entity classification for the database.
 * - `PropertyId`: links to `baseproperty.json`.
 * - `ResonantChainGroupId`: points at the resonant chain group for the character.
 */
const RoleInfoSchema = z
  .object({
    ...makeScalarShape(
      [
        'Name',
        'NickName',
        'Introduction',
        'RoleHeadIconCircle',
        'RoleHeadIconLarge',
        'RoleHeadIconBig',
        'RoleHeadIcon',
        'RoleStand',
        'RolePortrait',
        'Icon',
        'FormationRoleCard',
        'FormationSpineAtlas',
        'FormationSpineSkeletonData',
        'Card',
        'CharacterVoice',
        'AttributesDescription',
        'UiScenePerformanceABP',
        'SkillDAPath',
        'SkillLockDAPath',
        'SkillEffectDA',
        'CameraConfig',
        'RoleBody',
        'FootStepState',
        'ObtainedShowDescription',
      ] as const,
      z.string(),
    ),
    ...makeScalarShape(
      [
        'Id',
        'QualityId',
        'RoleType',
        'ParentId',
        'Priority',
        'PropertyId',
        'ElementId',
        'SkinId',
        'WeaponType',
        'InitWeaponItemId',
        'MaxLevel',
        'LevelConsumeId',
        'BreachId',
        'BreachModel',
        'ResonanceId',
        'SkillId',
        'ResonantChainGroupId',
        'LockOnDefaultId',
        'LockOnLookOnId',
        'EntityProperty',
        'NumLimit',
        'SkillTreeGroupId',
        'DefaultSkillBranchId',
        'SpecialEnergyBarId',
        'PartyId',
        'MeshId',
        'ItemQualityId',
        'CameraFloatHeight',
        'UiMeshId',
        'RoleGuide',
        'RedDotDisableRule',
        'TrialRole',
      ] as const,
      z.number(),
    ),
    ...makeScalarShape(
      [
        'IsTrial',
        'Intervene',
        'ShowInBag',
        'IsShow',
        'HideHuLu',
        'IsAim',
        'EnableOperateSelfBgm',
      ] as const,
      z.boolean(),
    ),
    Tag: NumberArraySchema,
    ShowProperty: NumberArraySchema,
    SkillBranchIds: NumberArraySchema,
    ExchangeConsume: NumberMapArraySchema,
    SpilloverItem: NumberMapArraySchema,
    SkinDamage: StringArraySchema,
    WeaponScale: NumberArraySchema,
  })
  .strict();

/**
 * Level growth curves for weapon stats.
 *
 * Model:
 * One row per curve id / level / breach value.
 *
 * Important fields:
 * - `CurveId`: referenced by weapon main/sub stat definitions.
 * - `Level`: we currently select the level 90 row.
 * - `CurveValue`: multiplier applied to weapon stat base values.
 */
const WeaponGrowthSchema = z
  .object({
    Id: z.number(),
    CurveId: z.number(),
    Level: z.number(),
    BreachLevel: z.number(),
    CurveValue: z.number(),
  })
  .strict();

/**
 * Weapon resonance/passive refinement rows.
 *
 * Model:
 * One row per weapon resonance level (R1-R5).
 *
 * Important fields:
 * - `ResonId`: groups all refine rows for one weapon passive.
 * - `Level`: refinement rank.
 * - `Effect`: buff ids or effect ids used to resolve passive buffs.
 */
const WeaponResonSchema = z
  .object({
    Id: z.number(),
    ResonId: z.number(),
    Level: z.number(),
    Name: z.string(),
    Effect: NumberArraySchema,
    Consume: z.number(),
    GoldConsume: z.number(),
    MaterialPlaceType: z.number(),
    AlternativeConsume: z.array(z.unknown()),
  })
  .strict();

/**
 * Weapon definitions.
 *
 * Model:
 * One row per weapon item shown in the handbook/inventory.
 *
 * Important fields:
 * - `ItemId`: weapon entity id.
 * - `WeaponName`, `AttributesDescription`, `BgDescription`: localized display content.
 * - `QualityId`, `WeaponType`: classification fields for the entity table.
 * - `FirstPropId` / `SecondPropId` + `FirstCurve` / `SecondCurve`: main and sub stat formulas.
 * - `ResonId`: links the weapon to its passive/refinement rows.
 * - `Desc` + `DescParams`: passive description template and refine-scaled placeholders.
 */
const WeaponConfigSchema = z
  .object({
    ItemId: z.number(),
    IsShow: z.boolean(),
    WeaponName: z.string(),
    QualityId: z.number(),
    WeaponType: z.number(),
    ModelId: z.number(),
    TransformId: z.number(),
    Models: NumberArraySchema,
    ModelsIndex: NumberArraySchema,
    ResonLevelLimit: z.number(),
    FirstPropId: PropertyValueSchema,
    FirstCurve: z.number(),
    SecondPropId: PropertyValueSchema,
    SecondCurve: z.number(),
    ResonId: z.number(),
    LevelId: z.number(),
    BreachId: z.number(),
    StandAnim: StringArraySchema,
    Desc: z.string(),
    DescParams: z.array(StringArrayWrapperSchema),
    BgDescription: z.string(),
    AttributesDescription: z.string(),
    Icon: z.string(),
    ResonanceIcon: z.string(),
    IconMiddle: z.string(),
    IconSmall: z.string(),
    Mesh: z.string(),
    NumLimit: z.number(),
    MaxCapcity: z.number(),
    HiddenTime: z.number(),
    Destructible: z.boolean(),
    ShowInBag: z.boolean(),
    SortIndex: z.number(),
    TypeDescription: z.string(),
    ItemAccess: NumberArraySchema,
    ObtainedShow: z.number(),
    ObtainedShowDescription: z.string(),
    HandBookTrialId: z.number(),
    RedDotDisableRule: z.number(),
  })
  .strict();

/**
 * Echo set group definitions.
 *
 * Model:
 * One row per echo set group (the 2pc/5pc set umbrella).
 *
 * Important fields:
 * - `Id`: echo set entity id.
 * - `FetterGroupName`, `FetterGroupDesc`: localized set name/description.
 * - `FetterMap`: maps piece thresholds like 2 and 5 to concrete `phantomfetter` bonus rows.
 */
const PhantomFetterGroupSchema = z
  .object({
    Id: z.number(),
    FetterMap: NumberMapArraySchema,
    FetterType: z.number(),
    FetterGroupName: z.string(),
    AccessId: z.number(),
    FetterGroupDesc: z.string(),
    SortId: z.number(),
    FetterElementColor: z.string(),
    FetterElementPath: z.string(),
    AimModelElementPath: z.string(),
  })
  .strict();

/**
 * Echo set bonus rows.
 *
 * Model:
 * One row per set-bonus effect, typically referenced from a 2pc or 5pc threshold.
 *
 * Important fields:
 * - `AddProp`: direct stat bonuses, most useful for 2pc effects.
 * - `BuffIds`: indirect buff chains, often used by 5pc conditional bonuses.
 * - `EffectDescription` + `EffectDescriptionParam`: localized bonus text.
 */
const PhantomFetterSchema = z
  .object({
    Id: z.number(),
    Name: z.string(),
    BuffIds: NumberArraySchema,
    AddProp: z.array(PropertyValueSchema),
    EffectDescription: z.string(),
    FetterIcon: z.string(),
    SimplyEffectDesc: z.string(),
    EffectDescriptionParam: StringArraySchema,
    EffectDefineDescription: z.string(),
    Priority: z.number(),
  })
  .strict();

/**
 * Echo item definitions.
 *
 * Model:
 * One row per obtainable echo item/variant.
 *
 * Important fields:
 * - `ItemId`: echo entity id.
 * - `MonsterName`: localized display key for the echo name.
 * - `SkillId`: links to the active echo skill definition.
 * - `Rarity`: echo cost bucket surfaced as the output `cost`.
 * - `ElementType`: element tags shown on the echo output.
 * - `FetterGroup`: links the echo to one or more echo set ids.
 */
const PhantomItemSchema = z
  .object({
    ItemId: z.number(),
    MonsterId: z.number(),
    ParentMonsterId: z.number(),
    MonsterName: z.string(),
    ElementType: NumberArraySchema,
    MainProp: z.object({ RandGroupId: z.number(), RandNum: z.number() }).strict(),
    LevelUpGroupId: z.number(),
    SkillId: z.number(),
    CalabashBuffs: NumberArraySchema,
    Rarity: z.number(),
    MeshId: z.number(),
    Zoom: NumberArraySchema,
    Location: NumberArraySchema,
    Rotator: NumberArraySchema,
    StandAnim: z.string(),
    TypeDescription: z.string(),
    AttributesDescription: z.string(),
    Icon: z.string(),
    IconMiddle: z.string(),
    IconSmall: z.string(),
    SkillIcon: z.string(),
    QualityId: z.number(),
    MaxCapcity: z.number(),
    Destructible: z.boolean(),
    ShowInBag: z.boolean(),
    SortIndex: z.number(),
    NumLimit: z.number(),
    ItemAccess: NumberArraySchema,
    ObtainedShow: z.number(),
    ObtainedShowDescription: z.string(),
    PhantomType: z.number(),
    FetterGroup: NumberArraySchema,
    Mesh: z.string(),
    RedDotDisableRule: z.number(),
  })
  .strict();

/**
 * Echo skill definitions.
 *
 * Model:
 * One row per active echo skill configuration.
 *
 * Important fields:
 * - `PhantomSkillId`: join key from `phantomitem.SkillId`.
 * - `DescriptionEx`, `CurLevelDescriptionEx`, `LevelDescStrArray`: localized description template and values.
 * - `SettleIds`: damage ids later resolved through `damage.json`.
 * - `BuffIds`, `BuffEffects`: buff/effect links used to resolve echo capabilities and modifiers.
 * - `SkillCD`: user-facing echo cooldown.
 */
const PhantomSkillSchema = z
  .object({
    Id: z.number(),
    PhantomSkillId: z.number(),
    BuffIds: NumberArraySchema,
    SettleIds: NumberArraySchema,
    BuffEffects: NumberArraySchema,
    ChargeEfficiency: z.number(),
    SkillGroupId: z.number(),
    SkillCD: z.number(),
    DescriptionEx: z.string(),
    SimplyDescription: z.string(),
    IfCounterSkill: z.boolean(),
    CurLevelDescriptionEx: StringArraySchema,
    LevelDescStrArray: z.array(StringArrayWrapperSchema),
    BattleViewIcon: z.string(),
    SpecialBattleViewIcon: z.string(),
  })
  .strict();

const RawMontageArraySchema = withStrippedHashedKeySuffixes(
  z.tuple([MontageRootSchema]).rest(MontageNotifyDetailsSchema),
);
const RawSkillInfoAssetArraySchema = withStrippedHashedKeySuffixes(
  z.tuple([SkillInfoRootExportSchema]).rest(MontageNotifyDetailsSchema),
);
const RawSkillInfoRowFileArraySchema = z.tuple([RawSkillInfoRowRootExportSchema]);
const ReBulletBaseSettingsSchema = z
  .record(z.string(), JsonValueSchema)
  .superRefine((row, context) => {
    for (const prefix of ['每个单位总作用次数', '总作用次数限制', '作用间隔']) {
      const entry = Object.entries(row).find(([key]) => key.startsWith(prefix));
      if (entry) continue;

      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Missing ${prefix} field`,
      });
    }
  });

const ReBulletRowSchema = z
  .record(z.string(), JsonValueSchema)
  .superRefine((row, context) => {
    const baseSettingsEntry = Object.entries(row).find(([key]) =>
      key.startsWith('基础设置'),
    );
    if (!baseSettingsEntry) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Missing 基础设置 field',
      });
      return;
    }

    const [, baseSettingsValue] = baseSettingsEntry;
    const result = ReBulletBaseSettingsSchema.safeParse(baseSettingsValue);
    if (result.success) {
      return;
    }

    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: [baseSettingsEntry[0]],
      message: z.prettifyError(result.error),
    });
  });
const RawReBulletDataRowSchema = withStrippedHashedKeySuffixes(ReBulletRowSchema);

const ReBulletDataMainRootExportSchema = z.looseObject({
  Type: z.literal('DataTable'),
  Name: z.string().regex(/^DT_ReBulletDataMain/),
  Flags: z.string(),
  Class: z.string(),
  Package: z.string(),
  Properties: z.looseObject({
    RowStruct: ObjectReferenceSchema,
  }),
  Rows: z.record(z.string(), RawReBulletDataRowSchema),
});
const RawReBulletDataMainArraySchema = z
  .tuple([ReBulletDataMainRootExportSchema])
  .rest(MontageNotifyDetailsSchema);

/**
 * English localization rows loaded from the three textmap shards.
 *
 * Model:
 * One row per localized string entry.
 *
 * Important fields:
 * - `Id` / `Key`: lookup token used by game data rows.
 * - `Content`: resolved English string inserted into output descriptions, names, and labels.
 */
const TextEntrySchema = z
  .object({
    Id: z.string().optional(),
    Key: z.string().optional(),
    Content: z.string(),
    RedirectDbIndex: z.number().optional(),
  })
  .strict();

export const SkillArraySchema = z.array(SkillSchema);
export const DamageArraySchema = z.array(DamageSchema);
export const SkillDescriptionArraySchema = z.array(SkillDescriptionSchema);
export const BuffArraySchema = z.array(BuffSchema);
export const ChainArraySchema = z.array(ChainSchema);
export const RogueCharacterBuffArraySchema = z.array(RogueCharacterBuffSchema);
export const RoguePermanentCharacterBuffArraySchema = z.array(RogueCharacterBuffSchema);
export const RoguePermanentBuffPoolArraySchema = z.array(RoguePermanentBuffPoolSchema);
export const RogueWeeklyBuffPoolArraySchema = z.array(RogueWeeklyBuffPoolSchema);
export const BasePropertyArraySchema = z.array(BasePropertySchema);
export const RolePropertyGrowthArraySchema = z.array(RolePropertyGrowthSchema);
export const SkillTreeNodeArraySchema = z.array(SkillTreeNodeSchema);
export const RoleInfoArraySchema = z.array(RoleInfoSchema);
export const WeaponGrowthArraySchema = z.array(WeaponGrowthSchema);
export const WeaponResonArraySchema = z.array(WeaponResonSchema);
export const WeaponConfigArraySchema = z.array(WeaponConfigSchema);
export const PhantomFetterGroupArraySchema = z.array(PhantomFetterGroupSchema);
export const PhantomFetterArraySchema = z.array(PhantomFetterSchema);
export const PhantomItemArraySchema = z.array(PhantomItemSchema);
export const PhantomSkillArraySchema = z.array(PhantomSkillSchema);
export const RawMontageAssetArraySchema = RawMontageArraySchema;
export const RawSkillInfoAssetFileArraySchema = RawSkillInfoAssetArraySchema;
export const RawSkillInfoRowDataFileArraySchema = RawSkillInfoRowFileArraySchema;
export const RawReBulletDataMainFileArraySchema = RawReBulletDataMainArraySchema;
export const TextEntryArraySchema = z.array(TextEntrySchema);

export type SkillEntry = z.infer<typeof SkillSchema>;
export type DamageEntry = z.infer<typeof DamageSchema>;
export type SkillDescriptionEntry = z.infer<typeof SkillDescriptionSchema>;
export type BuffEntry = z.infer<typeof BuffSchema>;
export type ChainEntry = z.infer<typeof ChainSchema>;
export type BasePropertyEntry = z.infer<typeof BasePropertySchema>;
export type RolePropertyGrowthEntry = z.infer<typeof RolePropertyGrowthSchema>;
export type SkillTreeNodeEntry = z.infer<typeof SkillTreeNodeSchema>;
export type RoleInfoEntry = z.infer<typeof RoleInfoSchema>;
export type WeaponGrowthEntry = z.infer<typeof WeaponGrowthSchema>;
export type WeaponResonEntry = z.infer<typeof WeaponResonSchema>;
export type WeaponConfigEntry = z.infer<typeof WeaponConfigSchema>;
export type PhantomFetterGroupEntry = z.infer<typeof PhantomFetterGroupSchema>;
export type PhantomFetterEntry = z.infer<typeof PhantomFetterSchema>;
export type PhantomItemEntry = z.infer<typeof PhantomItemSchema>;
export type PhantomSkillEntry = z.infer<typeof PhantomSkillSchema>;
export type TextEntry = z.infer<typeof TextEntrySchema>;
export type RawMontageAssetArray = z.infer<typeof RawMontageArraySchema>;
export type MontageNotifyDetails = z.infer<typeof MontageNotifyDetailsSchema>;
export type ReSkillEventDetails = z.infer<typeof ReSkillEventDetailsSchema>;
export type ReSkillEventProperties = z.infer<typeof ReSkillEventPropertiesSchema>;
export type StateAddTagDetails = z.infer<typeof StateAddTagDetailsSchema>;
export type SendGamePlayEventDetails = z.infer<typeof SendGamePlayEventDetailsSchema>;
export type SkillBehaviorDetails = z.infer<typeof SkillBehaviorDetailsSchema>;
export type AddBuffDetails = z.infer<typeof AddBuffDetailsSchema>;
export type StateAddBuffDetails = z.infer<typeof StateAddBuffDetailsSchema>;
export type MontageRoot = z.infer<typeof MontageRootSchema>;
export type RawSkillInfoAssetArray = z.infer<typeof RawSkillInfoAssetArraySchema>;
export type RawSkillInfoRowData = z.infer<typeof RawSkillInfoRowDataSchema>;
export type RawSkillInfoRowDataFileArray = z.infer<
  typeof RawSkillInfoRowFileArraySchema
>;
export type RawReBulletDataMainFileArray = z.infer<
  typeof RawReBulletDataMainArraySchema
>;
export type SkillInfoRoot = z.infer<typeof SkillInfoRootExportSchema>;

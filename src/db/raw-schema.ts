import {
  bigint,
  boolean,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
} from 'drizzle-orm/pg-core';

const integer = (name: string) => bigint(name, { mode: 'number' });

type ReBulletJsonPrimitive = string | number | boolean | null;
type ReBulletJsonValue =
  | ReBulletJsonPrimitive
  | ReBulletJsonObject
  | Array<ReBulletJsonValue>;
type ReBulletJsonObject = { [key: string]: ReBulletJsonValue };

type ReBulletGameplayTag = {
  TagName: string;
};

type ReBulletAssetReference = {
  AssetPathName: string;
  SubPathString: string;
};

type ReBulletObjectReference = {
  ObjectName: string;
  ObjectPath: string;
};

type ReBulletVector = {
  X: number;
  Y: number;
  Z: number;
};

type ReBulletRotator = {
  Yaw: number;
  Roll: number;
  Pitch: number;
};

type ReBulletTimeDilation = {
  优先级?: number;
  时间膨胀值?: number;
  时间膨胀时长?: number;
  时间膨胀变化曲线?: ReBulletObjectReference | null;
};

export type RawReBulletDataBaseSettings = ReBulletJsonObject & {
  伤害ID?: number;
  初始大小?: ReBulletVector;
  子弹形状?: string;
  作用间隔?: number;
  初始旋转?: ReBulletRotator;
  命中个数?: number;
  多伤害ID?: Array<number>;
  持续时间?: number;
  被击效果?: string;
  子弹标签?: ReBulletGameplayTag;
  特殊参数?: Array<ReBulletJsonValue>;
  IsRandomVictim?: boolean;
  不适配坡度?: boolean;
  命中判定Tag?: ReBulletGameplayTag;
  多被击效果?: Array<string>;
  是否贴水面?: boolean;
  禁止命中Tag?: ReBulletGameplayTag;
  出生位置基准?: string;
  中心位置偏移?: ReBulletVector;
  出生位置偏移?: ReBulletVector;
  命中判定类型?: string;
  子弹受击方向?: string;
  子弹攻击方向?: ReBulletRotator;
  弱点被击效果?: string;
  是否持续碰撞?: boolean;
  是否贴地子弹?: boolean;
  碰撞判定延迟?: number;
  碰撞判定时长?: number;
  限制生成距离?: ReBulletVector;
  出生位置随机?: ReBulletVector;
  命中实体类型?: string;
  网络同步类型?: string;
  贴地探测距离?: number;
  子弹允许生成Tag?: Array<ReBulletJsonValue>;
  子弹禁止生成Tag?: Array<ReBulletJsonValue>;
  总作用次数限制?: number;
  攻击者黑板Key值?: string;
  不跟随移动平台?: boolean;
  共享父子弹次数?: boolean;
  多弱点被击效果?: Array<string>;
  Debug显示子弹进度?: boolean;
  作用间隔基于个体?: boolean;
  命中判定类型预设?: ReBulletAssetReference;
  每个单位总作用次数?: number;
  大范围子弹检测方式?: number;
  技能结束是否销毁子弹?: boolean;
  是否响应材质受击音效?: boolean;
  大范围子弹对场景物件生效?: boolean;
};

export type RawReBulletDataRow = ReBulletJsonObject & {
  基础设置?: RawReBulletDataBaseSettings;
  子弹名称?: string;
  召唤实体?: ReBulletJsonObject & {
    实体ID?: number;
    是否随子弹销毁而销毁?: boolean;
  };
  执行逻辑?: ReBulletJsonObject & {
    GB组?: ReBulletAssetReference;
    受击对象进入添加Tag?: Array<ReBulletJsonValue>;
    能量恢复类GE数组的Id?: Array<number>;
    命中后对受击者应用GE的Id?: Array<number>;
    命中后对攻击者应用GE的Id?: Array<number>;
    受击对象进入应用的GE的Id?: Array<number>;
    命中后对在场上角色应用的GE的Id?: Array<number>;
    命中后对受击者发射GameplayEvent标签?: ReBulletGameplayTag;
    命中后对攻击者发射GameplayEvent标签?: ReBulletGameplayTag;
    生成时对攻击者发射GameplayEvent标签?: ReBulletGameplayTag;
    结束时对攻击者发射GameplayEvent标签?: ReBulletGameplayTag;
  };
  时间膨胀?: ReBulletJsonObject & {
    攻击顿帧?: ReBulletTimeDilation;
    受击顿帧?: ReBulletTimeDilation;
    时间膨胀失效?: number;
    区域受击者时间膨胀?: boolean;
    命中弱点受击者顿帧?: ReBulletTimeDilation;
    命中弱点攻击者顿帧?: ReBulletTimeDilation;
    强制影响区域内子弹?: boolean;
    攻击顿帧忽略攻击者?: boolean;
    是否跟随攻击者顿帧?: boolean;
    自定义连携顿帧单位key?: string;
    子弹销毁时移除受击顿帧?: boolean;
  };
  环境交互?: ReBulletJsonObject & {
    水面交互?: ReBulletAssetReference;
    场景物件交互?: ReBulletAssetReference;
  };
  瞄准设置?: ReBulletJsonObject & {
    瞄准发射?: boolean;
    跟随骨骼发射?: boolean;
    瞄准子弹最大射程?: number;
    瞄准子弹最大偏转角度?: number;
    初始旋转是否面向目标?: boolean;
  };
  移动设置?: ReBulletJsonObject & {
    骨骼名字?: string;
    移动速度?: number;
    终点偏移?: ReBulletVector;
    子弹跟随类型?: string;
    是否锁定缩放?: boolean;
    移动速度曲线?: ReBulletObjectReference | null;
    运动轨迹类型?: string;
    初速度偏移方向?: ReBulletRotator;
    初速度方向随机?: ReBulletVector;
    初速度角度限制?: Array<ReBulletJsonValue>;
    骨骼网格体名字?: string;
    初速度仅Z轴朝向?: boolean;
    发射上下角度限制?: number;
    终点偏移基准朝向?: string;
    跟随骨骼限制旋转?: ReBulletVector;
    运动轨迹参数数据?: Array<ReBulletJsonValue>;
    运动轨迹参数曲线?: Array<ReBulletJsonValue>;
    运动轨迹参数目标?: string;
    运动轨迹目标骨骼?: string;
    出生初速度方向基准?: string;
    技能结束解除跟随骨骼?: boolean;
    运动轨迹目标黑板Key值?: string;
    出生初速度方向基准参数?: string;
  };
  缩放设置?: ReBulletJsonObject & {
    缩放倍率?: ReBulletVector;
    缩放倍率曲线?: ReBulletObjectReference | null;
    特定形状开关?: boolean;
  };
  逻辑设置?: ReBulletJsonObject & {
    预设?: ReBulletAssetReference;
  };
  障碍检测?: ReBulletJsonObject & {
    检测距离?: number;
    检测位置?: ReBulletVector;
  };
  子子弹设置?: Array<
    ReBulletJsonObject & {
      召唤触发?: string;
      召唤子弹ID?: number;
      召唤子弹延迟?: number;
      召唤子弹数量?: number;
      召唤子弹间隔?: number;
      失败是否停止?: boolean;
    }
  >;
  表现效果设置?: ReBulletJsonObject & {
    受击闪白?: ReBulletAssetReference;
    命中音效?: string;
    命中特效DA?: Array<{ Key: string; Value: ReBulletAssetReference }>;
    子弹特效DA?: ReBulletAssetReference;
    特殊特效DA?: Array<ReBulletJsonValue>;
    最大震动次数?: number;
    命中特效配置?: Array<ReBulletJsonObject>;
    子弹特效DA参数?: Array<ReBulletJsonValue>;
    命中时受击者震屏?: ReBulletAssetReference;
    命中时攻击者震屏?: ReBulletAssetReference;
    接手父子弹的特效?: boolean;
    生成时攻击者震屏?: ReBulletAssetReference;
    命中弱点时攻击者震屏?: ReBulletAssetReference;
    震屏关联到召唤兽主人?: boolean;
    子弹销毁调用子弹停止特效?: boolean;
  };
};

// ============================================================================
// Raw GitHub Data Tables
// Direct ingest of WutheringWaves_Data JSON files with no transformation.
// ============================================================================

/**
 * Raw skill rows from BinData/skill/skill.json
 */
export const rawSkills = pgTable('raw_skills', {
  id: integer('id').primaryKey(),
  skillGroupId: integer('skill_group_id').notNull(),
  skillType: integer('skill_type').notNull(),
  upgradeCondition: integer('upgrade_condition').notNull(),
  upgradeSkillId: integer('upgrade_skill_id').notNull(),
  skillName: text('skill_name').notNull(),
  skillLevelGroupId: integer('skill_level_group_id').notNull(),
  leftSkillEffect: integer('left_skill_effect').notNull(),
  maxSkillLevel: integer('max_skill_level').notNull(),
  skillInfoList: integer('skill_info_list').array().notNull(),
  buffList: integer('buff_list').array().notNull(),
  damageList: integer('damage_list').array(),
  icon: text('icon').notNull(),
  effectSkillPath: text('effect_skill_path').notNull(),
  sortIndex: integer('sort_index').notNull(),
  skillDescribe: text('skill_describe').notNull(),
  skillDetailNum: text('skill_detail_num').array(),
  multiSkillDescribe: text('multi_skill_describe').notNull(),
  multiSkillDetailNum: text('multi_skill_detail_num').array().notNull(),
  skillResume: text('skill_resume').notNull(),
  skillResumeNum: text('skill_resume_num').array().notNull(),
  skillTagList: integer('skill_tag_list').array().notNull(),
});

/**
 * Raw damage formula rows from BinData/damage/damage.json
 */
export const rawDamage = pgTable('raw_damage', {
  id: integer('id').primaryKey(),
  condition: text('condition').notNull(),
  constVariables: jsonb('const_variables').notNull(),
  calculateType: integer('calculate_type').notNull(),
  element: integer('element').notNull(),
  damageTextType: integer('damage_text_type').notNull(),
  damageTextAreaId: integer('damage_text_area_id').notNull(),
  payloadId: integer('payload_id').notNull(),
  type: integer('type').notNull(),
  subType: integer('sub_type').array().notNull(),
  smashType: integer('smash_type').notNull(),
  cureBaseValue: real('cure_base_value').array().notNull(),
  relatedProperty: integer('related_property').notNull(),
  rateLv: real('rate_lv').array().notNull(),
  hardnessLv: real('hardness_lv').array().notNull(),
  toughLv: real('tough_lv').array().notNull(),
  energy: real('energy').array().notNull(),
  specialEnergy1: real('special_energy_1').array().notNull(),
  specialEnergy2: real('special_energy_2').array().notNull(),
  specialEnergy3: real('special_energy_3').array().notNull(),
  specialEnergy4: real('special_energy_4').array().notNull(),
  specialEnergy5: real('special_energy_5').array().notNull(),
  formulaType: integer('formula_type').notNull(),
  formulaParam1: real('formula_param_1').array().notNull(),
  formulaParam2: real('formula_param_2').array().notNull(),
  formulaParam3: real('formula_param_3').array().notNull(),
  formulaParam4: real('formula_param_4').array().notNull(),
  formulaParam5: real('formula_param_5').array().notNull(),
  formulaParam6: real('formula_param_6').array().notNull(),
  formulaParam7: real('formula_param_7').array().notNull(),
  formulaParam8: real('formula_param_8').array().notNull(),
  formulaParam9: real('formula_param_9').array().notNull(),
  formulaParam10: real('formula_param_10').array().notNull(),
  fluctuationLower: real('fluctuation_lower').array().notNull(),
  fluctuationUpper: real('fluctuation_upper').array().notNull(),
  elementPowerType: integer('element_power_type').notNull(),
  elementPower: real('element_power').array().notNull(),
  weaknessLvl: real('weakness_lvl').array().notNull(),
  weaknessRatio: real('weakness_ratio').array().notNull(),
  specialWeaknessDamageRatio: real('special_weakness_damage_ratio').notNull(),
  immuneType: integer('immune_type').notNull(),
  percent0: real('percent_0').array().notNull(),
  percent1: real('percent_1').array().notNull(),
});

/**
 * Raw skill description parameter rows from BinData/skill/skilldescription.json
 */
export const rawSkillDescriptions = pgTable('raw_skill_descriptions', {
  id: integer('id').primaryKey(),
  skillLevelGroupId: integer('skill_level_group_id').notNull(),
  attributeName: text('attribute_name').notNull(),
  // Array of { ArrayString: string[] } objects — nested arrays require jsonb
  skillDetailNum: jsonb('skill_detail_num'),
  description: text('description').notNull(),
  order: integer('order').notNull(),
});

/**
 * Normalized skill attribute rows derived from BinData/skill/skilldescription.json
 */
export const rawSkillAttributes = pgTable('raw_skill_attributes', {
  id: integer('id').primaryKey(),
  skillLevelGroupId: integer('skill_level_group_id').notNull(),
  attributeName: text('attribute_name').notNull(),
  values: text('values').array().notNull(),
  description: text('description'),
  order: integer('order').notNull(),
});

/**
 * Raw buff/modifier rows from BinData/buff/buff.json
 */
export const rawBuffs = pgTable('raw_buffs', {
  id: integer('id').primaryKey(),
  geDesc: text('ge_desc').notNull(),
  durationPolicy: integer('duration_policy').notNull(),
  formationPolicy: integer('formation_policy').notNull(),
  probability: real('probability').notNull(),
  period: real('period').notNull(),
  periodicInhibitionPolicy: integer('periodic_inhibition_policy').notNull(),
  gameAttributeId: integer('game_attribute_id').notNull(),
  stackingType: integer('stacking_type').notNull(),
  defaultStackCount: integer('default_stack_count').notNull(),
  stackAppendCount: integer('stack_append_count').notNull(),
  stackLimitCount: integer('stack_limit_count').notNull(),
  stackDurationRefreshPolicy: integer('stack_duration_refresh_policy').notNull(),
  stackPeriodResetPolicy: integer('stack_period_reset_policy').notNull(),
  stackExpirationRemoveNumber: integer('stack_expiration_remove_number').notNull(),
  extraEffectId: integer('extra_effect_id').notNull(),
  extraEffectRemoveStackNum: integer('extra_effect_remove_stack_num').notNull(),
  extraEffectReqSetting: integer('extra_effect_req_setting').notNull(),
  bDurationAffectedByBulletTime: boolean(
    'b_duration_affected_by_bullet_time',
  ).notNull(),
  bExecutePeriodicEffectOnApplication: boolean(
    'b_execute_periodic_effect_on_application',
  ).notNull(),
  bDenyOverflowApplication: boolean('b_deny_overflow_application').notNull(),
  bClearStackOnOverflow: boolean('b_clear_stack_on_overflow').notNull(),
  bOnlyLocalAdd: boolean('b_only_local_add').notNull(),
  deadRemove: boolean('dead_remove').notNull(),
  bRequireModifierSuccessToTriggerCues: boolean(
    'b_require_modifier_success_to_trigger_cues',
  ).notNull(),
  bSuppressStackingCues: boolean('b_suppress_stacking_cues').notNull(),
  durationCalculationPolicy: integer('duration_calculation_policy').array().notNull(),
  durationMagnitude: real('duration_magnitude').array().notNull(),
  durationMagnitude2: real('duration_magnitude_2').array().notNull(),
  calculationPolicy: integer('calculation_policy').array().notNull(),
  modifierMagnitude: real('modifier_magnitude').array().notNull(),
  modifierMagnitude2: real('modifier_magnitude_2').array().notNull(),
  buffAction: text('buff_action').array().notNull(),
  ongoingTagRequirements: text('ongoing_tag_requirements').array().notNull(),
  ongoingTagIgnores: text('ongoing_tag_ignores').array().notNull(),
  applicationTagRequirements: text('application_tag_requirements').array().notNull(),
  applicationTagIgnores: text('application_tag_ignores').array().notNull(),
  applicationSourceTagRequirements: text('application_source_tag_requirements')
    .array()
    .notNull(),
  applicationSourceTagIgnores: text('application_source_tag_ignores').array().notNull(),
  removalTagRequirements: text('removal_tag_requirements').array().notNull(),
  removalTagIgnores: text('removal_tag_ignores').array().notNull(),
  grantedTags: text('granted_tags').array().notNull(),
  grantedApplicationImmunityTags: text('granted_application_immunity_tags')
    .array()
    .notNull(),
  // Array of unknown — jsonb
  grantedApplicationImmunityTagIgnores: jsonb(
    'granted_application_immunity_tag_ignores',
  )
    .$type<Array<unknown>>()
    .notNull(),
  extraEffectRequirements: integer('extra_effect_requirements').array().notNull(),
  extraEffectReqPara: text('extra_effect_req_para').array().notNull(),
  extraEffectProbability: real('extra_effect_probability').array().notNull(),
  extraEffectCd: real('extra_effect_cd').array().notNull(),
  extraEffectParameters: text('extra_effect_parameters').array().notNull(),
  extraEffectParametersGrow1: real('extra_effect_parameters_grow_1').array().notNull(),
  extraEffectParametersGrow2: real('extra_effect_parameters_grow_2').array().notNull(),
  gameplayCueIds: integer('gameplay_cue_ids').array().notNull(),
  overflowEffects: integer('overflow_effects').array().notNull(),
  prematureExpirationEffects: integer('premature_expiration_effects').array().notNull(),
  routineExpirationEffects: integer('routine_expiration_effects').array().notNull(),
  relatedExtraEffectBuffId: integer('related_extra_effect_buff_id').array().notNull(),
  removeBuffWithTags: text('remove_buff_with_tags').array().notNull(),
  // Array of unknown — jsonb
  tagLogic: jsonb('tag_logic').notNull(),
});

/**
 * Resonant chain node rows from BinData/resonate_chain/resonantchain.json
 */
export const rawChains = pgTable('raw_chains', {
  id: integer('id').primaryKey(),
  groupId: integer('group_id').notNull(),
  groupIndex: integer('group_index').notNull(),
  nodeType: integer('node_type').notNull(),
  nodeIndex: text('node_index').notNull(),
  nodeName: text('node_name').notNull(),
  attributesDescription: text('attributes_description').notNull(),
  bgDescription: text('bg_description').notNull(),
  buffIds: integer('buff_ids').array(),
  // Array of { Id, Value, IsRatio } objects
  addProp: jsonb('add_prop').notNull(),
  // Array of { Key, Value } number pairs
  activateConsume: jsonb('activate_consume').notNull(),
  attributesDescriptionParams: text('attributes_description_params').array(),
  nodeIcon: text('node_icon').notNull(),
});

/**
 * Rogue character buff rows from BinData/Rogue/roguecharacterbuff.json
 */
export const rawRogueCharacterBuffs = pgTable('raw_rogue_character_buffs', {
  id: integer('id').primaryKey(),
  buffId: bigint('buff_id', { mode: 'number' }).notNull(),
  buffIds: bigint('buff_ids', { mode: 'number' }).array().notNull(),
  affixDesc: text('affix_desc').notNull(),
  affixDescParam: text('affix_desc_param').array().notNull(),
  affixDescSimple: text('affix_desc_simple').notNull(),
  affixTitle: text('affix_title').notNull(),
  affixIcon: text('affix_icon').notNull(),
});

/**
 * Permanent rogue character buff rows from BinData/PermanentRogue/roguerescharacterbuff.json
 */
export const rawRoguePermanentCharacterBuffs = pgTable(
  'raw_rogue_permanent_character_buffs',
  {
    id: integer('id').primaryKey(),
    buffId: bigint('buff_id', { mode: 'number' }).notNull(),
    buffIds: bigint('buff_ids', { mode: 'number' }).array().notNull(),
    affixDesc: text('affix_desc').notNull(),
    affixDescParam: text('affix_desc_param').array().notNull(),
    affixDescSimple: text('affix_desc_simple').notNull(),
    affixTitle: text('affix_title').notNull(),
    affixIcon: text('affix_icon').notNull(),
  },
);

/**
 * Permanent rogue buff pool rows from BinData/PermanentRogue/rogueresbuffpool.json
 */
export const rawRoguePermanentBuffPools = pgTable('raw_rogue_permanent_buff_pools', {
  id: integer('id').primaryKey(),
  buffId: bigint('buff_id', { mode: 'number' }).notNull(),
  perIds: integer('per_ids').array().notNull(),
  effectId: integer('effect_id').notNull(),
  quality: integer('quality').notNull(),
  buffElement: jsonb('buff_element').$type<Array<{ Key: number; Value: number }>>().notNull(),
  buffIcon: text('buff_icon').notNull(),
  buffDesc: text('buff_desc').notNull(),
  buffDescParam: text('buff_desc_param').array().notNull(),
  buffDescSimple: text('buff_desc_simple').notNull(),
  buffName: text('buff_name').notNull(),
});

/**
 * Weekly rogue buff pool rows from BinData/WeeklyRogue/rogueweeklybuffpool.json
 */
export const rawRogueWeeklyBuffPools = pgTable('raw_rogue_weekly_buff_pools', {
  id: integer('id').primaryKey(),
  relatedArtifactId: integer('related_artifact_id').notNull(),
  buffId: bigint('buff_id', { mode: 'number' }).notNull(),
  perIds: integer('per_ids').array().notNull(),
  buffType: integer('buff_type').notNull(),
  buffTriggerTagId: integer('buff_trigger_tag_id').notNull(),
  buffTriggerActionName: text('buff_trigger_action_name').notNull(),
  buffTagId: integer('buff_tag_id').array().notNull(),
  quality: integer('quality').notNull(),
  buffIcon: text('buff_icon').notNull(),
  buttonIcon: text('button_icon').notNull(),
  buffDesc: text('buff_desc').notNull(),
  buffDescParam: text('buff_desc_param').array().notNull(),
  buffDescSimple: text('buff_desc_simple').notNull(),
  buffName: text('buff_name').notNull(),
});

/**
 * Base property stat rows from BinData/property/baseproperty.json.
 * Each row is one property-id + level snapshot.
 * Composite PK on (id, lv).
 */
export const rawBaseProperties = pgTable(
  'raw_base_properties',
  {
    id: integer('id').notNull(),
    lv: integer('lv').notNull(),
    lifeMax: real('life_max').notNull(),
    life: real('life').notNull(),
    sheild: real('sheild').notNull(),
    sheildDamageChange: real('sheild_damage_change').notNull(),
    sheildDamageReduce: real('sheild_damage_reduce').notNull(),
    atk: real('atk').notNull(),
    crit: real('crit').notNull(),
    critDamage: real('crit_damage').notNull(),
    def: real('def').notNull(),
    energyEfficiency: real('energy_efficiency').notNull(),
    cdReduse: real('cd_reduse').notNull(),
    damageChangeNormalSkill: real('damage_change_normal_skill').notNull(),
    damageChange: real('damage_change').notNull(),
    damageReduce: real('damage_reduce').notNull(),
    damageChangeAuto: real('damage_change_auto').notNull(),
    damageChangeCast: real('damage_change_cast').notNull(),
    damageChangeUltra: real('damage_change_ultra').notNull(),
    damageChangeQte: real('damage_change_qte').notNull(),
    damageChangePhantom: real('damage_change_phantom').notNull(),
    damageChangePhys: real('damage_change_phys').notNull(),
    damageChangeElement1: real('damage_change_element_1').notNull(),
    damageChangeElement2: real('damage_change_element_2').notNull(),
    damageChangeElement3: real('damage_change_element_3').notNull(),
    damageChangeElement4: real('damage_change_element_4').notNull(),
    damageChangeElement5: real('damage_change_element_5').notNull(),
    damageChangeElement6: real('damage_change_element_6').notNull(),
    damageResistancePhys: real('damage_resistance_phys').notNull(),
    damageResistanceElement1: real('damage_resistance_element_1').notNull(),
    damageResistanceElement2: real('damage_resistance_element_2').notNull(),
    damageResistanceElement3: real('damage_resistance_element_3').notNull(),
    damageResistanceElement4: real('damage_resistance_element_4').notNull(),
    damageResistanceElement5: real('damage_resistance_element_5').notNull(),
    damageResistanceElement6: real('damage_resistance_element_6').notNull(),
    damageReducePhys: real('damage_reduce_phys').notNull(),
    damageReduceElement1: real('damage_reduce_element_1').notNull(),
    damageReduceElement2: real('damage_reduce_element_2').notNull(),
    damageReduceElement3: real('damage_reduce_element_3').notNull(),
    damageReduceElement4: real('damage_reduce_element_4').notNull(),
    damageReduceElement5: real('damage_reduce_element_5').notNull(),
    damageReduceElement6: real('damage_reduce_element_6').notNull(),
    ignoreDamageResistancePhys: real('ignore_damage_resistance_phys').notNull(),
    ignoreDamageResistanceElement1: real(
      'ignore_damage_resistance_element_1',
    ).notNull(),
    ignoreDamageResistanceElement2: real(
      'ignore_damage_resistance_element_2',
    ).notNull(),
    ignoreDamageResistanceElement3: real(
      'ignore_damage_resistance_element_3',
    ).notNull(),
    ignoreDamageResistanceElement4: real(
      'ignore_damage_resistance_element_4',
    ).notNull(),
    ignoreDamageResistanceElement5: real(
      'ignore_damage_resistance_element_5',
    ).notNull(),
    ignoreDamageResistanceElement6: real(
      'ignore_damage_resistance_element_6',
    ).notNull(),
    ignoreDefRate: real('ignore_def_rate').notNull(),
    autoAttackSpeed: real('auto_attack_speed').notNull(),
    castAttackSpeed: real('cast_attack_speed').notNull(),
    specialDamageChange: real('special_damage_change').notNull(),
    healedChange: real('healed_change').notNull(),
    healChange: real('heal_change').notNull(),
    elementPropertyType: real('element_property_type').notNull(),
    elementPower1: real('element_power_1').notNull(),
    elementPower2: real('element_power_2').notNull(),
    elementPower3: real('element_power_3').notNull(),
    elementPower4: real('element_power_4').notNull(),
    elementPower5: real('element_power_5').notNull(),
    elementPower6: real('element_power_6').notNull(),
    elementEnergyMax: real('element_energy_max').notNull(),
    elementEnergy: real('element_energy').notNull(),
    elementEfficiency: real('element_efficiency').notNull(),
    strengthMax: real('strength_max').notNull(),
    strength: real('strength').notNull(),
    strengthRecover: real('strength_recover').notNull(),
    strengthPunishTime: real('strength_punish_time').notNull(),
    strengthFastSwim: real('strength_fast_swim').notNull(),
    strengthRun: real('strength_run').notNull(),
    strengthClimbJump: real('strength_climb_jump').notNull(),
    strengthFastClimbCost: real('strength_fast_climb_cost').notNull(),
    strengthSwim: real('strength_swim').notNull(),
    strengthGliding: real('strength_gliding').notNull(),
    toughMax: real('tough_max').notNull(),
    tough: real('tough').notNull(),
    toughRecover: real('tough_recover').notNull(),
    toughRecoverDelayTime: real('tough_recover_delay_time').notNull(),
    toughChange: real('tough_change').notNull(),
    toughReduce: real('tough_reduce').notNull(),
    skillToughRatio: real('skill_tough_ratio').notNull(),
    hardnessMax: real('hardness_max').notNull(),
    hardness: real('hardness').notNull(),
    hardnessRecover: real('hardness_recover').notNull(),
    hardnessPunishTime: real('hardness_punish_time').notNull(),
    hardnessChange: real('hardness_change').notNull(),
    hardnessReduce: real('hardness_reduce').notNull(),
    rageMax: real('rage_max').notNull(),
    rage: real('rage').notNull(),
    rageRecover: real('rage_recover').notNull(),
    ragePunishTime: real('rage_punish_time').notNull(),
    rageChange: real('rage_change').notNull(),
    rageReduce: real('rage_reduce').notNull(),
    specialEnergy1Max: real('special_energy_1_max').notNull(),
    specialEnergy1: real('special_energy_1').notNull(),
    specialEnergy2Max: real('special_energy_2_max').notNull(),
    specialEnergy2: real('special_energy_2').notNull(),
    specialEnergy3Max: real('special_energy_3_max').notNull(),
    specialEnergy3: real('special_energy_3').notNull(),
    specialEnergy4Max: real('special_energy_4_max').notNull(),
    specialEnergy4: real('special_energy_4').notNull(),
    specialEnergy5Max: real('special_energy_5_max').notNull(),
    specialEnergy5: real('special_energy_5').notNull(),
    weaknessBuildUpMax: real('weakness_build_up_max').notNull(),
    weaknessBuildUp: real('weakness_build_up').notNull(),
    weaknessMastery: real('weakness_mastery').notNull(),
    weaknessTotalBonus: real('weakness_total_bonus').notNull(),
    breakWeaknessRatio: real('break_weakness_ratio').notNull(),
    weakTime: real('weak_time').notNull(),
    statusBuildUp1Max: real('status_build_up_1_max').notNull(),
    statusBuildUp1: real('status_build_up_1').notNull(),
    statusBuildUp2Max: real('status_build_up_2_max').notNull(),
    statusBuildUp2: real('status_build_up_2').notNull(),
    statusBuildUp3Max: real('status_build_up_3_max').notNull(),
    statusBuildUp3: real('status_build_up_3').notNull(),
    statusBuildUp4Max: real('status_build_up_4_max').notNull(),
    statusBuildUp4: real('status_build_up_4').notNull(),
    statusBuildUp5Max: real('status_build_up_5_max').notNull(),
    statusBuildUp5: real('status_build_up_5').notNull(),
    energyMax: real('energy_max').notNull(),
    energy: real('energy').notNull(),
    mass: real('mass').notNull(),
    gravityScale: real('gravity_scale').notNull(),
    paralysisTimeMax: real('paralysis_time_max').notNull(),
    paralysisTime: real('paralysis_time').notNull(),
    paralysisTimeRecover: real('paralysis_time_recover').notNull(),
    brakingFrictionFactor: real('braking_friction_factor').notNull(),
    speedRatio: real('speed_ratio').notNull(),
  },
  (table) => [primaryKey({ columns: [table.id, table.lv] })],
);

/**
 * Character level growth ratio rows from BinData/property/rolepropertygrowth.json
 */
export const rawRolePropertyGrowth = pgTable('raw_role_property_growth', {
  id: integer('id').primaryKey(),
  level: integer('level').notNull(),
  breachLevel: integer('breach_level').notNull(),
  lifeMaxRatio: real('life_max_ratio').notNull(),
  atkRatio: real('atk_ratio').notNull(),
  defRatio: real('def_ratio').notNull(),
});

/**
 * Skill tree node rows from BinData/skillTree/skilltree.json
 */
export const rawSkillTreeNodes = pgTable('raw_skill_tree_nodes', {
  id: integer('id').primaryKey(),
  nodeIndex: integer('node_index').notNull(),
  nodeGroup: integer('node_group').notNull(),
  parentNodes: integer('parent_nodes').array().notNull(),
  nodeType: integer('node_type').notNull(),
  coordinate: integer('coordinate').notNull(),
  condition: integer('condition').array().notNull(),
  skillId: integer('skill_id').notNull(),
  skillBranchIds: integer('skill_branch_ids').array().notNull(),
  propertyNodeTitle: text('property_node_title').notNull(),
  propertyNodeDescribe: text('property_node_describe').notNull(),
  propertyNodeParam: text('property_node_param').array().notNull(),
  propertyNodeIcon: text('property_node_icon').notNull(),
  // Array of { Id, Value, IsRatio } objects
  property: jsonb('property').notNull(),
  // Array of { Key, Value } objects
  consume: jsonb('consume').notNull(),
  unlockCondition: integer('unlock_condition').notNull(),
});

/**
 * Character metadata rows from BinData/role/roleinfo.json
 */
export const rawRoleInfo = pgTable('raw_role_info', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  nickName: text('nick_name').notNull(),
  introduction: text('introduction').notNull(),
  roleHeadIconCircle: text('role_head_icon_circle').notNull(),
  roleHeadIconLarge: text('role_head_icon_large').notNull(),
  roleHeadIconBig: text('role_head_icon_big').notNull(),
  roleHeadIcon: text('role_head_icon').notNull(),
  roleStand: text('role_stand').notNull(),
  rolePortrait: text('role_portrait').notNull(),
  icon: text('icon').notNull(),
  formationRoleCard: text('formation_role_card').notNull(),
  formationSpineAtlas: text('formation_spine_atlas').notNull(),
  formationSpineSkeletonData: text('formation_spine_skeleton_data').notNull(),
  card: text('card').notNull(),
  characterVoice: text('character_voice').notNull(),
  attributesDescription: text('attributes_description').notNull(),
  uiScenePerformanceAbp: text('ui_scene_performance_abp').notNull(),
  skillDaPath: text('skill_da_path').notNull(),
  skillLockDaPath: text('skill_lock_da_path').notNull(),
  skillEffectDa: text('skill_effect_da').notNull(),
  cameraConfig: text('camera_config').notNull(),
  roleBody: text('role_body').notNull(),
  footStepState: text('foot_step_state').notNull(),
  obtainedShowDescription: text('obtained_show_description').notNull(),
  qualityId: integer('quality_id').notNull(),
  roleType: integer('role_type').notNull(),
  parentId: integer('parent_id').notNull(),
  priority: integer('priority').notNull(),
  propertyId: integer('property_id').notNull(),
  elementId: integer('element_id').notNull(),
  skinId: integer('skin_id').notNull(),
  weaponType: integer('weapon_type').notNull(),
  initWeaponItemId: integer('init_weapon_item_id').notNull(),
  maxLevel: integer('max_level').notNull(),
  levelConsumeId: integer('level_consume_id').notNull(),
  breachId: integer('breach_id').notNull(),
  breachModel: integer('breach_model').notNull(),
  resonanceId: integer('resonance_id').notNull(),
  skillId: integer('skill_id').notNull(),
  resonantChainGroupId: integer('resonant_chain_group_id').notNull(),
  lockOnDefaultId: integer('lock_on_default_id').notNull(),
  lockOnLookOnId: integer('lock_on_look_on_id').notNull(),
  entityProperty: integer('entity_property').notNull(),
  numLimit: integer('num_limit').notNull(),
  skillTreeGroupId: integer('skill_tree_group_id').notNull(),
  defaultSkillBranchId: integer('default_skill_branch_id').notNull(),
  specialEnergyBarId: integer('special_energy_bar_id').notNull(),
  partyId: integer('party_id').notNull(),
  meshId: integer('mesh_id').notNull(),
  itemQualityId: integer('item_quality_id').notNull(),
  cameraFloatHeight: real('camera_float_height').notNull(),
  uiMeshId: integer('ui_mesh_id').notNull(),
  roleGuide: integer('role_guide').notNull(),
  redDotDisableRule: integer('red_dot_disable_rule').notNull(),
  trialRole: integer('trial_role').notNull(),
  isTrial: boolean('is_trial').notNull(),
  intervene: boolean('intervene').notNull(),
  showInBag: boolean('show_in_bag').notNull(),
  isShow: boolean('is_show').notNull(),
  hideHuLu: boolean('hide_hu_lu').notNull(),
  isAim: boolean('is_aim').notNull(),
  enableOperateSelfBgm: boolean('enable_operate_self_bgm').notNull(),
  tag: integer('tag').array().notNull(),
  showProperty: integer('show_property').array().notNull(),
  skillBranchIds: integer('skill_branch_ids').array().notNull(),
  // Array of { Key, Value } number pairs
  exchangeConsume: jsonb('exchange_consume').notNull(),
  // Array of { Key, Value } number pairs
  spilloverItem: jsonb('spillover_item').notNull(),
  skinDamage: text('skin_damage').array().notNull(),
  weaponScale: real('weapon_scale').array().notNull(),
});

/**
 * Weapon level growth curve rows from BinData/property/weaponpropertygrowth.json
 */
export const rawWeaponGrowth = pgTable('raw_weapon_growth', {
  id: integer('id').primaryKey(),
  curveId: integer('curve_id').notNull(),
  level: integer('level').notNull(),
  breachLevel: integer('breach_level').notNull(),
  curveValue: real('curve_value').notNull(),
});

/**
 * Weapon refinement/resonance rows from BinData/weapon/weaponreson.json
 */
export const rawWeaponReson = pgTable('raw_weapon_reson', {
  id: integer('id').primaryKey(),
  resonId: integer('reson_id').notNull(),
  level: integer('level').notNull(),
  name: text('name').notNull(),
  effect: integer('effect').array().notNull(),
  consume: integer('consume').notNull(),
  goldConsume: integer('gold_consume').notNull(),
  materialPlaceType: integer('material_place_type').notNull(),
  // Array of unknown
  alternativeConsume: jsonb('alternative_consume').notNull(),
});

/**
 * Weapon definition rows from BinData/weapon/weaponconf.json
 */
export const rawWeaponConfig = pgTable('raw_weapon_config', {
  itemId: integer('item_id').primaryKey(),
  isShow: boolean('is_show').notNull(),
  weaponName: text('weapon_name').notNull(),
  qualityId: integer('quality_id').notNull(),
  weaponType: integer('weapon_type').notNull(),
  modelId: integer('model_id').notNull(),
  transformId: integer('transform_id').notNull(),
  models: integer('models').array().notNull(),
  modelsIndex: integer('models_index').array().notNull(),
  resonLevelLimit: integer('reson_level_limit').notNull(),
  // { Id, Value, IsRatio } object
  firstPropId: jsonb('first_prop_id').notNull(),
  firstCurve: integer('first_curve').notNull(),
  // { Id, Value, IsRatio } object
  secondPropId: jsonb('second_prop_id').notNull(),
  secondCurve: integer('second_curve').notNull(),
  resonId: integer('reson_id').notNull(),
  levelId: integer('level_id').notNull(),
  breachId: integer('breach_id').notNull(),
  standAnim: text('stand_anim').array().notNull(),
  desc: text('desc').notNull(),
  // Array of { ArrayString: string[] } objects
  descParams: jsonb('desc_params').notNull(),
  bgDescription: text('bg_description').notNull(),
  attributesDescription: text('attributes_description').notNull(),
  icon: text('icon').notNull(),
  resonanceIcon: text('resonance_icon').notNull(),
  iconMiddle: text('icon_middle').notNull(),
  iconSmall: text('icon_small').notNull(),
  mesh: text('mesh').notNull(),
  numLimit: integer('num_limit').notNull(),
  maxCapcity: integer('max_capcity').notNull(),
  hiddenTime: real('hidden_time').notNull(),
  destructible: boolean('destructible').notNull(),
  showInBag: boolean('show_in_bag').notNull(),
  sortIndex: integer('sort_index').notNull(),
  typeDescription: text('type_description').notNull(),
  itemAccess: integer('item_access').array().notNull(),
  obtainedShow: integer('obtained_show').notNull(),
  obtainedShowDescription: text('obtained_show_description').notNull(),
  handBookTrialId: integer('hand_book_trial_id').notNull(),
  redDotDisableRule: integer('red_dot_disable_rule').notNull(),
});

/**
 * Echo set group rows from BinData/phantom/phantomfettergroup.json
 */
export const rawPhantomFetterGroups = pgTable('raw_phantom_fetter_groups', {
  id: integer('id').primaryKey(),
  // Array of { Key, Value } number pairs mapping thresholds → fetter ids
  fetterMap: jsonb('fetter_map').notNull(),
  fetterType: integer('fetter_type').notNull(),
  fetterGroupName: text('fetter_group_name').notNull(),
  accessId: integer('access_id').notNull(),
  fetterGroupDesc: text('fetter_group_desc').notNull(),
  sortId: integer('sort_id').notNull(),
  fetterElementColor: text('fetter_element_color').notNull(),
  fetterElementPath: text('fetter_element_path').notNull(),
  aimModelElementPath: text('aim_model_element_path').notNull(),
});

/**
 * Echo set bonus rows from BinData/phantom/phantomfetter.json
 */
export const rawPhantomFetters = pgTable('raw_phantom_fetters', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  buffIds: integer('buff_ids').array().notNull(),
  // Array of { Id, Value, IsRatio } objects
  addProp: jsonb('add_prop').notNull(),
  effectDescription: text('effect_description').notNull(),
  fetterIcon: text('fetter_icon').notNull(),
  simplyEffectDesc: text('simply_effect_desc').notNull(),
  effectDescriptionParam: text('effect_description_param').array().notNull(),
  effectDefineDescription: text('effect_define_description').notNull(),
  priority: integer('priority').notNull(),
});

/**
 * Echo item rows from BinData/phantom/phantomitem.json
 */
export const rawPhantomItems = pgTable('raw_phantom_items', {
  itemId: integer('item_id').primaryKey(),
  monsterId: integer('monster_id').notNull(),
  parentMonsterId: integer('parent_monster_id').notNull(),
  monsterName: text('monster_name').notNull(),
  elementType: integer('element_type').array().notNull(),
  // { RandGroupId, RandNum } object
  mainProp: jsonb('main_prop').notNull(),
  levelUpGroupId: integer('level_up_group_id').notNull(),
  skillId: integer('skill_id').notNull(),
  calabashBuffs: integer('calabash_buffs').array().notNull(),
  rarity: integer('rarity').notNull(),
  meshId: integer('mesh_id').notNull(),
  zoom: real('zoom').array().notNull(),
  location: real('location').array().notNull(),
  rotator: real('rotator').array().notNull(),
  standAnim: text('stand_anim').notNull(),
  typeDescription: text('type_description').notNull(),
  attributesDescription: text('attributes_description').notNull(),
  icon: text('icon').notNull(),
  iconMiddle: text('icon_middle').notNull(),
  iconSmall: text('icon_small').notNull(),
  skillIcon: text('skill_icon').notNull(),
  qualityId: integer('quality_id').notNull(),
  maxCapcity: integer('max_capcity').notNull(),
  destructible: boolean('destructible').notNull(),
  showInBag: boolean('show_in_bag').notNull(),
  sortIndex: integer('sort_index').notNull(),
  numLimit: integer('num_limit').notNull(),
  itemAccess: integer('item_access').array().notNull(),
  obtainedShow: integer('obtained_show').notNull(),
  obtainedShowDescription: text('obtained_show_description').notNull(),
  phantomType: integer('phantom_type').notNull(),
  fetterGroup: integer('fetter_group').array().notNull(),
  mesh: text('mesh').notNull(),
  redDotDisableRule: integer('red_dot_disable_rule').notNull(),
});

/**
 * Echo skill rows from BinData/phantom/phantomskill.json
 */
export const rawPhantomSkills = pgTable('raw_phantom_skills', {
  id: integer('id').primaryKey(),
  phantomSkillId: integer('phantom_skill_id').notNull(),
  buffIds: integer('buff_ids').array().notNull(),
  settleIds: integer('settle_ids').array().notNull(),
  buffEffects: integer('buff_effects').array().notNull(),
  chargeEfficiency: real('charge_efficiency').notNull(),
  skillGroupId: integer('skill_group_id').notNull(),
  skillCd: real('skill_cd').notNull(),
  descriptionEx: text('description_ex').notNull(),
  simplyDescription: text('simply_description').notNull(),
  ifCounterSkill: boolean('if_counter_skill').notNull(),
  curLevelDescriptionEx: text('cur_level_description_ex').array().notNull(),
  // Array of { ArrayString: string[] } objects
  levelDescStrArray: jsonb('level_desc_str_array').notNull(),
  battleViewIcon: text('battle_view_icon').notNull(),
  specialBattleViewIcon: text('special_battle_view_icon').notNull(),
});

/**
 * Raw montage asset rows from dvsheng/wuwa-character-data {Character}/CommonAnim/AM*.json
 */
export const rawMontages = pgTable('raw_montages', {
  entityId: integer('entity_id').notNull(),
  characterName: text('character_name').notNull(),
  Name: text('Name').notNull(),
  SequenceLength: real('SequenceLength'),
  Notifies: jsonb('Notifies'),
  data: jsonb('data').notNull(),
}, (table) => [primaryKey({ columns: [table.characterName, table.Name] })]);

/**
 * Raw DT_SkillInfo asset rows from dvsheng/wuwa-character-data {Character}/Data/DT_SkillInfo.json
 */
export const rawSkillInfoAssets = pgTable('raw_skill_info_assets', {
  characterName: text('character_name').primaryKey(),
  fileName: text('file_name').notNull(),
  Rows: jsonb('Rows'),
  data: jsonb('data').notNull(),
});

/**
 * Raw DT_ReBulletDataMain rows from dvsheng/wuwa-character-data {Character}/Data/DT_ReBulletDataMain*.json
 */
export const rawReBulletDataMainRows = pgTable(
  'raw_re_bullet_data_main_rows',
  {
    entityId: integer('entity_id').notNull(),
    bulletId: integer('bullet_id').notNull(),
    fileName: text('file_name').notNull(),
    bulletName: text('bullet_name'),
    hitsPerTarget: integer('hits_per_target'),
    totalHitCap: integer('total_hit_cap'),
    hitInterval: real('hit_interval'),
    baseSettings: jsonb('base_settings').$type<RawReBulletDataBaseSettings>(),
    rowData: jsonb('row_data').$type<RawReBulletDataRow>().notNull(),
  },
  (table) => [primaryKey({ columns: [table.entityId, table.bulletId, table.fileName] })],
);

export type SkillV2Source =
  | 'character_skill'
  | 'resonant_chain'
  | 'echo_set_bonus'
  | 'weapon_reson';

// ============================================================================
// Type Exports
// ============================================================================

export type RawSkill = typeof rawSkills.$inferSelect;
export type NewRawSkill = typeof rawSkills.$inferInsert;

export type RawDamage = typeof rawDamage.$inferSelect;
export type NewRawDamage = typeof rawDamage.$inferInsert;

export type RawSkillDescription = typeof rawSkillDescriptions.$inferSelect;
export type NewRawSkillDescription = typeof rawSkillDescriptions.$inferInsert;

export type RawSkillAttribute = typeof rawSkillAttributes.$inferSelect;
export type NewRawSkillAttribute = typeof rawSkillAttributes.$inferInsert;

export type RawBuff = typeof rawBuffs.$inferSelect;
export type NewRawBuff = typeof rawBuffs.$inferInsert;

export type RawChain = typeof rawChains.$inferSelect;
export type NewRawChain = typeof rawChains.$inferInsert;

export type RawRogueCharacterBuff = typeof rawRogueCharacterBuffs.$inferSelect;
export type NewRawRogueCharacterBuff = typeof rawRogueCharacterBuffs.$inferInsert;

export type RawRoguePermanentCharacterBuff =
  typeof rawRoguePermanentCharacterBuffs.$inferSelect;
export type NewRawRoguePermanentCharacterBuff =
  typeof rawRoguePermanentCharacterBuffs.$inferInsert;

export type RawRoguePermanentBuffPool =
  typeof rawRoguePermanentBuffPools.$inferSelect;
export type NewRawRoguePermanentBuffPool =
  typeof rawRoguePermanentBuffPools.$inferInsert;

export type RawRogueWeeklyBuffPool = typeof rawRogueWeeklyBuffPools.$inferSelect;
export type NewRawRogueWeeklyBuffPool =
  typeof rawRogueWeeklyBuffPools.$inferInsert;

export type RawBaseProperty = typeof rawBaseProperties.$inferSelect;
export type NewRawBaseProperty = typeof rawBaseProperties.$inferInsert;

export type RawRolePropertyGrowth = typeof rawRolePropertyGrowth.$inferSelect;
export type NewRawRolePropertyGrowth = typeof rawRolePropertyGrowth.$inferInsert;

export type RawSkillTreeNode = typeof rawSkillTreeNodes.$inferSelect;
export type NewRawSkillTreeNode = typeof rawSkillTreeNodes.$inferInsert;

export type RawRoleInfo = typeof rawRoleInfo.$inferSelect;
export type NewRawRoleInfo = typeof rawRoleInfo.$inferInsert;

export type RawWeaponGrowth = typeof rawWeaponGrowth.$inferSelect;
export type NewRawWeaponGrowth = typeof rawWeaponGrowth.$inferInsert;

export type RawWeaponReson = typeof rawWeaponReson.$inferSelect;
export type NewRawWeaponReson = typeof rawWeaponReson.$inferInsert;

export type RawWeaponConfig = typeof rawWeaponConfig.$inferSelect;
export type NewRawWeaponConfig = typeof rawWeaponConfig.$inferInsert;

export type RawPhantomFetterGroup = typeof rawPhantomFetterGroups.$inferSelect;
export type NewRawPhantomFetterGroup = typeof rawPhantomFetterGroups.$inferInsert;

export type RawPhantomFetter = typeof rawPhantomFetters.$inferSelect;
export type NewRawPhantomFetter = typeof rawPhantomFetters.$inferInsert;

export type RawPhantomItem = typeof rawPhantomItems.$inferSelect;
export type NewRawPhantomItem = typeof rawPhantomItems.$inferInsert;

export type RawPhantomSkill = typeof rawPhantomSkills.$inferSelect;
export type NewRawPhantomSkill = typeof rawPhantomSkills.$inferInsert;

export type RawMontage = typeof rawMontages.$inferSelect;
export type NewRawMontage = typeof rawMontages.$inferInsert;

export type RawSkillInfoAsset = typeof rawSkillInfoAssets.$inferSelect;
export type NewRawSkillInfoAsset = typeof rawSkillInfoAssets.$inferInsert;

export type RawReBulletDataMainRow = typeof rawReBulletDataMainRows.$inferSelect;
export type NewRawReBulletDataMainRow = typeof rawReBulletDataMainRows.$inferInsert;

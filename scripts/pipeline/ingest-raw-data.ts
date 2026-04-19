/**
 * Ingests raw GitHub game data directly into the database with no transformation.
 *
 * Run with:
 *   tsx --env-file=.env scripts/pipeline/ingest-raw-data.ts
 */

import { pathToFileURL } from 'node:url';

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  rawBaseProperties,
  rawBuffs,
  rawChains,
  rawDamage,
  rawMontages,
  rawPhantomFetterGroups,
  rawPhantomFetters,
  rawPhantomItems,
  rawPhantomSkills,
  rawReBulletDataMainRows,
  rawRogueCharacterBuffs,
  rawRoguePermanentBuffPools,
  rawRoguePermanentCharacterBuffs,
  rawRogueWeeklyBuffPools,
  rawRoleInfo,
  rawRolePropertyGrowth,
  rawSkillAttributes,
  rawSkillDescriptions,
  rawSkillInfoAssets,
  rawSkillInfoRows,
  rawSkillTreeNodes,
  rawSkills,
  rawWeaponConfig,
  rawWeaponGrowth,
  rawWeaponReson,
} from '../../src/db/raw-schema';

import {
  fetchAndValidateJson,
  fetchAndValidateWuwaCharacterDataJson,
  listWuwaCharacterMontageFiles,
  listWuwaReBulletDataMainFiles,
  listWuwaSkillInfoAssetFiles,
  refreshWuwaCharacterDataSnapshot,
} from './github-data';
import {
  BasePropertyArraySchema,
  BuffArraySchema,
  ChainArraySchema,
  DamageArraySchema,
  PhantomFetterArraySchema,
  PhantomFetterGroupArraySchema,
  PhantomItemArraySchema,
  PhantomSkillArraySchema,
  RawMontageAssetArraySchema,
  RawReBulletDataMainFileArraySchema,
  RawSkillInfoAssetFileArraySchema,
  RawSkillInfoRowDataFileArraySchema,
  RogueCharacterBuffArraySchema,
  RoguePermanentBuffPoolArraySchema,
  RoguePermanentCharacterBuffArraySchema,
  RogueWeeklyBuffPoolArraySchema,
  RoleInfoArraySchema,
  RolePropertyGrowthArraySchema,
  SkillArraySchema,
  SkillDescriptionArraySchema,
  SkillTreeNodeArraySchema,
  WeaponConfigArraySchema,
  WeaponGrowthArraySchema,
  WeaponResonArraySchema,
} from './github-data.schemas';
import {
  toRawMontageRow,
  toRawReBulletDataMainRows,
  toRawSkillInfoAssetRow,
  toRawSkillInfoRows,
} from './montage-assets';
import { getTextResolver } from './text';

// ============================================================================
// DB client (script-local, not the app client which pre-warms via top-level await)
// ============================================================================

function createClient() {
  const url = process.env.DATABASE_URL;
  if (url) return postgres(url);
  throw new Error('Set DATABASE_URL in your .env file');
}

const client = createClient();
const database = drizzle(client);

// ============================================================================
// Batch insert helper — Postgres limits ~65k params per query
// ============================================================================

const BATCH_SIZE = 500;

type TextResolver = (key: string) => string;

async function batchInsert<T extends Record<string, unknown>>(
  table: Parameters<typeof database.insert>[0],
  rows: Array<T>,
  onConflict: (
    qb: ReturnType<ReturnType<typeof database.insert>['values']>,
  ) => Promise<unknown>,
  label: string,
) {
  let inserted = 0;
  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const batch = rows.slice(index, index + BATCH_SIZE);
    const qb = database.insert(table).values(batch as never);
    await onConflict(qb);
    inserted += batch.length;
  }
  console.log(`  ✓ ${label}: ${inserted} rows`);
}

// ============================================================================
// Ingest functions
// ============================================================================

async function ingestSkills(t: TextResolver) {
  const raw = await fetchAndValidateJson('BinData/skill/skill.json', SkillArraySchema);
  const rows = raw.map((r) => ({
    id: r.Id,
    skillGroupId: r.SkillGroupId,
    skillType: r.SkillType,
    upgradeCondition: r.UpgradeCondition,
    upgradeSkillId: r.UpgradeSkillId,
    skillName: t(r.SkillName),
    skillLevelGroupId: r.SkillLevelGroupId,
    leftSkillEffect: r.LeftSkillEffect,
    maxSkillLevel: r.MaxSkillLevel,
    skillInfoList: r.SkillInfoList,
    buffList: r.BuffList,
    damageList: r.DamageList,
    icon: r.Icon,
    effectSkillPath: r.EffectSkillPath,
    sortIndex: r.SortIndex,
    skillDescribe: t(r.SkillDescribe),
    skillDetailNum: r.SkillDetailNum?.map((value) => t(value)),
    multiSkillDescribe: t(r.MultiSkillDescribe),
    multiSkillDetailNum: r.MultiSkillDetailNum.map((value) => t(value)),
    skillResume: t(r.SkillResume),
    skillResumeNum: r.SkillResumeNum.map((value) => t(value)),
    skillTagList: r.SkillTagList,
  }));

  await batchInsert(rawSkills, rows, (qb) => qb.onConflictDoNothing(), 'raw_skills');
}

async function ingestDamage() {
  const raw = await fetchAndValidateJson(
    'BinData/damage/damage.json',
    DamageArraySchema,
  );
  const rows = raw.map((r) => ({
    id: r.Id,
    condition: r.Condition,
    constVariables: r.ConstVariables,
    calculateType: r.CalculateType,
    element: r.Element,
    damageTextType: r.DamageTextType,
    damageTextAreaId: r.DamageTextAreaId,
    payloadId: r.PayloadId,
    type: r.Type,
    subType: r.SubType,
    smashType: r.SmashType,
    cureBaseValue: r.CureBaseValue,
    relatedProperty: r.RelatedProperty,
    rateLv: r.RateLv,
    hardnessLv: r.HardnessLv,
    toughLv: r.ToughLv,
    energy: r.Energy,
    specialEnergy1: r.SpecialEnergy1,
    specialEnergy2: r.SpecialEnergy2,
    specialEnergy3: r.SpecialEnergy3,
    specialEnergy4: r.SpecialEnergy4,
    specialEnergy5: r.SpecialEnergy5,
    formulaType: r.FormulaType,
    formulaParam1: r.FormulaParam1,
    formulaParam2: r.FormulaParam2,
    formulaParam3: r.FormulaParam3,
    formulaParam4: r.FormulaParam4,
    formulaParam5: r.FormulaParam5,
    formulaParam6: r.FormulaParam6,
    formulaParam7: r.FormulaParam7,
    formulaParam8: r.FormulaParam8,
    formulaParam9: r.FormulaParam9,
    formulaParam10: r.FormulaParam10,
    fluctuationLower: r.FluctuationLower,
    fluctuationUpper: r.FluctuationUpper,
    elementPowerType: r.ElementPowerType,
    elementPower: r.ElementPower,
    weaknessLvl: r.WeaknessLvl,
    weaknessRatio: r.WeaknessRatio,
    specialWeaknessDamageRatio: r.SpecialWeaknessDamageRatio,
    immuneType: r.ImmuneType,
    percent0: r.Percent0,
    percent1: r.Percent1,
  }));
  await batchInsert(rawDamage, rows, (qb) => qb.onConflictDoNothing(), 'raw_damage');
}

async function ingestSkillDescriptions(t: TextResolver) {
  const raw = await fetchAndValidateJson(
    'BinData/skill/skilldescription.json',
    SkillDescriptionArraySchema,
  );
  const rows = raw.map((r) => ({
    id: r.Id,
    skillLevelGroupId: r.SkillLevelGroupId,
    attributeName: t(r.AttributeName),
    skillDetailNum: r.SkillDetailNum,
    description: t(r.Description),
    order: r.Order,
  }));
  await batchInsert(
    rawSkillDescriptions,
    rows,
    (qb) => qb.onConflictDoNothing(),
    'raw_skill_descriptions',
  );
}

async function ingestSkillAttributes(t: TextResolver) {
  const raw = await fetchAndValidateJson(
    'BinData/skill/skilldescription.json',
    SkillDescriptionArraySchema,
  );
  const rows = raw.flatMap((r) => {
    const values = r.SkillDetailNum?.[0]?.ArrayString;
    if (!values || values.length === 0) {
      return [];
    }

    return [
      {
        id: r.Id,
        skillLevelGroupId: r.SkillLevelGroupId,
        attributeName: t(r.AttributeName),
        values,
        description: r.Description === '' ? undefined : t(r.Description),
        order: r.Order,
      },
    ];
  });
  await batchInsert(
    rawSkillAttributes,
    rows,
    (qb) => qb.onConflictDoNothing(),
    'raw_skill_attributes',
  );
}

async function ingestBuffs(t: TextResolver) {
  const raw = await fetchAndValidateJson('BinData/buff/buff.json', BuffArraySchema);
  const rows = raw.map((r) => ({
    id: r.Id,
    geDesc: t(r.GeDesc),
    durationPolicy: r.DurationPolicy,
    formationPolicy: r.FormationPolicy,
    probability: r.Probability,
    period: r.Period,
    periodicInhibitionPolicy: r.PeriodicInhibitionPolicy,
    gameAttributeId: r.GameAttributeID,
    stackingType: r.StackingType,
    defaultStackCount: r.DefaultStackCount,
    stackAppendCount: r.StackAppendCount,
    stackLimitCount: r.StackLimitCount,
    stackDurationRefreshPolicy: r.StackDurationRefreshPolicy,
    stackPeriodResetPolicy: r.StackPeriodResetPolicy,
    stackExpirationRemoveNumber: r.StackExpirationRemoveNumber,
    extraEffectId: r.ExtraEffectID,
    extraEffectRemoveStackNum: r.ExtraEffectRemoveStackNum,
    extraEffectReqSetting: r.ExtraEffectReqSetting,
    bDurationAffectedByBulletTime: r.bDurationAffectedByBulletTime,
    bExecutePeriodicEffectOnApplication: r.bExecutePeriodicEffectOnApplication,
    bDenyOverflowApplication: r.bDenyOverflowApplication,
    bClearStackOnOverflow: r.bClearStackOnOverflow,
    bOnlyLocalAdd: r.bOnlyLocalAdd,
    deadRemove: r.DeadRemove,
    bRequireModifierSuccessToTriggerCues: r.bRequireModifierSuccessToTriggerCues,
    bSuppressStackingCues: r.bSuppressStackingCues,
    durationCalculationPolicy: r.DurationCalculationPolicy,
    durationMagnitude: r.DurationMagnitude,
    durationMagnitude2: r.DurationMagnitude2,
    calculationPolicy: r.CalculationPolicy,
    modifierMagnitude: r.ModifierMagnitude,
    modifierMagnitude2: r.ModifierMagnitude2,
    buffAction: r.BuffAction,
    ongoingTagRequirements: r.OngoingTagRequirements,
    ongoingTagIgnores: r.OngoingTagIgnores,
    applicationTagRequirements: r.ApplicationTagRequirements,
    applicationTagIgnores: r.ApplicationTagIgnores,
    applicationSourceTagRequirements: r.ApplicationSourceTagRequirements,
    applicationSourceTagIgnores: r.ApplicationSourceTagIgnores,
    removalTagRequirements: r.RemovalTagRequirements,
    removalTagIgnores: r.RemovalTagIgnores,
    grantedTags: r.GrantedTags,
    grantedApplicationImmunityTags: r.GrantedApplicationImmunityTags,
    grantedApplicationImmunityTagIgnores: r.GrantedApplicationImmunityTagIgnores,
    extraEffectRequirements: r.ExtraEffectRequirements,
    extraEffectReqPara: r.ExtraEffectReqPara,
    extraEffectProbability: r.ExtraEffectProbability,
    extraEffectCd: r.ExtraEffectCD,
    extraEffectParameters: r.ExtraEffectParameters,
    extraEffectParametersGrow1: r.ExtraEffectParametersGrow1,
    extraEffectParametersGrow2: r.ExtraEffectParametersGrow2,
    gameplayCueIds: r.GameplayCueIds,
    overflowEffects: r.OverflowEffects,
    prematureExpirationEffects: r.PrematureExpirationEffects,
    routineExpirationEffects: r.RoutineExpirationEffects,
    relatedExtraEffectBuffId: r.RelatedExtraEffectBuffId,
    removeBuffWithTags: r.RemoveBuffWithTags,
    tagLogic: r.TagLogic,
  }));
  await batchInsert(rawBuffs, rows, (qb) => qb.onConflictDoNothing(), 'raw_buffs');
}

async function ingestChains(t: TextResolver) {
  const raw = await fetchAndValidateJson(
    'BinData/resonate_chain/resonantchain.json',
    ChainArraySchema,
  );
  const rows = raw.map((r) => ({
    id: r.Id,
    groupId: r.GroupId,
    groupIndex: r.GroupIndex,
    nodeType: r.NodeType,
    nodeIndex: t(r.NodeIndex),
    nodeName: t(r.NodeName),
    attributesDescription: t(r.AttributesDescription),
    bgDescription: t(r.BgDescription),
    buffIds: r.BuffIds,
    addProp: r.AddProp,
    activateConsume: r.ActivateConsume,
    attributesDescriptionParams: r.AttributesDescriptionParams?.map((value) =>
      t(value),
    ),
    nodeIcon: r.NodeIcon,
  }));
  await batchInsert(rawChains, rows, (qb) => qb.onConflictDoNothing(), 'raw_chains');
}

async function ingestRogueCharacterBuffs(t: TextResolver) {
  const raw = await fetchAndValidateJson(
    'BinData/Rogue/roguecharacterbuff.json',
    RogueCharacterBuffArraySchema,
  );
  const rows = raw.map((row) => ({
    id: row.Id,
    buffId: row.BuffId,
    buffIds: row.BuffIds,
    affixDesc: t(row.AffixDesc),
    affixDescParam: row.AffixDescParam.map((value) => t(value)),
    affixDescSimple: t(row.AffixDescSimple),
    affixTitle: t(row.AffixTitle),
    affixIcon: row.AffixIcon,
  }));
  await batchInsert(
    rawRogueCharacterBuffs,
    rows,
    (qb) => qb.onConflictDoNothing(),
    'raw_rogue_character_buffs',
  );
}

async function ingestRoguePermanentCharacterBuffs(t: TextResolver) {
  const raw = await fetchAndValidateJson(
    'BinData/PermanentRogue/roguerescharacterbuff.json',
    RoguePermanentCharacterBuffArraySchema,
  );
  const rows = raw.map((row) => ({
    id: row.Id,
    buffId: row.BuffId,
    buffIds: row.BuffIds,
    affixDesc: t(row.AffixDesc),
    affixDescParam: row.AffixDescParam.map((value) => t(value)),
    affixDescSimple: t(row.AffixDescSimple),
    affixTitle: t(row.AffixTitle),
    affixIcon: row.AffixIcon,
  }));
  await batchInsert(
    rawRoguePermanentCharacterBuffs,
    rows,
    (qb) => qb.onConflictDoNothing(),
    'raw_rogue_permanent_character_buffs',
  );
}

async function ingestRoguePermanentBuffPools(t: TextResolver) {
  const raw = await fetchAndValidateJson(
    'BinData/PermanentRogue/rogueresbuffpool.json',
    RoguePermanentBuffPoolArraySchema,
  );
  const rows = raw.map((row) => ({
    id: row.Id,
    buffId: row.BuffId,
    perIds: row.PerIds,
    effectId: row.EffectId,
    quality: row.Quality,
    buffElement: row.BuffElement,
    buffIcon: row.BuffIcon,
    buffDesc: t(row.BuffDesc),
    buffDescParam: row.BuffDescParam.map((value) => t(value)),
    buffDescSimple: t(row.BuffDescSimple),
    buffName: t(row.BuffName),
  }));
  await batchInsert(
    rawRoguePermanentBuffPools,
    rows,
    (qb) => qb.onConflictDoNothing(),
    'raw_rogue_permanent_buff_pools',
  );
}

async function ingestRogueWeeklyBuffPools(t: TextResolver) {
  const raw = await fetchAndValidateJson(
    'BinData/WeeklyRogue/rogueweeklybuffpool.json',
    RogueWeeklyBuffPoolArraySchema,
  );
  const rows = raw.map((row) => ({
    id: row.Id,
    relatedArtifactId: row.RelatedArtifactId,
    buffId: row.BuffId,
    perIds: row.PerIds,
    buffType: row.BuffType,
    buffTriggerTagId: row.BuffTriggerTagId,
    buffTriggerActionName: row.BuffTriggerActionName,
    buffTagId: row.BuffTagId,
    quality: row.Quality,
    buffIcon: row.BuffIcon,
    buttonIcon: row.ButtonIcon,
    buffDesc: t(row.BuffDesc),
    buffDescParam: row.BuffDescParam.map((value) => t(value)),
    buffDescSimple: t(row.BuffDescSimple),
    buffName: t(row.BuffName),
  }));
  await batchInsert(
    rawRogueWeeklyBuffPools,
    rows,
    (qb) => qb.onConflictDoNothing(),
    'raw_rogue_weekly_buff_pools',
  );
}

async function ingestBaseProperties() {
  const raw = await fetchAndValidateJson(
    'BinData/property/baseproperty.json',
    BasePropertyArraySchema,
  );
  const rows = raw.map((r) => ({
    id: r.Id,
    lv: r.Lv,
    lifeMax: r.LifeMax,
    life: r.Life,
    sheild: r.Sheild,
    sheildDamageChange: r.SheildDamageChange,
    sheildDamageReduce: r.SheildDamageReduce,
    atk: r.Atk,
    crit: r.Crit,
    critDamage: r.CritDamage,
    def: r.Def,
    energyEfficiency: r.EnergyEfficiency,
    cdReduse: r.CdReduse,
    damageChangeNormalSkill: r.DamageChangeNormalSkill,
    damageChange: r.DamageChange,
    damageReduce: r.DamageReduce,
    damageChangeAuto: r.DamageChangeAuto,
    damageChangeCast: r.DamageChangeCast,
    damageChangeUltra: r.DamageChangeUltra,
    damageChangeQte: r.DamageChangeQte,
    damageChangePhantom: r.DamageChangePhantom,
    damageChangePhys: r.DamageChangePhys,
    damageChangeElement1: r.DamageChangeElement1,
    damageChangeElement2: r.DamageChangeElement2,
    damageChangeElement3: r.DamageChangeElement3,
    damageChangeElement4: r.DamageChangeElement4,
    damageChangeElement5: r.DamageChangeElement5,
    damageChangeElement6: r.DamageChangeElement6,
    damageResistancePhys: r.DamageResistancePhys,
    damageResistanceElement1: r.DamageResistanceElement1,
    damageResistanceElement2: r.DamageResistanceElement2,
    damageResistanceElement3: r.DamageResistanceElement3,
    damageResistanceElement4: r.DamageResistanceElement4,
    damageResistanceElement5: r.DamageResistanceElement5,
    damageResistanceElement6: r.DamageResistanceElement6,
    damageReducePhys: r.DamageReducePhys,
    damageReduceElement1: r.DamageReduceElement1,
    damageReduceElement2: r.DamageReduceElement2,
    damageReduceElement3: r.DamageReduceElement3,
    damageReduceElement4: r.DamageReduceElement4,
    damageReduceElement5: r.DamageReduceElement5,
    damageReduceElement6: r.DamageReduceElement6,
    ignoreDamageResistancePhys: r.IgnoreDamageResistancePhys,
    ignoreDamageResistanceElement1: r.IgnoreDamageResistanceElement1,
    ignoreDamageResistanceElement2: r.IgnoreDamageResistanceElement2,
    ignoreDamageResistanceElement3: r.IgnoreDamageResistanceElement3,
    ignoreDamageResistanceElement4: r.IgnoreDamageResistanceElement4,
    ignoreDamageResistanceElement5: r.IgnoreDamageResistanceElement5,
    ignoreDamageResistanceElement6: r.IgnoreDamageResistanceElement6,
    ignoreDefRate: r.IgnoreDefRate,
    autoAttackSpeed: r.AutoAttackSpeed,
    castAttackSpeed: r.CastAttackSpeed,
    specialDamageChange: r.SpecialDamageChange,
    healedChange: r.HealedChange,
    healChange: r.HealChange,
    elementPropertyType: r.ElementPropertyType,
    elementPower1: r.ElementPower1,
    elementPower2: r.ElementPower2,
    elementPower3: r.ElementPower3,
    elementPower4: r.ElementPower4,
    elementPower5: r.ElementPower5,
    elementPower6: r.ElementPower6,
    elementEnergyMax: r.ElementEnergyMax,
    elementEnergy: r.ElementEnergy,
    elementEfficiency: r.ElementEfficiency,
    strengthMax: r.StrengthMax,
    strength: r.Strength,
    strengthRecover: r.StrengthRecover,
    strengthPunishTime: r.StrengthPunishTime,
    strengthFastSwim: r.StrengthFastSwim,
    strengthRun: r.StrengthRun,
    strengthClimbJump: r.StrengthClimbJump,
    strengthFastClimbCost: r.StrengthFastClimbCost,
    strengthSwim: r.StrengthSwim,
    strengthGliding: r.StrengthGliding,
    toughMax: r.ToughMax,
    tough: r.Tough,
    toughRecover: r.ToughRecover,
    toughRecoverDelayTime: r.ToughRecoverDelayTime,
    toughChange: r.ToughChange,
    toughReduce: r.ToughReduce,
    skillToughRatio: r.SkillToughRatio,
    hardnessMax: r.HardnessMax,
    hardness: r.Hardness,
    hardnessRecover: r.HardnessRecover,
    hardnessPunishTime: r.HardnessPunishTime,
    hardnessChange: r.HardnessChange,
    hardnessReduce: r.HardnessReduce,
    rageMax: r.RageMax,
    rage: r.Rage,
    rageRecover: r.RageRecover,
    ragePunishTime: r.RagePunishTime,
    rageChange: r.RageChange,
    rageReduce: r.RageReduce,
    specialEnergy1Max: r.SpecialEnergy1Max,
    specialEnergy1: r.SpecialEnergy1,
    specialEnergy2Max: r.SpecialEnergy2Max,
    specialEnergy2: r.SpecialEnergy2,
    specialEnergy3Max: r.SpecialEnergy3Max,
    specialEnergy3: r.SpecialEnergy3,
    specialEnergy4Max: r.SpecialEnergy4Max,
    specialEnergy4: r.SpecialEnergy4,
    specialEnergy5Max: r.SpecialEnergy5Max,
    specialEnergy5: r.SpecialEnergy5,
    weaknessBuildUpMax: r.WeaknessBuildUpMax,
    weaknessBuildUp: r.WeaknessBuildUp,
    weaknessMastery: r.WeaknessMastery,
    weaknessTotalBonus: r.WeaknessTotalBonus,
    breakWeaknessRatio: r.BreakWeaknessRatio,
    weakTime: r.WeakTime,
    statusBuildUp1Max: r.StatusBuildUp1Max,
    statusBuildUp1: r.StatusBuildUp1,
    statusBuildUp2Max: r.StatusBuildUp2Max,
    statusBuildUp2: r.StatusBuildUp2,
    statusBuildUp3Max: r.StatusBuildUp3Max,
    statusBuildUp3: r.StatusBuildUp3,
    statusBuildUp4Max: r.StatusBuildUp4Max,
    statusBuildUp4: r.StatusBuildUp4,
    statusBuildUp5Max: r.StatusBuildUp5Max,
    statusBuildUp5: r.StatusBuildUp5,
    energyMax: r.EnergyMax,
    energy: r.Energy,
    mass: r.Mass,
    gravityScale: r.GravityScale,
    paralysisTimeMax: r.ParalysisTimeMax,
    paralysisTime: r.ParalysisTime,
    paralysisTimeRecover: r.ParalysisTimeRecover,
    brakingFrictionFactor: r.BrakingFrictionFactor,
    speedRatio: r.SpeedRatio,
  }));
  await batchInsert(
    rawBaseProperties,
    rows,
    (qb) => qb.onConflictDoNothing(),
    'raw_base_properties',
  );
}

async function ingestRolePropertyGrowth() {
  const raw = await fetchAndValidateJson(
    'BinData/property/rolepropertygrowth.json',
    RolePropertyGrowthArraySchema,
  );
  const rows = raw.map((r) => ({
    id: r.Id,
    level: r.Level,
    breachLevel: r.BreachLevel,
    lifeMaxRatio: r.LifeMaxRatio,
    atkRatio: r.AtkRatio,
    defRatio: r.DefRatio,
  }));
  await batchInsert(
    rawRolePropertyGrowth,
    rows,
    (qb) => qb.onConflictDoNothing(),
    'raw_role_property_growth',
  );
}

async function ingestSkillTreeNodes(t: TextResolver) {
  const raw = await fetchAndValidateJson(
    'BinData/skillTree/skilltree.json',
    SkillTreeNodeArraySchema,
  );
  const rows = raw.map((r) => ({
    id: r.Id,
    nodeIndex: r.NodeIndex,
    nodeGroup: r.NodeGroup,
    parentNodes: r.ParentNodes,
    nodeType: r.NodeType,
    coordinate: r.Coordinate,
    condition: r.Condition,
    skillId: r.SkillId,
    skillBranchIds: r.SkillBranchIds,
    propertyNodeTitle: t(r.PropertyNodeTitle),
    propertyNodeDescribe: t(r.PropertyNodeDescribe),
    propertyNodeParam: r.PropertyNodeParam.map((value) => t(value)),
    propertyNodeIcon: r.PropertyNodeIcon,
    property: r.Property,
    consume: r.Consume,
    unlockCondition: r.UnLockCondition,
  }));
  await batchInsert(
    rawSkillTreeNodes,
    rows,
    (qb) => qb.onConflictDoNothing(),
    'raw_skill_tree_nodes',
  );
}

async function ingestRoleInfo(t: TextResolver) {
  const raw = await fetchAndValidateJson(
    'BinData/role/roleinfo.json',
    RoleInfoArraySchema,
  );
  const rows = raw.map((r) => ({
    id: r.Id,
    name: t(r.Name),
    nickName: t(r.NickName),
    introduction: t(r.Introduction),
    roleHeadIconCircle: r.RoleHeadIconCircle,
    roleHeadIconLarge: r.RoleHeadIconLarge,
    roleHeadIconBig: r.RoleHeadIconBig,
    roleHeadIcon: r.RoleHeadIcon,
    roleStand: r.RoleStand,
    rolePortrait: r.RolePortrait,
    icon: r.Icon,
    formationRoleCard: r.FormationRoleCard,
    formationSpineAtlas: r.FormationSpineAtlas,
    formationSpineSkeletonData: r.FormationSpineSkeletonData,
    card: r.Card,
    characterVoice: r.CharacterVoice,
    attributesDescription: t(r.AttributesDescription),
    uiScenePerformanceAbp: r.UiScenePerformanceABP,
    skillDaPath: r.SkillDAPath,
    skillLockDaPath: r.SkillLockDAPath,
    skillEffectDa: r.SkillEffectDA,
    cameraConfig: r.CameraConfig,
    roleBody: r.RoleBody,
    footStepState: r.FootStepState,
    obtainedShowDescription: t(r.ObtainedShowDescription),
    qualityId: r.QualityId,
    roleType: r.RoleType,
    parentId: r.ParentId,
    priority: r.Priority,
    propertyId: r.PropertyId,
    elementId: r.ElementId,
    skinId: r.SkinId,
    weaponType: r.WeaponType,
    initWeaponItemId: r.InitWeaponItemId,
    maxLevel: r.MaxLevel,
    levelConsumeId: r.LevelConsumeId,
    breachId: r.BreachId,
    breachModel: r.BreachModel,
    resonanceId: r.ResonanceId,
    skillId: r.SkillId,
    resonantChainGroupId: r.ResonantChainGroupId,
    lockOnDefaultId: r.LockOnDefaultId,
    lockOnLookOnId: r.LockOnLookOnId,
    entityProperty: r.EntityProperty,
    numLimit: r.NumLimit,
    skillTreeGroupId: r.SkillTreeGroupId,
    defaultSkillBranchId: r.DefaultSkillBranchId,
    specialEnergyBarId: r.SpecialEnergyBarId,
    partyId: r.PartyId,
    meshId: r.MeshId,
    itemQualityId: r.ItemQualityId,
    cameraFloatHeight: r.CameraFloatHeight,
    uiMeshId: r.UiMeshId,
    roleGuide: r.RoleGuide,
    redDotDisableRule: r.RedDotDisableRule,
    trialRole: r.TrialRole,
    isTrial: r.IsTrial,
    intervene: r.Intervene,
    showInBag: r.ShowInBag,
    isShow: r.IsShow,
    hideHuLu: r.HideHuLu,
    isAim: r.IsAim,
    enableOperateSelfBgm: r.EnableOperateSelfBgm,
    tag: r.Tag,
    showProperty: r.ShowProperty,
    skillBranchIds: r.SkillBranchIds,
    exchangeConsume: r.ExchangeConsume,
    spilloverItem: r.SpilloverItem,
    skinDamage: r.SkinDamage,
    weaponScale: r.WeaponScale,
  }));
  await batchInsert(
    rawRoleInfo,
    rows,
    (qb) => qb.onConflictDoNothing(),
    'raw_role_info',
  );
}

async function ingestWeaponGrowth() {
  const raw = await fetchAndValidateJson(
    'BinData/property/weaponpropertygrowth.json',
    WeaponGrowthArraySchema,
  );
  const rows = raw.map((r) => ({
    id: r.Id,
    curveId: r.CurveId,
    level: r.Level,
    breachLevel: r.BreachLevel,
    curveValue: r.CurveValue,
  }));
  await batchInsert(
    rawWeaponGrowth,
    rows,
    (qb) => qb.onConflictDoNothing(),
    'raw_weapon_growth',
  );
}

async function ingestWeaponReson(t: TextResolver) {
  const raw = await fetchAndValidateJson(
    'BinData/weapon/weaponreson.json',
    WeaponResonArraySchema,
  );
  const rows = raw.map((r) => ({
    id: r.Id,
    resonId: r.ResonId,
    level: r.Level,
    name: t(r.Name),
    effect: r.Effect,
    consume: r.Consume,
    goldConsume: r.GoldConsume,
    materialPlaceType: r.MaterialPlaceType,
    alternativeConsume: r.AlternativeConsume,
  }));
  await batchInsert(
    rawWeaponReson,
    rows,
    (qb) => qb.onConflictDoNothing(),
    'raw_weapon_reson',
  );
}

async function ingestWeaponConfig(t: TextResolver) {
  const raw = await fetchAndValidateJson(
    'BinData/weapon/weaponconf.json',
    WeaponConfigArraySchema,
  );
  const rows = raw.map((r) => ({
    itemId: r.ItemId,
    isShow: r.IsShow,
    weaponName: t(r.WeaponName),
    qualityId: r.QualityId,
    weaponType: r.WeaponType,
    modelId: r.ModelId,
    transformId: r.TransformId,
    models: r.Models,
    modelsIndex: r.ModelsIndex,
    resonLevelLimit: r.ResonLevelLimit,
    firstPropId: r.FirstPropId,
    firstCurve: r.FirstCurve,
    secondPropId: r.SecondPropId,
    secondCurve: r.SecondCurve,
    resonId: r.ResonId,
    levelId: r.LevelId,
    breachId: r.BreachId,
    standAnim: r.StandAnim,
    desc: t(r.Desc),
    descParams: r.DescParams,
    bgDescription: t(r.BgDescription),
    attributesDescription: t(r.AttributesDescription),
    icon: r.Icon,
    resonanceIcon: r.ResonanceIcon,
    iconMiddle: r.IconMiddle,
    iconSmall: r.IconSmall,
    mesh: r.Mesh,
    numLimit: r.NumLimit,
    maxCapcity: r.MaxCapcity,
    hiddenTime: r.HiddenTime,
    destructible: r.Destructible,
    showInBag: r.ShowInBag,
    sortIndex: r.SortIndex,
    typeDescription: t(r.TypeDescription),
    itemAccess: r.ItemAccess,
    obtainedShow: r.ObtainedShow,
    obtainedShowDescription: t(r.ObtainedShowDescription),
    handBookTrialId: r.HandBookTrialId,
    redDotDisableRule: r.RedDotDisableRule,
  }));
  await batchInsert(
    rawWeaponConfig,
    rows,
    (qb) => qb.onConflictDoNothing(),
    'raw_weapon_config',
  );
}

async function ingestPhantomFetterGroups(t: TextResolver) {
  const raw = await fetchAndValidateJson(
    'BinData/phantom/phantomfettergroup.json',
    PhantomFetterGroupArraySchema,
  );
  const rows = raw.map((r) => ({
    id: r.Id,
    fetterMap: r.FetterMap,
    fetterType: r.FetterType,
    fetterGroupName: t(r.FetterGroupName),
    accessId: r.AccessId,
    fetterGroupDesc: t(r.FetterGroupDesc),
    sortId: r.SortId,
    fetterElementColor: r.FetterElementColor,
    fetterElementPath: r.FetterElementPath,
    aimModelElementPath: r.AimModelElementPath,
  }));
  await batchInsert(
    rawPhantomFetterGroups,
    rows,
    (qb) => qb.onConflictDoNothing(),
    'raw_phantom_fetter_groups',
  );
}

async function ingestPhantomFetters(t: TextResolver) {
  const raw = await fetchAndValidateJson(
    'BinData/phantom/phantomfetter.json',
    PhantomFetterArraySchema,
  );
  const rows = raw.map((r) => ({
    id: r.Id,
    name: t(r.Name),
    buffIds: r.BuffIds,
    addProp: r.AddProp,
    effectDescription: t(r.EffectDescription),
    fetterIcon: r.FetterIcon,
    simplyEffectDesc: t(r.SimplyEffectDesc),
    effectDescriptionParam: r.EffectDescriptionParam.map((value) => t(value)),
    effectDefineDescription: t(r.EffectDefineDescription),
    priority: r.Priority,
  }));
  await batchInsert(
    rawPhantomFetters,
    rows,
    (qb) => qb.onConflictDoNothing(),
    'raw_phantom_fetters',
  );
}

async function ingestPhantomItems(t: TextResolver) {
  const raw = await fetchAndValidateJson(
    'BinData/phantom/phantomitem.json',
    PhantomItemArraySchema,
  );
  const rows = raw.map((r) => ({
    itemId: r.ItemId,
    monsterId: r.MonsterId,
    parentMonsterId: r.ParentMonsterId,
    monsterName: t(r.MonsterName),
    elementType: r.ElementType,
    mainProp: r.MainProp,
    levelUpGroupId: r.LevelUpGroupId,
    skillId: r.SkillId,
    calabashBuffs: r.CalabashBuffs,
    rarity: r.Rarity,
    meshId: r.MeshId,
    zoom: r.Zoom,
    location: r.Location,
    rotator: r.Rotator,
    standAnim: r.StandAnim,
    typeDescription: t(r.TypeDescription),
    attributesDescription: t(r.AttributesDescription),
    icon: r.Icon,
    iconMiddle: r.IconMiddle,
    iconSmall: r.IconSmall,
    skillIcon: r.SkillIcon,
    qualityId: r.QualityId,
    maxCapcity: r.MaxCapcity,
    destructible: r.Destructible,
    showInBag: r.ShowInBag,
    sortIndex: r.SortIndex,
    numLimit: r.NumLimit,
    itemAccess: r.ItemAccess,
    obtainedShow: r.ObtainedShow,
    obtainedShowDescription: t(r.ObtainedShowDescription),
    phantomType: r.PhantomType,
    fetterGroup: r.FetterGroup,
    mesh: r.Mesh,
    redDotDisableRule: r.RedDotDisableRule,
  }));
  await batchInsert(
    rawPhantomItems,
    rows,
    (qb) => qb.onConflictDoNothing(),
    'raw_phantom_items',
  );
}

async function ingestPhantomSkills(t: TextResolver) {
  const raw = await fetchAndValidateJson(
    'BinData/phantom/phantomskill.json',
    PhantomSkillArraySchema,
  );
  const rows = raw.map((r) => ({
    id: r.Id,
    phantomSkillId: r.PhantomSkillId,
    buffIds: r.BuffIds,
    settleIds: r.SettleIds,
    buffEffects: r.BuffEffects,
    chargeEfficiency: r.ChargeEfficiency,
    skillGroupId: r.SkillGroupId,
    skillCd: r.SkillCD,
    descriptionEx: t(r.DescriptionEx),
    simplyDescription: t(r.SimplyDescription),
    ifCounterSkill: r.IfCounterSkill,
    curLevelDescriptionEx: r.CurLevelDescriptionEx.map((value) => t(value)),
    levelDescStrArray: r.LevelDescStrArray,
    battleViewIcon: r.BattleViewIcon,
    specialBattleViewIcon: r.SpecialBattleViewIcon,
  }));
  await batchInsert(
    rawPhantomSkills,
    rows,
    (qb) => qb.onConflictDoNothing(),
    'raw_phantom_skills',
  );
}

async function ingestRawMontages() {
  const sourcePaths = await listWuwaCharacterMontageFiles();
  const rowResults = await Promise.all(
    sourcePaths.map(async (sourcePath) => {
      const data = await fetchAndValidateWuwaCharacterDataJson(
        sourcePath,
        RawMontageAssetArraySchema,
      );
      return toRawMontageRow(sourcePath, data);
    }),
  );
  const rows = rowResults.filter((row) => row !== undefined);

  await batchInsert(
    rawMontages,
    rows,
    (qb) => qb.onConflictDoNothing(),
    'raw_montages',
  );
}

async function ingestRawSkillInfoAssets() {
  const sourcePaths = await listWuwaSkillInfoAssetFiles();
  const rows = await Promise.all(
    sourcePaths.map(async (sourcePath) => {
      const data = await fetchAndValidateWuwaCharacterDataJson(
        sourcePath,
        RawSkillInfoAssetFileArraySchema,
      );
      return toRawSkillInfoAssetRow(sourcePath, data);
    }),
  );

  await batchInsert(
    rawSkillInfoAssets,
    rows,
    (qb) => qb.onConflictDoNothing(),
    'raw_skill_info_assets',
  );
}

async function ingestRawSkillInfoRows() {
  const sourcePaths = await listWuwaSkillInfoAssetFiles();
  const rowGroups = await Promise.all(
    sourcePaths.map(async (sourcePath) => {
      const data = await fetchAndValidateWuwaCharacterDataJson(
        sourcePath,
        RawSkillInfoRowDataFileArraySchema,
      );
      return toRawSkillInfoRows(data);
    }),
  );

  await batchInsert(
    rawSkillInfoRows,
    rowGroups.flat(),
    (qb) => qb.onConflictDoNothing(),
    'raw_skill_info_rows',
  );
}

async function ingestRawReBulletDataMainRows() {
  const sourcePaths = await listWuwaReBulletDataMainFiles();
  const rowGroups = await Promise.all(
    sourcePaths.map(async (sourcePath) => {
      const data = await fetchAndValidateWuwaCharacterDataJson(
        sourcePath,
        RawReBulletDataMainFileArraySchema,
      );
      return toRawReBulletDataMainRows(sourcePath, data);
    }),
  );

  await batchInsert(
    rawReBulletDataMainRows,
    rowGroups.flat(),
    (qb) => qb.onConflictDoNothing(),
    'raw_re_bullet_data_main_rows',
  );
}

// ============================================================================
// Main
// ============================================================================

async function ingestRawData() {
  console.log('Ingesting raw GitHub data into database...\n');

  console.log('Refreshing wuwa-character-data snapshot...');
  await refreshWuwaCharacterDataSnapshot();

  console.log('Truncating raw tables...');
  await database.execute(sql`
    TRUNCATE TABLE
      raw_skills, raw_damage, raw_skill_descriptions, raw_skill_attributes, raw_buffs, raw_chains,
      raw_rogue_character_buffs, raw_rogue_permanent_character_buffs, raw_rogue_permanent_buff_pools,
      raw_rogue_weekly_buff_pools,
      raw_skill_tree_nodes, raw_role_info, raw_weapon_growth, raw_weapon_reson,
      raw_weapon_config, raw_phantom_fetter_groups, raw_phantom_fetters,
      raw_phantom_items, raw_phantom_skills, raw_role_property_growth,
      raw_base_properties, raw_montages, raw_skill_info_assets, raw_skill_info_rows,
      raw_re_bullet_data_main_rows
  `);

  console.log('Loading English text resolver...');
  const t = await getTextResolver('en');

  await Promise.all([
    ingestSkills(t),
    ingestDamage(),
    ingestSkillDescriptions(t),
    ingestSkillAttributes(t),
    ingestBuffs(t),
    ingestChains(t),
    ingestRogueCharacterBuffs(t),
    ingestRoguePermanentCharacterBuffs(t),
    ingestRoguePermanentBuffPools(t),
    ingestRogueWeeklyBuffPools(t),
    ingestRolePropertyGrowth(),
    ingestSkillTreeNodes(t),
    ingestRoleInfo(t),
    ingestWeaponGrowth(),
    ingestWeaponReson(t),
    ingestWeaponConfig(t),
    ingestPhantomFetterGroups(t),
    ingestPhantomFetters(t),
    ingestPhantomItems(t),
    ingestPhantomSkills(t),
    ingestBaseProperties(),
    ingestRawMontages(),
    ingestRawSkillInfoAssets(),
    ingestRawSkillInfoRows(),
    ingestRawReBulletDataMainRows(),
  ]);

  console.log('\nDone.');
  await client.end();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await ingestRawData();
}

export { ingestRawData };

import type { Stat } from '@/services/game-data/types';
import { Sequence as SequenceEnum } from '@/services/game-data/types';
import { CharacterStat, EnemyStat, Tag } from '@/types';

type TaggedStatDefinition = Omit<Stat, 'value'>;

export const SEQUENCE_ORDER = [
  SequenceEnum.S1,
  SequenceEnum.S2,
  SequenceEnum.S3,
  SequenceEnum.S4,
  SequenceEnum.S5,
  SequenceEnum.S6,
] as const;

export const ENEMY_STAT_SET = new Set<string>(Object.values(EnemyStat));

/** EID=2 ApplyBuff — param[0]: when this buff's effect fires */
export const TriggerMode = {
  /** When this buff is first applied */
  OnApply: 0,
  /** On periodic tick */
  OnPeriodic: 1,
  /** When damage is dealt */
  OnDamageDealt: 2,
  /** When damage is received */
  OnDamageReceived: 3,
  /** On kill */
  OnKill: 4,
  /** When a buff expires */
  OnBuffExpire: 6,
  /** When a buff is removed */
  OnBuffRemoved: 7,
  /** On character swap in */
  OnSwapIn: 8,
  /** On character swap out */
  OnSwapOut: 9,
  /** On heal */
  OnHeal: 10,
  /** On shield application */
  OnShield: 11,
  /** On elemental reaction */
  OnElementReact: 12,
  /** On skill activation */
  OnSkillUse: 13,
  /** On dodge */
  OnDodge: 14,
  /** On revive */
  OnRevive: 16,
  /** On summon */
  OnSummon: 18,
} as const;
export type TriggerMode = (typeof TriggerMode)[keyof typeof TriggerMode];

/** EID=2 ApplyBuff — param[1]: who receives the applied buff(s) */
export const TargetMode = {
  /** Self / default */
  Self: 0,
  /** Target / victim */
  Target: 1,
  /** Entire formation / team */
  Formation: 2,
} as const;
export type TargetMode = (typeof TargetMode)[keyof typeof TargetMode];

/** EID=5 ManageBuff — param[0]: what to do with the listed buff(s) */
export const ManageBuffAction = {
  /** Apply the listed buffs */
  Apply: 0,
  /** Toggle / conditionally apply */
  Toggle: 1,
  /** Remove the listed buffs */
  Remove: 2,
} as const;
export type ManageBuffAction = (typeof ManageBuffAction)[keyof typeof ManageBuffAction];

/** EID=1 ModifyProperty — param[0]: whose property is modified */
export const ModifyPropertyTarget = {
  /** Self / attacker */
  Self: 0,
  /** Victim / target */
  Victim: 1,
  /** Damage source */
  Source: 2,
  /** Entire formation / team */
  Formation: 3,
} as const;
export type ModifyPropertyTarget =
  (typeof ModifyPropertyTarget)[keyof typeof ModifyPropertyTarget];

/** EID=1 ModifyProperty — param[2]: how the magnitude is applied */
export const CalcMode = {
  /** Flat additive */
  FlatAdd: 0,
  /** Percentage */
  Percentage: 1,
  /** Conditional / scaled */
  ConditionalScaled: 2,
} as const;
export type CalcMode = (typeof CalcMode)[keyof typeof CalcMode];

/** EID=1 ModifyProperty — param[4]: which damage types are in scope */
export const DamageScope = {
  /** All damage */
  All: 0,
  /** Specific damage context */
  Specific: 1,
  Unknown2: 2,
  /** Intro / Outro context */
  IntroOutro: 3,
} as const;
export type DamageScope = (typeof DamageScope)[keyof typeof DamageScope];

/** EID=1 ModifyProperty — param[5]: standard buff or inverted debuff */
export const ApplyMode = {
  /** Standard buff */
  Standard: 0,
  /** Inverted / debuff */
  Inverted: 1,
} as const;
export type ApplyMode = (typeof ApplyMode)[keyof typeof ApplyMode];

/** EID=37 DamageAmplifier — param[0]: how the amplification is applied. Grow1 = bonus in basis points */
export const DamageAmplifierMode = {
  /** Multiplicative bonus */
  Multiplicative: 0,
  /** Additive bonus */
  Additive: 1,
  /** Flat damage add */
  FlatAdd: 3,
  /** Special scaling */
  SpecialScaling: 8,
  Unknown9: 9,
} as const;
export type DamageAmplifierMode =
  (typeof DamageAmplifierMode)[keyof typeof DamageAmplifierMode];

/** All known ExtraEffect type IDs */
export const ExtraEffectID = {
  /** Modifies a property on damage. Params: [target, propertyId, calcMode, calcParam, scope, applyMode]. Grow1 = magnitude (basis points) */
  ModifyProperty: 1,
  /** Conditionally applies buff(s). Params: [triggerMode, targetMode, buffId1#buffId2#...] */
  ApplyBuff: 2,
  /** Spawns entity/bullet. Params: [type, count, entityId] */
  SpawnEntity: 3,
  /** Triggers visual/audio effect. Params: [effectId] */
  PlayEffect: 4,
  /** Applies or removes buff(s). Params: [action, buffId1#buffId2#..., ?count] */
  ManageBuff: 5,
  /** Watches attribute and triggers at threshold. Params: [attrId, direction, ?, buffIds, ?]. Grow1/Grow2 = lower/upper bounds */
  AttributeThreshold: 6,
  /** Summons entity. Params: [blueprintId, count] */
  SummonEntity: 7,
  /** Modifies physics. Params: [propertyName, value] */
  SetPhysics: 8,
  /** Direct attribute modification. Params: [attrId, value] */
  ModifyAttribute: 9,
  /** Boolean toggle. Params: [0 or 1] */
  ToggleFlag: 10,
  /** Triggers a skill. Params: [skillId] */
  TriggerSkill: 11,
  /** Restores resource (energy/HP). Params: [amount] */
  RestoreResource: 12,
  /** Remaps damage IDs. Params: [oldId#newId] or [damagePrefix, mode] */
  SwapDamageId: 13,
  /** Modifies gauge/resource. Params: [gaugeAttrId, value] */
  ModifyGauge: 14,
  /** Fills gauge to value. Params: [gaugeAttrId] */
  FillGauge: 15,
  /** Consumes gauge. Params: [gaugeAttrId] */
  ConsumeGauge: 16,
  /** Bullet time / time dilation. Params: [target, scale, ?] */
  TimeScale: 17,
  /** Camera manipulation. Params: [mode] */
  CameraEffect: 18,
  /** AI behavior modification. Params: [mode] */
  ModifyAI: 20,
  /** Formation/team listener. Params: [mode]. Triggers on swap in/out */
  ListenFormation: 21,
  /** Applies buff after delay. Params: [delayMs, conditions, buffIds] */
  DelayedBuff: 24,
  /** Damage sharing/redirect. Params: [mode, damageIds, range] */
  DamageShare: 26,
  /** Removes specific buff(s). Params: [buffId1#buffId2#...] */
  RemoveBuffById: 28,
  /** Transfers buff to target. Params: [mode, buffId] */
  TransferBuff: 29,
  /** Spawns bullet/projectile. Params: [type, count, bulletId, ?] */
  SpawnBullet: 30,
  /** Grants immunity/super armor. Params: [level] */
  GrantImmunity: 31,
  /** Modifies tough/poise. Params: [mode] */
  ModifyTough: 33,
  /** Resets skill cooldown. Params: [mode] */
  ResetCooldown: 34,
  /** Self-referencing buff (keeps itself alive). Params: [ownBuffId] */
  SelfReference: 35,
  /** Grants hyper armor. Params: [level] */
  GrantHyperArmor: 36,
  /** Amplifies damage on specific hits. Params: [mode]. Grow1 = bonus (basis points). Uses ReqPara[5] for damage whitelist */
  DamageAmplifier: 37,
  /** Modifies hit reaction. Params: [mode] */
  ModifyHitReaction: 38,
  /** Conditional entity spawn. Params: [type, conditions, entityId] */
  ConditionalSpawn: 39,
  /** Periodic entity spawn. Params: [type, count, entityId] */
  PeriodicSpawn: 41,
  /** Blocks buff while tags present. Params: [tag1#tag2#...] */
  TagGate: 43,
  /** Shield-related effect. Params: [shieldValue] */
  ShieldEffect: 44,
  /** Heal over time. Params: [?, ?, attrId, ?, base, bonus] */
  HealOverTime: 45,
  /** Scaling heal. Params: [?, ?, ?, attrId, calcType, base, ratio] */
  ScalingHeal: 46,
  /** Grants additional tag. Params: [mode] */
  GrantTag: 47,
  /** Modifies skill behavior. Params: [skillRef, mode, ?] */
  SkillModifier: 49,
  /** Triggers chained action. Params: [actionId, mode] */
  ChainedAction: 53,
  /** Replaces damage ID set. Params: [damageId1#damageId2#...] */
  ReplaceDamageSet: 57,
  /** Applies buff based on stacks. Params: [stackThreshold, buffIds, mode] */
  StackedBuff: 58,
  /** Applies buff with filter. Params: [filterMode, buffIds] */
  FilteredBuff: 59,
  /** Modifies weakness. Params: [weaknessId or buffId] */
  ModifyWeakness: 60,
  /** Syncs state across formation. Params: [mode] */
  FormationSync: 62,
  /** Swaps between buff sets. Params: [setA, setB] */
  SwapBuffSet: 65,
  /** Triggers elemental reaction. Params: [reactionIds] */
  ElementalReaction: 67,
  /** Consumes stacks for effect. Params: [buffId#stackCount] */
  StackConsume: 70,
  /** Level-scaled effect. Params: [mode, description, level#op#buffId...] */
  LeveledEffect: 75,
  /** Modifies summon behavior. Params: [summonId, mode, ?, ?] */
  SummonModifier: 79,
  /** Periodic attribute modification. Params: [tickIndex] */
  PeriodicAttribute: 84,
  /** Converts between gauges. Params: [?, sourceAttr, mode] */
  GaugeConversion: 88,
  /** Damage set whitelist. Params: [damageId1#damageId2#...] */
  DamageSetWhitelist: 89,
  /** Conditional damage swap. Params: [?, ?, damageIdA#damageIdB] */
  ConditionalDamageSwap: 90,
  /** Persistent buff application. Params: [buffId] */
  PersistentBuff: 91,
  /** Flat heal. Params: [amount, ?] */
  HealFlat: 101,
  /** Effect scaled by stack count. Params: [?, ?, stackLevel#value pairs] */
  ScaledByStacks: 121,
  /** Area damage effect. Params: [element, radius, ratio] */
  AreaDamage: 127,
  /** Area heal effect. Params: [element, radius, ratio] */
  AreaHeal: 128,
  /** Rogue mode attribute mod. Params: [value] */
  RogueModifyAttr: 201,
  /** Rogue mode buff spawn. Params: [type, count, buffId] */
  RogueSpawnBuff: 207,
  /** Rogue mode reward. Params: [rewardId] */
  RogueReward: 208,
  /** Elemental damage scaling — Ice. Params: level#value pairs */
  GlacioChafe: 1001,
  /** Elemental damage scaling — Fire. Params: level#value pairs */
  FusionBurst: 1002,
  /** Elemental damage scaling (1003). Params: level#value pairs */
  ElectroFlare: 1003,
  /** Elemental damage scaling (1004). Params: level#value pairs */
  AeroErosion: 1004,
  /** Elemental damage scaling (1005). Params: level#value pairs */
  SpectroFrazzle: 1005,
  /** Elemental damage scaling (1006). Params: level#value pairs */
  HavocBane: 1006,
} as const;
export type ExtraEffectID = (typeof ExtraEffectID)[keyof typeof ExtraEffectID];

export const DAMAGE_SUBTYPE_TO_TAG_MAP = {
  '0': Tag.COORDINATED_ATTACK,
  '1001': Tag.GLACIO_CHAFE,
  '1002': Tag.FUSION_BURST,
  '1003': Tag.ELECTRO_FLARE,
  '1004': Tag.AERO_EROSION,
  '1005': Tag.SPECTRO_FRAZZLE,
  '1006': Tag.HAVOC_BANE,
  '1201': Tag.TUNE_RUPTURE,
} as const as Partial<Record<string, Tag>>;

export const Buff = {
  GLACIO_CHAFE: 10_011_000,
  FUSION_BURST: 10_021_000,
  ELECTRO_FLARE: 10_031_000,
  AERO_EROSION: 10_041_000,
  SPECTRO_FRAZZLE: 10_051_000,
  HAVOC_BANE: 10_061_000,
} as const;

export const NEGATIVE_STATUS_BUFF_ID_TO_STAT: Partial<Record<number, EnemyStat>> = {
  [Buff.GLACIO_CHAFE]: EnemyStat.GLACIO_CHAFE,
  [Buff.FUSION_BURST]: EnemyStat.FUSION_BURST,
  [Buff.ELECTRO_FLARE]: EnemyStat.ELECTRO_FLARE,
  [Buff.AERO_EROSION]: EnemyStat.AERO_EROSION,
  [Buff.SPECTRO_FRAZZLE]: EnemyStat.SPECTRO_FRAZZLE,
  [Buff.HAVOC_BANE]: EnemyStat.HAVOC_BANE,
};

/** Requirement types that gate or trigger ExtraEffect execution */
export const ExtraEffectRequirement = {
  /** Triggers when damage with matching prefix lands. ReqPara = damage ID prefixes */
  OnSkillTreeUnlock: 1,
  /** Triggers on cast of a skill of a particular orgiin type **/
  OnOriginTypeCast: 2,
  /** Triggers when attribute crosses threshold. ReqPara = [mode#attrId#?#lower#upper] */
  OnStatThreshold: 3,
  /** Effect only applies to these damage IDs/prefixes. ReqPara = damageId1#damageId2#... */
  OnDamageInstances: 5,
  OnForteGaugeCondition: 6,
  OnAttribute: 7,
  /** Triggers on tag state. ReqPara = [targetMode#checkMode#tagString] */
  OnTagCondition: 9,
  /** Triggers at stack count threshold. ReqPara = [count] */
  OnDamageType: 12,
  /** Triggers on matching index. ReqPara = [index1#index2#...] */
  OnIndexMatch: 13,
  /** Triggers on buff state. ReqPara = [buffId#target#lower#upper] */
  OnBuffStack: 14,
  /** Triggers on condition. ReqPara = [?#conditionId] */
  OnDamageSubtype: 17,
} as const;
export type ExtraEffectRequirement =
  (typeof ExtraEffectRequirement)[keyof typeof ExtraEffectRequirement];

/** DurationPolicy — how long a buff lasts */
export const DurationPolicy = {
  /** Applied and removed immediately (one-shot stat mod) */
  Instant: 0,
  /** Lasts until explicitly removed */
  Infinite: 1,
  /** Duration from DurationMagnitude in seconds; -1 = permanent until condition */
  Timed: 2,
} as const;
export type DurationPolicy = (typeof DurationPolicy)[keyof typeof DurationPolicy];

export const STANDARD_RATIO_STAT_MAP: Partial<Record<number, TaggedStatDefinition>> = {
  2: { stat: CharacterStat.HP_SCALING_BONUS, tags: [] },
  3: { stat: CharacterStat.HP_SCALING_BONUS, tags: [] },
  7: { stat: CharacterStat.ATTACK_SCALING_BONUS, tags: [] },
  8: { stat: CharacterStat.CRITICAL_RATE, tags: [] },
  9: { stat: CharacterStat.CRITICAL_DAMAGE, tags: [] },
  10: { stat: CharacterStat.DEFENSE_SCALING_BONUS, tags: [] },
  11: { stat: CharacterStat.ENERGY_REGEN, tags: [] },
  14: { stat: CharacterStat.DAMAGE_BONUS, tags: [Tag.RESONANCE_SKILL] },
  15: { stat: CharacterStat.DAMAGE_BONUS, tags: [] },
  16: { stat: CharacterStat.FINAL_DAMAGE_BONUS, tags: [] },
  17: { stat: CharacterStat.DAMAGE_BONUS, tags: [Tag.BASIC_ATTACK] },
  18: { stat: CharacterStat.DAMAGE_BONUS, tags: [Tag.HEAVY_ATTACK] },
  19: { stat: CharacterStat.DAMAGE_BONUS, tags: [Tag.RESONANCE_LIBERATION] },
  20: { stat: CharacterStat.DAMAGE_BONUS, tags: [Tag.INTRO] },
  21: { stat: CharacterStat.DAMAGE_BONUS, tags: [Tag.PHYSICAL] },
  22: { stat: CharacterStat.DAMAGE_BONUS, tags: [Tag.GLACIO] },
  23: { stat: CharacterStat.DAMAGE_BONUS, tags: [Tag.FUSION] },
  24: { stat: CharacterStat.DAMAGE_BONUS, tags: [Tag.ELECTRO] },
  25: { stat: CharacterStat.DAMAGE_BONUS, tags: [Tag.AERO] },
  26: { stat: CharacterStat.DAMAGE_BONUS, tags: [Tag.SPECTRO] },
  27: { stat: CharacterStat.DAMAGE_BONUS, tags: [Tag.HAVOC] },
  30: { stat: CharacterStat.RESISTANCE_PENETRATION, tags: [Tag.FUSION] },
  32: { stat: CharacterStat.RESISTANCE_PENETRATION, tags: [Tag.AERO] },
  34: { stat: CharacterStat.RESISTANCE_PENETRATION, tags: [Tag.HAVOC] },
  35: { stat: CharacterStat.HEALING_BONUS, tags: [] },
  37: { stat: CharacterStat.DAMAGE_AMPLIFICATION, tags: [] },
  38: { stat: CharacterStat.DAMAGE_AMPLIFICATION, tags: [] },
  99: { stat: CharacterStat.DEFENSE_IGNORE, tags: [] },
  114: { stat: CharacterStat.DAMAGE_BONUS, tags: [Tag.ECHO] },
  141: { stat: CharacterStat.OFF_TUNE_BUILDUP_RATE, tags: [Tag.ALL] },
  142: { stat: CharacterStat.TUNE_BREAK_BOOST, tags: [Tag.ALL] },
};

export const NEGATIVE_MAGNITUDE_STAT_MAP: Partial<
  Record<number, TaggedStatDefinition>
> = {
  10: { stat: EnemyStat.DEFENSE_REDUCTION, tags: [] },
};

export const NON_RATIO_STAT_MAP: Partial<Record<number, TaggedStatDefinition>> = {
  3: { stat: CharacterStat.HP_FLAT, tags: [] },
  7: { stat: CharacterStat.ATTACK_FLAT, tags: [] },
  10: { stat: CharacterStat.DEFENSE_FLAT, tags: [] },
};

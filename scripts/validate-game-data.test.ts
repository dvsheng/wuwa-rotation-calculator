import fs from 'node:fs';
import path from 'node:path';

import { describe, it } from 'vitest';
import { z } from 'zod';

import { Sequence } from '@/services/game-data/character/types';
import { OriginType } from '@/services/game-data/common-types';
import {
  AbilityAttribute,
  Attribute,
  CharacterStat,
  DamageType,
  EnemyStat,
  Tag,
} from '@/types';

// Valid stat tags: All Tag enum values (Attribute + DamageType + NegativeStatus + extras)

const BaseStatTagSchema = z.enum(Object.values(Tag));

const BaseAttackStatTagSchema = z.enum(Object.values(Tag)).exclude(['all']);

const LinearScalingParameterConfigSchema = z.object({
  scale: z.number(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
});

// Valid keys for UserParameterizedNumber: '0', '1', '2'
const UserParameterConfigKeySchema = z.enum(['0', '1', '2']);

// Valid keys for RotationRuntimeResolvableNumber: CharacterStat | EnemyStat | AbilityAttribute
const RuntimeParameterConfigKeySchema = z.enum([
  ...Object.values(CharacterStat),
  ...Object.values(EnemyStat),
  ...Object.values(AbilityAttribute),
]);

// Conditional bonus schema for step functions
const ConditionalBonusOperatorSchema = z.enum(['>=', '>', '<=', '<', '==']);

const UserConditionalBonusSchema = z.object({
  parameter: UserParameterConfigKeySchema,
  operator: ConditionalBonusOperatorSchema,
  threshold: z.number(),
  valueIfTrue: z.number(),
  valueIfFalse: z.number().optional(),
});

const RuntimeConditionalBonusSchema = z.object({
  parameter: RuntimeParameterConfigKeySchema,
  operator: ConditionalBonusOperatorSchema,
  threshold: z.number(),
  valueIfTrue: z.number(),
  valueIfFalse: z.number().optional(),
});

const UserParameterizedNumberSchema = z.object({
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  parameterConfigs: z.partialRecord(
    UserParameterConfigKeySchema,
    LinearScalingParameterConfigSchema,
  ),
  offset: z.number().optional(),
  conditionals: z.array(UserConditionalBonusSchema).optional(),
});

const RotationRuntimeResolvableNumberSchema = z.object({
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  parameterConfigs: z.partialRecord(
    RuntimeParameterConfigKeySchema,
    LinearScalingParameterConfigSchema,
  ),
  offset: z.number().optional(),
  conditionals: z.array(RuntimeConditionalBonusSchema).optional(),
  resolveWith: z.string(),
});

const ParameterizedNumberSchema = z.union([
  z.number(),
  UserParameterizedNumberSchema,
  RotationRuntimeResolvableNumberSchema,
]);

const CapabilitySchema = z.object({
  id: z.string(),
  description: z.string(),
});

// Mutually exclusive attack category tags - an attack must have at most one
const MUTUALLY_EXCLUSIVE_TAGS = [
  'basicAttack',
  'heavyAttack',
  'resonanceSkill',
  'resonanceLiberation',
  'echo',
] as const;

const ATTRIBUTE_TAGS = Object.values(Attribute);

// --- Validation Rules ---

const hasAtMostOneMutuallyExclusiveTag = (tags: Array<string>) => {
  const count = tags.filter((tag) =>
    MUTUALLY_EXCLUSIVE_TAGS.includes(tag as (typeof MUTUALLY_EXCLUSIVE_TAGS)[number]),
  ).length;
  return count <= 1;
};
const MUTUALLY_EXCLUSIVE_TAG_ERROR = {
  message: `Attack must have at most one of: ${MUTUALLY_EXCLUSIVE_TAGS.join(', ')}`,
};

const hasExactlyOneAttributeTag = (tags: Array<string>) => {
  const count = tags.filter((tag) => ATTRIBUTE_TAGS.includes(tag as Attribute)).length;
  return count === 1;
};
const ATTRIBUTE_TAG_ERROR = {
  message: `Non-character attack must have exactly one attribute tag: ${ATTRIBUTE_TAGS.join(', ')}`,
};

const doesNotHaveEchoTag = (tags: Array<string>) => !tags.includes(DamageType.ECHO);
const ECHO_TAG_ERROR = {
  message: 'Echo attacks must not have the "echo" tag (it is added by the service)',
};

const hasValidCharacterStatTags = (character: {
  capabilities: {
    attacks: Array<{ name: string }>;
    modifiers: Array<{ modifiedStats: Array<{ tags: Array<string> }> }>;
    permanentStats: Array<{ tags: Array<string> }>;
  };
}) => {
  const attackNames = new Set(character.capabilities.attacks.map((a) => a.name));
  const validStatTags = new Set(Object.values(Tag));
  const isValidTag = (tag: string) =>
    validStatTags.has(tag as Tag) || attackNames.has(tag);

  for (const modifier of character.capabilities.modifiers) {
    for (const stat of modifier.modifiedStats) {
      if (!stat.tags.every((tag) => isValidTag(tag))) return false;
    }
  }
  for (const permanentStat of character.capabilities.permanentStats) {
    if (!permanentStat.tags.every((tag) => isValidTag(tag))) return false;
  }
  return true;
};
const CHARACTER_STAT_TAGS_ERROR = {
  message:
    'Modifier and PermanentStat tags must be valid Tag enum values or match an attack name',
};

// --- Attack Schemas ---

// Attack tags for non-character entities (requires exactly one attribute tag)

const MotionValuesSchema = z
  .array(z.number().or(UserParameterizedNumberSchema))
  .nonempty();

const NonCharacterAttackTagsSchema = z
  .array(BaseAttackStatTagSchema)
  .refine(hasAtMostOneMutuallyExclusiveTag, MUTUALLY_EXCLUSIVE_TAG_ERROR)
  .refine(hasExactlyOneAttributeTag, ATTRIBUTE_TAG_ERROR);

const NonCharacterAttackSchema = CapabilitySchema.extend({
  tags: NonCharacterAttackTagsSchema,
  scalingStat: z.enum(Object.values(AbilityAttribute)),
  motionValues: MotionValuesSchema,
});

// Echo attack tags (no 'echo' tag allowed - it's added by the service)
const EchoAttackTagsSchema = NonCharacterAttackTagsSchema.refine(
  doesNotHaveEchoTag,
  ECHO_TAG_ERROR,
);

const EchoAttackSchema = CapabilitySchema.extend({
  tags: EchoAttackTagsSchema,
  scalingStat: z.enum(Object.values(AbilityAttribute)),
  motionValues: MotionValuesSchema,
});

// Stat schema with strict Tag enum validation (for non-character entities)
const StrictStatSchema = z.object({
  stat: z.union([
    z.enum(Object.values(CharacterStat)),
    z.enum(Object.values(EnemyStat)),
  ]),
  value: ParameterizedNumberSchema,
  tags: z.array(BaseStatTagSchema),
});

const StrictModifierSchema = CapabilitySchema.extend({
  target: z.union([
    z.enum(['team', 'enemy', 'activeCharacter', 'self']),
    z.array(z.union([z.literal(1), z.literal(2), z.literal(3)])),
  ]),
  modifiedStats: z.array(StrictStatSchema).nonempty(),
});

const StrictPermanentStatSchema = CapabilitySchema.and(StrictStatSchema);

const StrictCapabilitiesSchema = z.object({
  attacks: z.array(NonCharacterAttackSchema),
  modifiers: z.array(StrictModifierSchema),
  permanentStats: z.array(StrictPermanentStatSchema),
});

// Stat schema with loose tags (for character entities, validated via refinement)
const StatSchema = z.object({
  stat: z.union([
    z.enum(Object.values(CharacterStat)),
    z.enum(Object.values(EnemyStat)),
  ]),
  value: ParameterizedNumberSchema,
  tags: z.array(z.string()),
});

const BaseEntitySchema = z.object({
  id: z.string(),
  uuid: z.string(),
  name: z.string(),
});

// --- Echo Schemas ---

const EchoCapabilitiesSchema = z.object({
  attacks: z.array(EchoAttackSchema),
  modifiers: z.array(StrictModifierSchema),
  permanentStats: z.array(StrictPermanentStatSchema),
});

const EchoSchema = BaseEntitySchema.extend({
  echoSetIds: z.array(z.string()),
  capabilities: EchoCapabilitiesSchema,
});

// --- Echo Set Schemas ---

const EchoSetSchema = BaseEntitySchema.extend({
  setEffects: z.partialRecord(z.enum(['2', '3', '5']), StrictCapabilitiesSchema),
});

// --- Weapon Schemas ---

// RefineScalableNumber: { base: number, increment: number }
const RefineScalableNumberSchema = z.object({
  base: z.number(),
  increment: z.number(),
});

// StoredNumber: number | RefineScalableNumber
const StoredNumberSchema = z.union([z.number(), RefineScalableNumberSchema]);

// LinearScalingParameterConfig with StoredNumber values
const StoredLinearScalingParameterConfigSchema = z.object({
  scale: StoredNumberSchema,
  minimum: StoredNumberSchema.optional(),
  maximum: StoredNumberSchema.optional(),
});

// UserParameterizedNumber with StoredNumber values
const StoredUserParameterizedNumberSchema = z.object({
  minimum: StoredNumberSchema.optional(),
  maximum: StoredNumberSchema.optional(),
  parameterConfigs: z.partialRecord(
    UserParameterConfigKeySchema,
    StoredLinearScalingParameterConfigSchema,
  ),
  offset: StoredNumberSchema.optional(),
});

// RotationRuntimeResolvableNumber with StoredNumber values
const StoredRotationRuntimeResolvableNumberSchema = z.object({
  minimum: StoredNumberSchema.optional(),
  maximum: StoredNumberSchema.optional(),
  parameterConfigs: z.partialRecord(
    RuntimeParameterConfigKeySchema,
    StoredLinearScalingParameterConfigSchema,
  ),
  offset: StoredNumberSchema.optional(),
  resolveWith: z.string(),
});

// Parameterized number that may contain RefineScalableNumber
const StoredParameterizedNumberSchema = z.union([
  StoredNumberSchema,
  StoredUserParameterizedNumberSchema,
  StoredRotationRuntimeResolvableNumberSchema,
]);

// Stat schema for weapons (with StoredNumber values)
const WeaponStatSchema = z.object({
  stat: z.union([
    z.enum(Object.values(CharacterStat)),
    z.enum(Object.values(EnemyStat)),
  ]),
  value: StoredParameterizedNumberSchema,
  tags: z.array(BaseStatTagSchema),
});

const WeaponModifierSchema = CapabilitySchema.extend({
  target: z.union([
    z.enum(['team', 'enemy', 'activeCharacter', 'self']),
    z.array(z.union([z.literal(1), z.literal(2), z.literal(3)])),
  ]),
  modifiedStats: z.array(WeaponStatSchema).nonempty(),
});

const WeaponPermanentStatSchema = CapabilitySchema.and(WeaponStatSchema);

// Motion values for weapons (may contain RefineScalableNumber)
const WeaponMotionValuesSchema = z
  .array(StoredNumberSchema.or(StoredUserParameterizedNumberSchema))
  .nonempty();

const WeaponAttackSchema = CapabilitySchema.extend({
  tags: NonCharacterAttackTagsSchema,
  scalingStat: z.enum(Object.values(AbilityAttribute)),
  motionValues: WeaponMotionValuesSchema,
});

const WeaponCapabilitiesSchema = z.object({
  attacks: z.array(WeaponAttackSchema),
  modifiers: z.array(WeaponModifierSchema),
  permanentStats: z.array(WeaponPermanentStatSchema),
});

const WeaponSchema = BaseEntitySchema.extend({
  capabilities: WeaponCapabilitiesSchema,
});

// --- Character Schemas ---

const SequenceSchema = z.enum(Object.values(Sequence));

const CharacterOriginTypeSchema = z
  .enum(Object.values(OriginType))
  .exclude(['Echo', 'Echo Set', 'Weapon']);

const CharacterAttackTagsSchema = z
  .array(BaseAttackStatTagSchema.exclude(Object.values(Attribute)))
  .refine(hasAtMostOneMutuallyExclusiveTag, MUTUALLY_EXCLUSIVE_TAG_ERROR);

// Child schemas for alternativeDefinitions (only allowed override fields)
const CharacterChildAttackSchema = z.strictObject({
  description: z.string().optional(),
  motionValues: MotionValuesSchema.optional(),
  tags: CharacterAttackTagsSchema.optional(),
});

const CharacterChildModifierSchema = z.strictObject({
  description: z.string().optional(),
  target: z
    .union([
      z.enum(['team', 'enemy', 'activeCharacter', 'self']),
      z.array(z.union([z.literal(1), z.literal(2), z.literal(3)])).nonempty(),
    ])
    .optional(),
  modifiedStats: z.array(StatSchema).nonempty().optional(),
});

const CharacterChildPermanentStatSchema = z.strictObject({
  description: z.string().optional(),
  stat: z
    .union([z.enum(Object.values(CharacterStat)), z.enum(Object.values(EnemyStat))])
    .optional(),
  value: ParameterizedNumberSchema.optional(),
  tags: z.array(z.string()).optional(),
});

const CharacterAttackSchema = z.strictObject({
  id: z.string(),
  description: z.string(),
  name: z.string(),
  parentName: z.string(),
  originType: CharacterOriginTypeSchema.exclude(['Base Stats', 'Inherent Skill']),
  unlockedAt: SequenceSchema.optional(),
  tags: CharacterAttackTagsSchema,
  scalingStat: z.enum(Object.values(AbilityAttribute)),
  motionValues: MotionValuesSchema,
  alternativeDefinitions: z
    .partialRecord(SequenceSchema, CharacterChildAttackSchema)
    .optional(),
});

const CharacterModifierSchema = z.strictObject({
  id: z.string(),
  description: z.string(),
  name: z.string(),
  parentName: z.string(),
  originType: CharacterOriginTypeSchema,
  unlockedAt: SequenceSchema.optional(),
  target: z.union([
    z.enum(['team', 'enemy', 'activeCharacter', 'self']),
    z.array(z.union([z.literal(1), z.literal(2), z.literal(3)])).nonempty(),
  ]),
  modifiedStats: z.array(StatSchema).nonempty(),
  alternativeDefinitions: z
    .partialRecord(SequenceSchema, CharacterChildModifierSchema)
    .optional(),
});

const CharacterPermanentStatSchema = z.strictObject({
  id: z.string(),
  description: z.string(),
  name: z.string(),
  parentName: z.string(),
  originType: CharacterOriginTypeSchema,
  unlockedAt: SequenceSchema.optional(),
  stat: z.union([
    z.enum(Object.values(CharacterStat)),
    z.enum(Object.values(EnemyStat)),
  ]),
  value: ParameterizedNumberSchema,
  tags: z.array(z.string()),
  alternativeDefinitions: z
    .partialRecord(SequenceSchema, CharacterChildPermanentStatSchema)
    .optional(),
});

const CharacterCapabilitiesSchema = z.object({
  attacks: z.array(CharacterAttackSchema),
  modifiers: z.array(CharacterModifierSchema),
  permanentStats: z.array(CharacterPermanentStatSchema),
});

const CharacterSchema = BaseEntitySchema.extend({
  attribute: z.enum(Object.values(Attribute)),
  capabilities: CharacterCapabilitiesSchema,
}).refine(hasValidCharacterStatTags, CHARACTER_STAT_TAGS_ERROR);

// --- Validation Tests ---

const DATA_ROOT = path.join(process.cwd(), '.local/data');

const validateDirectory = (directory: string, schema: z.ZodSchema) => {
  const fullPath = path.join(DATA_ROOT, directory);
  if (!fs.existsSync(fullPath)) return;

  const files = fs.readdirSync(fullPath).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    it(`validates ${directory}/${file}`, () => {
      const filePath = path.join(fullPath, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      try {
        schema.parse(content);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const issues = error.issues.map((issue) => {
            const pathString = issue.path.join('.');
            return `  - ${pathString}: ${issue.message}`;
          });
          throw new Error(
            `Validation failed for ${directory}/${file}:\n${issues.join('\n')}`,
          );
        }
        throw error;
      }
    });
  }
};

describe('Game Data Validation', () => {
  describe('Characters', () => {
    validateDirectory('character/parsed', CharacterSchema);
  });

  describe('Echoes', () => {
    validateDirectory('echo/parsed', EchoSchema);
  });

  describe('Echo Sets', () => {
    validateDirectory('echo-set/parsed', EchoSetSchema);
  });

  describe('Weapons', () => {
    validateDirectory('weapon/parsed', WeaponSchema);
  });

  describe('Characters', () => {
    validateDirectory('character/parsed', CharacterSchema);
  });
});

import fs from 'node:fs';
import path from 'node:path';

import { describe, it } from 'vitest';
import { z } from 'zod';

import { OriginType, Sequence } from '@/services/game-data/character/types';
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

const LinearParameterizedNumberSchema = z.object({
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  parameterConfigs: z.record(
    z.union([z.string(), z.number()]),
    LinearScalingParameterConfigSchema,
  ),
  offset: z.number().optional(),
});

const RotationRuntimeResolvableNumberSchema = LinearParameterizedNumberSchema.extend({
  resolveWith: z.string(),
});

const UserParameterizedNumberSchema = LinearParameterizedNumberSchema;

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
      if (!stat.tags.every(isValidTag)) return false;
    }
  }
  for (const permanentStat of character.capabilities.permanentStats) {
    if (!permanentStat.tags.every(isValidTag)) return false;
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

const ModifierSchema = CapabilitySchema.extend({
  target: z.union([
    z.enum(['team', 'enemy', 'activeCharacter', 'self']),
    z.array(z.union([z.literal(1), z.literal(2), z.literal(3)])).nonempty(),
  ]),
  modifiedStats: z.array(StatSchema).nonempty(),
});

const PermanentStatSchema = CapabilitySchema.and(StatSchema);

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

const WeaponSchema = BaseEntitySchema.extend({
  capabilities: z.record(z.enum(['1', '2', '3', '4', '5']), StrictCapabilitiesSchema),
});

// --- Character Schemas ---

const SequenceSchema = z.enum(Object.values(Sequence));

const OriginTypeSchema = z.enum(Object.values(OriginType));

const CharacterBaseItemSchema = z.object({
  name: z.string(),
  parentName: z.string(),
  originType: OriginTypeSchema,
  unlockedAt: SequenceSchema.optional(),
  disabledAt: SequenceSchema.optional(),
});

const CharacterAttackTagsSchema = z
  .array(BaseAttackStatTagSchema.exclude(Object.values(Attribute)))
  .refine(hasAtMostOneMutuallyExclusiveTag, MUTUALLY_EXCLUSIVE_TAG_ERROR);

const CharacterAttackSchema = CapabilitySchema.extend({
  tags: CharacterAttackTagsSchema,
  scalingStat: z.enum(Object.values(AbilityAttribute)),
  motionValues: MotionValuesSchema,
}).and(CharacterBaseItemSchema);

const CharacterModifierSchema = ModifierSchema.and(CharacterBaseItemSchema);

const CharacterPermanentStatSchema = PermanentStatSchema.and(CharacterBaseItemSchema);

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

describe('Game Data Validation', () => {
  const validateDir = (dir: string, schema: z.ZodSchema) => {
    const fullPath = path.join(DATA_ROOT, dir);
    if (!fs.existsSync(fullPath)) return;

    const files = fs.readdirSync(fullPath).filter((f) => f.endsWith('.json'));

    files.forEach((file) => {
      it(`validates ${dir}/${file}`, () => {
        const filePath = path.join(fullPath, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        try {
          schema.parse(content);
        } catch (error) {
          if (error instanceof z.ZodError) {
            const issues = error.issues.map((issue) => {
              const pathStr = issue.path.join('.');
              return `  - ${pathStr}: ${issue.message}`;
            });
            throw new Error(
              `Validation failed for ${dir}/${file}:\n${issues.join('\n')}`,
            );
          }
          throw error;
        }
      });
    });
  };

  describe('Echoes', () => {
    validateDir('echo/parsed', EchoSchema);
  });

  describe('Echo Sets', () => {
    validateDir('echo-set/parsed', EchoSetSchema);
  });

  describe('Weapons', () => {
    validateDir('weapon/parsed', WeaponSchema);
  });

  describe('Characters', () => {
    validateDir('character/parsed', CharacterSchema);
  });
});

import fs from 'node:fs';
import path from 'node:path';

import { describe, it } from 'vitest';
import { z } from 'zod';

// --- Shared Schemas ---

const TagSchema = z.string();

const TaggedSchema = z.object({
  tags: z.array(TagSchema),
});

const DescribableSchema = z.object({
  description: z.string(),
});

const LinearScalingParameterConfigSchema = z.object({
  scale: z.number(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  offset: z.number().optional(),
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

const TaggedStatValueSchema = TaggedSchema.extend({
  value: ParameterizedNumberSchema,
});

// Mutually exclusive attack category tags - an attack must have exactly one
const MUTUALLY_EXCLUSIVE_TAGS = [
  'basicAttack',
  'heavyAttack',
  'resonanceSkill',
  'resonanceLiberation',
] as const;

const AttackTagsSchema = z.array(TagSchema).refine(
  (tags) => {
    const exclusiveTagsPresent = tags.filter((tag) =>
      MUTUALLY_EXCLUSIVE_TAGS.includes(tag as (typeof MUTUALLY_EXCLUSIVE_TAGS)[number]),
    );
    return exclusiveTagsPresent.length <= 1;
  },
  {
    message: `Attack must have exactly one of: ${MUTUALLY_EXCLUSIVE_TAGS.join(', ')}`,
  },
);

const AttackSchema = DescribableSchema.extend({
  tags: AttackTagsSchema,
  scalingStat: z.enum(['hp', 'atk', 'def']),
  motionValues: z.array(z.number()).optional(),
  parameterizedMotionValues: z.array(UserParameterizedNumberSchema).optional(),
});

const ModifierSchema = z
  .object({
    target: z.union([
      z.enum(['team', 'enemy', 'activeCharacter', 'self']),
      z.array(z.union([z.literal(1), z.literal(2), z.literal(3)])),
    ]),
    modifiedStats: z.record(z.string(), z.array(TaggedStatValueSchema)),
  })
  .and(DescribableSchema);

const PermanentStatsSchema = z.record(
  z.string(),
  z.array(TaggedStatValueSchema.and(DescribableSchema)),
);

const BaseEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
});

// --- Echo Schemas ---

const EchoSchema = BaseEntitySchema.extend({
  echoSetIds: z.array(z.string()),
  attack: AttackSchema.optional(),
  modifiers: z.array(ModifierSchema),
  stats: PermanentStatsSchema,
});

// --- Echo Set Schemas ---

const SetEffectSchema = z.object({
  modifiers: z.array(ModifierSchema),
  stats: PermanentStatsSchema,
});

const EchoSetSchema = BaseEntitySchema.extend({
  setEffects: z.object({
    '2': SetEffectSchema.optional(),
    '3': SetEffectSchema.optional(),
    '5': SetEffectSchema.optional(),
  }),
});

// --- Weapon Schemas ---

const RefinePropertiesSchema = z.object({
  attack: AttackSchema.optional(),
  modifiers: z.array(ModifierSchema),
  stats: PermanentStatsSchema,
});

const WeaponSchema = BaseEntitySchema.extend({
  attributes: z.record(z.enum(['1', '2', '3', '4', '5']), RefinePropertiesSchema),
  baseStats: z.record(z.string(), z.number()),
});

// --- Character Schemas ---

const SequenceSchema = z.enum(['s1', 's2', 's3', 's4', 's5', 's6']);

const CharacterBaseItemSchema = z.object({
  name: z.string(),
  parentName: z.string(),
  originType: z.string(),
  unlockedAt: SequenceSchema.optional(),
  disabledAt: SequenceSchema.optional(),
});

const CharacterAttackSchema = AttackSchema.and(CharacterBaseItemSchema);

const CharacterModifierSchema = ModifierSchema.and(CharacterBaseItemSchema);

const CharacterStatsSchema = z.record(
  z.string(),
  z.array(TaggedStatValueSchema.and(DescribableSchema).and(CharacterBaseItemSchema)),
);

const CharacterSchema = BaseEntitySchema.extend({
  attribute: z.string(),
  attacks: z.array(CharacterAttackSchema),
  modifiers: z.array(CharacterModifierSchema),
  stats: CharacterStatsSchema,
});

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

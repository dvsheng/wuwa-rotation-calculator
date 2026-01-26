import fs from 'node:fs';
import path from 'node:path';

import { describe, it } from 'vitest';
import { z } from 'zod';

// --- Shared Schemas ---

const TagSchema = z.string();

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

// New flattened stat structure
const StatSchema = z.object({
  stat: z.string(),
  value: ParameterizedNumberSchema,
  tags: z.array(TagSchema),
});

const DescribableSchema = z.object({
  description: z.string(),
});

// Mutually exclusive attack category tags - an attack must have at most one
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
    message: `Attack must have at most one of: ${MUTUALLY_EXCLUSIVE_TAGS.join(', ')}`,
  },
);

const AttackSchema = DescribableSchema.extend({
  tags: AttackTagsSchema,
  scalingStat: z.enum(['hp', 'atk', 'def']),
  motionValues: z.array(z.number().or(UserParameterizedNumberSchema)),
});

const ModifierSchema = z
  .object({
    target: z
      .union([
        z.enum(['team', 'enemy', 'activeCharacter', 'self']),
        z.array(z.union([z.literal(1), z.literal(2), z.literal(3)])),
      ])
      .optional(),
    modifiedStats: z.array(StatSchema),
  })
  .and(DescribableSchema);

const PermanentStatSchema = StatSchema.and(DescribableSchema);

const CapabilitiesSchema = z.object({
  attacks: z.array(AttackSchema),
  modifiers: z.array(ModifierSchema),
  permanentStats: z.array(PermanentStatSchema),
});

const BaseEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
});

// --- Echo Schemas ---

const EchoSchema = BaseEntitySchema.extend({
  echoSetIds: z.array(z.string()),
  capabilities: CapabilitiesSchema,
});

// --- Echo Set Schemas ---

const EchoSetSchema = BaseEntitySchema.extend({
  setEffects: z.record(z.enum(['2', '3', '5']), CapabilitiesSchema.optional()),
});

// --- Weapon Schemas ---

const WeaponSchema = BaseEntitySchema.extend({
  capabilities: z.record(z.enum(['1', '2', '3', '4', '5']), CapabilitiesSchema),
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

const CharacterPermanentStatSchema = PermanentStatSchema.and(CharacterBaseItemSchema);

const CharacterCapabilitiesSchema = z.object({
  attacks: z.array(CharacterAttackSchema),
  modifiers: z.array(CharacterModifierSchema),
  permanentStats: z.array(CharacterPermanentStatSchema),
});

const CharacterSchema = BaseEntitySchema.extend({
  attribute: z.string(),
  capabilities: CharacterCapabilitiesSchema,
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

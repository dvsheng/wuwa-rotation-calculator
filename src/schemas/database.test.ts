import { describe, expect, it } from 'vitest';

import { CharacterStat } from '@/types';

import { DatabaseDynamicNumberSchema } from './database';

describe('DatabaseDynamicNumberSchema', () => {
  describe('nested dynamic numbers', () => {
    it('parses a RotationRuntimeResolvable whose scale is itself a RotationRuntimeResolvable', () => {
      // Outer: resolves against character stats
      // Inner (scale): also resolves against character stats — e.g. crit DMG that scales
      // with a value that is itself derived from another stat at runtime.
      const input = {
        resolveWith: 'self',
        parameterConfigs: {
          [CharacterStat.CRITICAL_DAMAGE]: {
            scale: {
              resolveWith: 'self',
              parameterConfigs: {
                [CharacterStat.CRITICAL_RATE]: {
                  scale: 2,
                  minimum: 1.5,
                  maximum: 1.75,
                },
              },
            },
            minimum: 0,
            maximum: 0.5,
          },
        },
      };

      const result = DatabaseDynamicNumberSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('parses a RotationRuntimeResolvable whose scale is a UserParameterized number', () => {
      const input = {
        resolveWith: 'self',
        parameterConfigs: {
          [CharacterStat.ATTACK_FLAT]: {
            scale: {
              parameterConfigs: {
                '0': { scale: 0.5 },
              },
            },
            minimum: 0,
          },
        },
      };

      const result = DatabaseDynamicNumberSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('parses a UserParameterized whose scale is a RotationRuntimeResolvable', () => {
      const input = {
        parameterConfigs: {
          '0': {
            scale: {
              resolveWith: 'self',
              parameterConfigs: {
                [CharacterStat.CRITICAL_RATE]: {
                  scale: 3,
                },
              },
            },
          },
        },
      };

      const result = DatabaseDynamicNumberSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects an object with an invalid nested scale', () => {
      const input = {
        resolveWith: 'self',
        parameterConfigs: {
          [CharacterStat.CRITICAL_DAMAGE]: {
            scale: { notAValidShape: true },
          },
        },
      };

      const result = DatabaseDynamicNumberSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});

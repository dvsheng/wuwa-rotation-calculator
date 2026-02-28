import { describe, expect, it } from 'vitest';

import type { ParameterInstance } from '@/schemas/rotation';
import type { RotationRuntimeResolvableNumber, UserParameterizedNumber } from '@/types';
import { CharacterStat } from '@/types';

import { resolveUserParameterizedValues } from './resolve-user-parameterized-values';

describe('resolveUserParameterizedValues', () => {
  describe('basic resolution', () => {
    it('should resolve UserParameterizedNumber using parameterValues from same object', () => {
      const userParameter: UserParameterizedNumber = {
        offset: 10,
        parameterConfigs: {
          '0': { scale: 2 },
        },
      };

      const input = {
        value: userParameter,
        parameterValues: [{ id: '0', value: 50 }] as Array<ParameterInstance>,
      };

      const result = resolveUserParameterizedValues(input);

      // 10 + (50 * 2) = 110
      expect(result).toEqual({
        value: 110,
      });
    });

    it('should resolve array of UserParameterizedNumber', () => {
      const userParameter1: UserParameterizedNumber = {
        offset: 5,
        parameterConfigs: {
          '0': { scale: 1 },
        },
      };

      const userParameter2: UserParameterizedNumber = {
        offset: 0,
        parameterConfigs: {
          '1': { scale: 3 },
        },
      };

      const input = {
        values: [userParameter1, 100, userParameter2],
        parameterValues: [
          { id: '0', value: 10 },
          { id: '1', value: 20 },
        ] as Array<ParameterInstance>,
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        values: [
          15, // 5 + (10 * 1)
          100,
          60, // 0 + (20 * 3)
        ],
      });
    });

    it('should handle plain numbers without modification', () => {
      const input = {
        values: [10, 20, 30],
        parameterValues: [] as Array<ParameterInstance>,
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        values: [10, 20, 30],
      });
    });

    it('should strip parameterValues from output', () => {
      const input = {
        value: 100,
        parameterValues: [{ id: '0', value: 50 }] as Array<ParameterInstance>,
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        value: 100,
      });
      expect(result).not.toHaveProperty('parameterValues');
    });
  });

  describe('nested object resolution', () => {
    it('should use closest parent parameterValues', () => {
      const userParameter: UserParameterizedNumber = {
        offset: 0,
        parameterConfigs: {
          '0': { scale: 1 },
        },
      };

      const input = {
        // Grandparent level
        parameterValues: [{ id: '0', value: 999 }] as Array<ParameterInstance>,
        child: {
          // Parent level - this should be used
          parameterValues: [{ id: '0', value: 50 }] as Array<ParameterInstance>,
          value: userParameter,
        },
      };

      const result = resolveUserParameterizedValues(input);

      // Should use parent's value (50), not grandparent's (999)
      expect(result).toEqual({
        child: {
          value: 50, // 0 + (50 * 1)
        },
      });
    });

    it('should inherit parameterValues from parent when child has none', () => {
      const userParameter: UserParameterizedNumber = {
        offset: 10,
        parameterConfigs: {
          '0': { scale: 2 },
        },
      };

      const input = {
        parameterValues: [{ id: '0', value: 25 }] as Array<ParameterInstance>,
        child: {
          // No parameterValues here - should use parent's
          nested: {
            value: userParameter,
          },
        },
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        child: {
          nested: {
            value: 60, // 10 + (25 * 2)
          },
        },
      });
    });

    it('should resolve deeply nested structures', () => {
      const userParameter: UserParameterizedNumber = {
        offset: 5,
        parameterConfigs: {
          '0': { scale: 3 },
        },
      };

      const input = {
        level1: {
          parameterValues: [{ id: '0', value: 10 }] as Array<ParameterInstance>,
          level2: {
            level3: {
              values: [userParameter, 100],
            },
          },
        },
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        level1: {
          level2: {
            level3: {
              values: [35, 100], // 5 + (10 * 3) = 35
            },
          },
        },
      });
    });
  });

  describe('error handling', () => {
    it('should throw error when UserParameterizedNumber has no parent with parameterValues', () => {
      const userParameter: UserParameterizedNumber = {
        offset: 10,
        parameterConfigs: {
          '0': { scale: 2 },
        },
      };

      const input = {
        value: userParameter,
      };

      expect(() => resolveUserParameterizedValues(input)).toThrow(
        'Encountered UserParameterizedNumber without parameterValues in any parent object',
      );
    });

    it('should throw error when calling with UserParameterizedNumber at root level', () => {
      const userParameter: UserParameterizedNumber = {
        offset: 10,
        parameterConfigs: {
          '0': { scale: 2 },
        },
      };

      expect(() => resolveUserParameterizedValues(userParameter)).toThrow(
        'Encountered UserParameterizedNumber without parameterValues in any parent object',
      );
    });

    it('should throw error for nested UserParameterizedNumber without parameterValues', () => {
      const userParameter: UserParameterizedNumber = {
        offset: 5,
        parameterConfigs: {
          '0': { scale: 1 },
        },
      };

      const input = {
        nested: {
          deepNested: {
            value: userParameter,
          },
        },
      };

      expect(() => resolveUserParameterizedValues(input)).toThrow(
        'Encountered UserParameterizedNumber without parameterValues in any parent object',
      );
    });
  });

  describe('RotationRuntimeResolvableNumber handling', () => {
    it('should not resolve RotationRuntimeResolvableNumber', () => {
      const runtimeResolvable: RotationRuntimeResolvableNumber = {
        resolveWith: 0,
        offset: 10,
        parameterConfigs: {
          [CharacterStat.ATTACK_FLAT]: { scale: 0.5 },
        },
      };

      const input = {
        value: runtimeResolvable,
        parameterValues: [{ id: '0', value: 100 }] as Array<ParameterInstance>,
      };

      const result = resolveUserParameterizedValues(input);

      // Should pass through unchanged (not resolved)
      expect(result).toEqual({
        value: runtimeResolvable,
      });
    });

    it('should preserve RotationRuntimeResolvableNumber in arrays', () => {
      const runtimeResolvable: RotationRuntimeResolvableNumber = {
        resolveWith: 1,
        offset: 5,
        parameterConfigs: {
          [CharacterStat.HP_FLAT]: { scale: 0.01 },
        },
      };

      const input = {
        values: [runtimeResolvable, 100, 200],
        parameterValues: [{ id: '0', value: 50 }] as Array<ParameterInstance>,
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        values: [runtimeResolvable, 100, 200],
      });
    });

    it('should not confuse RotationRuntimeResolvableNumber with UserParameterizedNumber', () => {
      const userParameter: UserParameterizedNumber = {
        offset: 20,
        parameterConfigs: {
          '0': { scale: 2 },
        },
      };

      const runtimeResolvable: RotationRuntimeResolvableNumber = {
        resolveWith: 0,
        offset: 10,
        parameterConfigs: {
          [CharacterStat.CRITICAL_RATE]: { scale: 1 },
        },
      };

      const input = {
        userValue: userParameter,
        runtimeValue: runtimeResolvable,
        parameterValues: [{ id: '0', value: 15 }] as Array<ParameterInstance>,
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        userValue: 50, // 20 + (15 * 2) - resolved
        runtimeValue: runtimeResolvable, // unchanged
      });
    });
  });

  describe('complex real-world scenarios', () => {
    it('should resolve attack with damage instance motion values', () => {
      const motionValue1: UserParameterizedNumber = {
        offset: 100,
        parameterConfigs: {
          '0': { scale: 10 },
        },
      };

      const attack = {
        id: 1,
        characterId: 'char-1',
        damageInstances: [
          { motionValue: motionValue1, tags: ['BasicAttack'], scalingStat: 'atk' },
          { motionValue: 200, tags: ['BasicAttack'], scalingStat: 'atk' },
          { motionValue: 150, tags: ['BasicAttack'], scalingStat: 'atk' },
        ],
        parameterValues: [{ id: '0', value: 5 }] as Array<ParameterInstance>,
      };

      const result = resolveUserParameterizedValues(attack);

      expect(result).toEqual({
        id: 1,
        characterId: 'char-1',
        damageInstances: [
          { motionValue: 150, tags: ['BasicAttack'], scalingStat: 'atk' }, // 100 + (5 * 10) = 150
          { motionValue: 200, tags: ['BasicAttack'], scalingStat: 'atk' },
          { motionValue: 150, tags: ['BasicAttack'], scalingStat: 'atk' },
        ],
      });
    });

    it('should resolve modifier with stat values', () => {
      const statValue: UserParameterizedNumber = {
        offset: 0.5,
        parameterConfigs: {
          '0': { scale: 0.01 },
        },
      };

      const modifier = {
        id: 1,
        modifiedStats: [
          { stat: CharacterStat.CRITICAL_DAMAGE, value: statValue, tags: ['ALL'] },
          { stat: CharacterStat.CRITICAL_RATE, value: 0.2, tags: ['ALL'] },
        ],
        parameterValues: [{ id: '0', value: 50 }] as Array<ParameterInstance>,
      };

      const result = resolveUserParameterizedValues(modifier);

      expect(result).toEqual({
        id: 1,
        modifiedStats: [
          { stat: CharacterStat.CRITICAL_DAMAGE, value: 1, tags: ['ALL'] }, // 0.5 + (50 * 0.01)
          { stat: CharacterStat.CRITICAL_RATE, value: 0.2, tags: ['ALL'] },
        ],
      });
    });

    it('should handle mixed arrays with different parameter contexts', () => {
      const userParameter1: UserParameterizedNumber = {
        offset: 0,
        parameterConfigs: {
          '0': { scale: 1 },
        },
      };

      const userParameter2: UserParameterizedNumber = {
        offset: 100,
        parameterConfigs: {
          '0': { scale: 2 },
        },
      };

      const input = {
        items: [
          {
            value: userParameter1,
            parameterValues: [{ id: '0', value: 10 }] as Array<ParameterInstance>,
          },
          {
            value: userParameter2,
            parameterValues: [{ id: '0', value: 20 }] as Array<ParameterInstance>,
          },
        ],
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        items: [
          { value: 10 }, // 0 + (10 * 1)
          { value: 140 }, // 100 + (20 * 2)
        ],
      });
    });
  });
});

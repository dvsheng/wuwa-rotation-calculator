import { describe, expect, it } from 'vitest';

import type { ParameterInstance } from '@/schemas/rotation';
import type {
  NumberNode as GameDataNumberNode,
  UserResolvableNumber,
} from '@/services/game-data';
import type { NumberNode } from '@/services/rotation-calculator/core/resolve-runtime-number';
import { CharacterStat } from '@/types';

import { resolveUserParameterizedValues } from './resolve-user-parameterized-values';

const parameterNode = (
  parameterId: '0' | '1' | '2',
  minimum?: number,
  maximum?: number,
  scale?: number,
): UserResolvableNumber => ({
  type: 'userParameterizedNumber',
  parameterId,
  scale,
  minimum,
  maximum,
});

const parameterValues = (values: Record<string, number>): Array<ParameterInstance> =>
  Object.entries(values).map(([id, value]) => ({
    id,
    value,
  })) as Array<ParameterInstance>;

describe('resolveUserParameterizedValues', () => {
  describe('basic resolution', () => {
    it('resolves a user-parameterized leaf to the matching numeric value', () => {
      const input = {
        value: parameterNode('0', 10),
        parameterValues: parameterValues({ 0: 50 }),
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        value: 50,
      });
    });

    it('clamps a user-parameterized leaf up to its minimum bound', () => {
      const input = {
        value: parameterNode('0', 10, 20),
        parameterValues: parameterValues({ 0: 5 }),
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        value: 10,
      });
    });

    it('clamps a user-parameterized leaf down to its maximum bound', () => {
      const input = {
        value: parameterNode('0', 10, 20),
        parameterValues: parameterValues({ 0: 25 }),
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        value: 20,
      });
    });

    it('clamps the raw parameter value before applying scale', () => {
      const input = {
        value: parameterNode('0', 0, 2, 0.06),
        parameterValues: parameterValues({ 0: 5 }),
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        value: 0.12,
      });
    });

    it('resolves arrays and preserves non-parameterized values', () => {
      const input = {
        values: [parameterNode('0'), 100, parameterNode('1')],
        parameterValues: parameterValues({ 0: 10, 1: 20 }),
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        values: [10, 100, 20],
      });
    });

    it('preserves parent expression nodes while replacing parameter leaves', () => {
      const input = {
        value: {
          type: 'sum',
          operands: [100, parameterNode('0')],
        } satisfies GameDataNumberNode,
        parameterValues: parameterValues({ 0: 50 }),
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        value: {
          type: 'sum',
          operands: [100, 50],
        },
      });
    });

    it('strips parameterValues from output', () => {
      const input = {
        value: 100,
        parameterValues: parameterValues({ 0: 50 }),
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        value: 100,
      });
      expect(result).not.toHaveProperty('parameterValues');
    });
  });

  describe('nested object resolution', () => {
    it('uses the closest parent parameterValues', () => {
      const input = {
        parameterValues: parameterValues({ 0: 999 }),
        child: {
          parameterValues: parameterValues({ 0: 50 }),
          value: parameterNode('0'),
        },
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        child: {
          value: 50,
        },
      });
    });

    it('inherits parameterValues from a parent object when needed', () => {
      const input = {
        parameterValues: parameterValues({ 0: 25 }),
        child: {
          nested: {
            value: {
              type: 'product',
              operands: [parameterNode('0'), 2],
            } satisfies GameDataNumberNode,
          },
        },
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        child: {
          nested: {
            value: {
              type: 'product',
              operands: [25, 2],
            },
          },
        },
      });
    });

    it('resolves deeply nested structures recursively', () => {
      const input = {
        level1: {
          parameterValues: parameterValues({ 0: 10 }),
          level2: {
            level3: {
              values: [
                {
                  type: 'sum',
                  operands: [5, parameterNode('0')],
                } satisfies GameDataNumberNode,
                100,
              ],
            },
          },
        },
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        level1: {
          level2: {
            level3: {
              values: [
                {
                  type: 'sum',
                  operands: [5, 10],
                },
                100,
              ],
            },
          },
        },
      });
    });
  });

  describe('error handling', () => {
    it('throws when a user-parameterized value has no parent parameterValues', () => {
      const input = {
        value: parameterNode('0'),
      };

      expect(() => resolveUserParameterizedValues(input)).toThrow(
        'Encountered userParameterizedNumber without parameterValues in any parent object',
      );
    });

    it('throws when called with a user-parameterized node at the root', () => {
      expect(() => resolveUserParameterizedValues(parameterNode('0'))).toThrow(
        'Encountered userParameterizedNumber without parameterValues in any parent object',
      );
    });

    it('throws for nested user-parameterized values without inherited context', () => {
      const input = {
        nested: {
          deepNested: {
            value: parameterNode('0'),
          },
        },
      };

      expect(() => resolveUserParameterizedValues(input)).toThrow(
        'Encountered userParameterizedNumber without parameterValues in any parent object',
      );
    });
  });

  describe('non-user nodes', () => {
    it('preserves stat-parameterized runtime nodes', () => {
      const runtimeResolvable: NumberNode = {
        type: 'statParameterizedNumber',
        stat: CharacterStat.ATTACK_FLAT,
        characterIndex: 0,
      };

      const input = {
        value: runtimeResolvable,
        parameterValues: parameterValues({ 0: 100 }),
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        value: runtimeResolvable,
      });
    });

    it('does not confuse stat-parameterized nodes with user-parameterized nodes', () => {
      const runtimeResolvable: NumberNode = {
        type: 'statParameterizedNumber',
        stat: CharacterStat.CRITICAL_RATE,
        characterIndex: 0,
      };

      const input = {
        userValue: {
          type: 'sum',
          operands: [20, parameterNode('0')],
        } satisfies GameDataNumberNode,
        runtimeValue: runtimeResolvable,
        parameterValues: parameterValues({ 0: 15 }),
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        userValue: {
          type: 'sum',
          operands: [20, 15],
        },
        runtimeValue: runtimeResolvable,
      });
    });
  });

  describe('real-world structures', () => {
    it('resolves attack damage instance motion values without changing surrounding shape', () => {
      const attack = {
        id: 1,
        characterId: 'char-1',
        damageInstances: [
          {
            motionValue: {
              type: 'sum',
              operands: [100, parameterNode('0')],
            } satisfies GameDataNumberNode,
            tags: ['BasicAttack'],
            scalingStat: 'atk',
          },
          { motionValue: 200, tags: ['BasicAttack'], scalingStat: 'atk' },
          { motionValue: 150, tags: ['BasicAttack'], scalingStat: 'atk' },
        ],
        parameterValues: parameterValues({ 0: 50 }),
      };

      const result = resolveUserParameterizedValues(attack);

      expect(result).toEqual({
        id: 1,
        characterId: 'char-1',
        damageInstances: [
          {
            motionValue: {
              type: 'sum',
              operands: [100, 50],
            },
            tags: ['BasicAttack'],
            scalingStat: 'atk',
          },
          { motionValue: 200, tags: ['BasicAttack'], scalingStat: 'atk' },
          { motionValue: 150, tags: ['BasicAttack'], scalingStat: 'atk' },
        ],
      });
    });

    it('resolves modifier stat values while preserving other entries', () => {
      const modifier = {
        id: 1,
        modifiedStats: [
          {
            stat: CharacterStat.CRITICAL_DAMAGE,
            value: {
              type: 'sum',
              operands: [0.5, parameterNode('0')],
            } satisfies GameDataNumberNode,
            tags: ['ALL'],
          },
          { stat: CharacterStat.CRITICAL_RATE, value: 0.2, tags: ['ALL'] },
        ],
        parameterValues: parameterValues({ 0: 0.5 }),
      };

      const result = resolveUserParameterizedValues(modifier);

      expect(result).toEqual({
        id: 1,
        modifiedStats: [
          {
            stat: CharacterStat.CRITICAL_DAMAGE,
            value: {
              type: 'sum',
              operands: [0.5, 0.5],
            },
            tags: ['ALL'],
          },
          { stat: CharacterStat.CRITICAL_RATE, value: 0.2, tags: ['ALL'] },
        ],
      });
    });

    it('handles mixed arrays with different parameter contexts', () => {
      const input = {
        items: [
          {
            value: parameterNode('0'),
            parameterValues: parameterValues({ 0: 10 }),
          },
          {
            value: {
              type: 'sum',
              operands: [100, parameterNode('0')],
            } satisfies GameDataNumberNode,
            parameterValues: parameterValues({ 0: 40 }),
          },
        ],
      };

      const result = resolveUserParameterizedValues(input);

      expect(result).toEqual({
        items: [
          { value: 10 },
          {
            value: {
              type: 'sum',
              operands: [100, 40],
            },
          },
        ],
      });
    });
  });
});

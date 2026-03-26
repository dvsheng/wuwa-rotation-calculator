import { describe, expect, it } from 'vitest';

import { CharacterStat } from '@/types';

import { NumberNodeSchema } from './types';

describe('NumberNodeSchema', () => {
  describe('recursive number nodes', () => {
    it('parses a stat-based expression tree', () => {
      const input = {
        type: 'product',
        operands: [
          {
            type: 'clamp',
            operand: {
              type: 'sum',
              operands: [
                {
                  type: 'statParameterizedNumber',
                  stat: CharacterStat.CRITICAL_RATE,
                  resolveWith: 'self',
                },
                -1.5,
              ],
            },
            minimum: 0,
            maximum: 0.25,
          },
          2,
        ],
      };

      const result = NumberNodeSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('parses a stat-based expression whose clamp bounds are user-parameterized', () => {
      const input = {
        type: 'clamp',
        operand: {
          type: 'statParameterizedNumber',
          stat: CharacterStat.ATTACK_FLAT,
          resolveWith: 'self',
        },
        minimum: {
          type: 'userParameterizedNumber',
          parameterId: '0',
          minimum: 0,
        },
        maximum: {
          type: 'userParameterizedNumber',
          parameterId: '1',
          maximum: 0.5,
        },
      };

      const result = NumberNodeSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('parses a conditional expression with a user-parameterized threshold', () => {
      const input = {
        type: 'conditional',
        operand: 1.75,
        operator: '>=',
        threshold: {
          type: 'userParameterizedNumber',
          parameterId: '2',
          minimum: 1.5,
          maximum: 1.75,
        },
        valueIfTrue: {
          type: 'sum',
          operands: [0.5, 2],
        },
        valueIfFalse: 0,
      };

      const result = NumberNodeSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects an object with an invalid nested node', () => {
      const input = {
        type: 'sum',
        operands: [
          2,
          {
            type: 'product',
            operands: [{ notAValidShape: true }],
          },
        ],
      };

      const result = NumberNodeSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});

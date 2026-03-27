import { describe, expect, it } from 'vitest';

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

describe('resolveUserParameterizedValues', () => {
  describe('basic resolution', () => {
    it('resolves a user-parameterized leaf to the matching numeric value', () => {
      const input = {
        value: parameterNode('0', 10),
      };

      const result = resolveUserParameterizedValues(input, { 0: 50 });

      expect(result).toEqual({
        value: 50,
      });
    });

    it('allows zero-valued parameters', () => {
      const input = {
        value: parameterNode('0'),
      };

      const result = resolveUserParameterizedValues(input, { 0: 0 });

      expect(result).toEqual({
        value: 0,
      });
    });

    it('clamps a user-parameterized leaf up to its minimum bound', () => {
      const input = {
        value: parameterNode('0', 10, 20),
      };

      const result = resolveUserParameterizedValues(input, { 0: 5 });

      expect(result).toEqual({
        value: 10,
      });
    });

    it('clamps a user-parameterized leaf down to its maximum bound', () => {
      const input = {
        value: parameterNode('0', 10, 20),
      };

      const result = resolveUserParameterizedValues(input, { 0: 25 });

      expect(result).toEqual({
        value: 20,
      });
    });

    it('clamps the raw parameter value before applying scale', () => {
      const input = {
        value: parameterNode('0', 0, 2, 0.06),
      };

      const result = resolveUserParameterizedValues(input, { 0: 5 });

      expect(result).toEqual({
        value: 0.12,
      });
    });

    it('resolves arrays and preserves non-parameterized values', () => {
      const input = {
        values: [parameterNode('0'), 100, parameterNode('1')],
      };

      const result = resolveUserParameterizedValues(input, { 0: 10, 1: 20 });

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
      };

      const result = resolveUserParameterizedValues(input, { 0: 50 });

      expect(result).toEqual({
        value: {
          type: 'sum',
          operands: [100, 50],
        },
      });
    });
  });

  describe('error handling', () => {
    it('throws when no parameter map is provided', () => {
      const input = {
        value: parameterNode('0'),
      };

      expect(() => resolveUserParameterizedValues(input)).toThrow(
        'Encountered userParameterizedNumber without matching parameterValues',
      );
    });

    it('throws when the requested parameter ID is missing', () => {
      const input = {
        value: parameterNode('0'),
      };

      expect(() => resolveUserParameterizedValues(input, { 1: 10 })).toThrow(
        'Encountered userParameterizedNumber without matching parameterValues',
      );
    });

    it('throws when called with a user-parameterized node at the root', () => {
      expect(() => resolveUserParameterizedValues(parameterNode('0'))).toThrow(
        'Encountered userParameterizedNumber without matching parameterValues',
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
      };

      const result = resolveUserParameterizedValues(input, { 0: 100 });

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
      };

      const result = resolveUserParameterizedValues(input, { 0: 15 });

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
      };

      const result = resolveUserParameterizedValues(attack, { 0: 50 });

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
      };

      const result = resolveUserParameterizedValues(modifier, { 0: 0.5 });

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
  });
});

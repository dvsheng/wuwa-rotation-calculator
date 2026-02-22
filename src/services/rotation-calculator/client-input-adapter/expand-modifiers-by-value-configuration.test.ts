import { describe, expect, it } from 'vitest';

import type { ModifierInstance } from '@/schemas/rotation';

import { expandModifiersByValueConfiguration } from './expand-modifiers-by-value-configuration';

const baseModifier: ModifierInstance = {
  instanceId: 'buff-1',
  id: 10,
  characterId: 1001,
  x: 2,
  y: 0,
  w: 3,
  h: 1,
};

describe('expandModifiersByValueConfiguration', () => {
  describe('pass-through cases (no expansion)', () => {
    it('returns the modifier unchanged when parameterValues is absent', () => {
      const modifier: ModifierInstance = { ...baseModifier };
      expect(expandModifiersByValueConfiguration(modifier)).toEqual([modifier]);
    });

    it('returns the modifier unchanged when parameterValues is empty', () => {
      const modifier: ModifierInstance = { ...baseModifier, parameterValues: [] };
      expect(expandModifiersByValueConfiguration(modifier)).toEqual([modifier]);
    });

    it('returns the modifier unchanged when no parameter has valueConfiguration', () => {
      const modifier: ModifierInstance = {
        ...baseModifier,
        parameterValues: [{ id: '0', value: 50 }],
      };
      expect(expandModifiersByValueConfiguration(modifier)).toEqual([modifier]);
    });

    it('returns the modifier unchanged when valueConfiguration is an empty array', () => {
      const modifier: ModifierInstance = {
        ...baseModifier,
        parameterValues: [{ id: '0', value: 50, valueConfiguration: [] }],
      };
      expect(expandModifiersByValueConfiguration(modifier)).toEqual([modifier]);
    });
  });

  describe('expansion with valueConfiguration', () => {
    it('expands a w=3 modifier into three w=1 modifiers at consecutive x positions', () => {
      const modifier: ModifierInstance = {
        ...baseModifier,
        parameterValues: [{ id: '0', value: 10, valueConfiguration: [10, 20, 30] }],
      };

      const result = expandModifiersByValueConfiguration(modifier);

      expect(result).toHaveLength(3);

      expect(result[0]).toMatchObject({
        x: 2,
        w: 1,
        parameterValues: [{ id: '0', value: 10 }],
      });
      expect(result[1]).toMatchObject({
        x: 3,
        w: 1,
        parameterValues: [{ id: '0', value: 20 }],
      });
      expect(result[2]).toMatchObject({
        x: 4,
        w: 1,
        parameterValues: [{ id: '0', value: 30 }],
      });
    });

    it('preserves all other modifier fields in each expanded instance', () => {
      const modifier: ModifierInstance = {
        ...baseModifier,
        parameterValues: [{ id: '0', valueConfiguration: [5, 10, 15] }],
      };

      const result = expandModifiersByValueConfiguration(modifier);

      for (const expanded of result) {
        expect(expanded.instanceId).toBe('buff-1');
        expect(expanded.id).toBe(10);
        expect(expanded.characterId).toBe(1001);
        expect(expanded.y).toBe(0);
        expect(expanded.h).toBe(1);
      }
    });

    it('does not include valueConfiguration in the expanded parameterValues', () => {
      const modifier: ModifierInstance = {
        ...baseModifier,
        parameterValues: [{ id: '0', valueConfiguration: [5, 10, 15] }],
      };

      const result = expandModifiersByValueConfiguration(modifier);

      for (const expanded of result) {
        expect(expanded.parameterValues?.[0]).not.toHaveProperty('valueConfiguration');
      }
    });

    it('expands a w=1 modifier with valueConfiguration into a single w=1 modifier', () => {
      const modifier: ModifierInstance = {
        ...baseModifier,
        w: 1,
        parameterValues: [{ id: '0', valueConfiguration: [42] }],
      };

      const result = expandModifiersByValueConfiguration(modifier);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        x: 2,
        w: 1,
        parameterValues: [{ id: '0', value: 42 }],
      });
    });

    it('expands a modifier starting at x=0', () => {
      const modifier: ModifierInstance = {
        ...baseModifier,
        x: 0,
        w: 2,
        parameterValues: [{ id: '0', valueConfiguration: [100, 200] }],
      };

      const result = expandModifiersByValueConfiguration(modifier);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ x: 0, w: 1 });
      expect(result[1]).toMatchObject({ x: 1, w: 1 });
    });
  });

  describe('mixed parameters (some with valueConfiguration, some without)', () => {
    it('uses value for parameters without valueConfiguration across all stacks', () => {
      const modifier: ModifierInstance = {
        ...baseModifier,
        w: 2,
        parameterValues: [
          { id: '0', valueConfiguration: [10, 20] },
          { id: '1', value: 99 },
        ],
      };

      const result = expandModifiersByValueConfiguration(modifier);

      expect(result).toHaveLength(2);
      expect(result[0].parameterValues).toEqual([
        { id: '0', value: 10 },
        { id: '1', value: 99 },
      ]);
      expect(result[1].parameterValues).toEqual([
        { id: '0', value: 20 },
        { id: '1', value: 99 },
      ]);
    });

    it('handles multiple parameters all with valueConfiguration', () => {
      const modifier: ModifierInstance = {
        ...baseModifier,
        w: 2,
        parameterValues: [
          { id: '0', valueConfiguration: [1, 2] },
          { id: '1', valueConfiguration: [3, 4] },
        ],
      };

      const result = expandModifiersByValueConfiguration(modifier);

      expect(result).toHaveLength(2);
      expect(result[0].parameterValues).toEqual([
        { id: '0', value: 1 },
        { id: '1', value: 3 },
      ]);
      expect(result[1].parameterValues).toEqual([
        { id: '0', value: 2 },
        { id: '1', value: 4 },
      ]);
    });
  });

  describe('valueConfiguration takes precedence over value', () => {
    it('uses valueConfiguration values over value when both are present on a parameter', () => {
      const modifier: ModifierInstance = {
        ...baseModifier,
        w: 3,
        parameterValues: [{ id: '0', value: 999, valueConfiguration: [10, 20, 30] }],
      };

      const result = expandModifiersByValueConfiguration(modifier);

      expect(result).toHaveLength(3);
      expect(result[0].parameterValues).toEqual([{ id: '0', value: 10 }]);
      expect(result[1].parameterValues).toEqual([{ id: '0', value: 20 }]);
      expect(result[2].parameterValues).toEqual([{ id: '0', value: 30 }]);
    });
  });

  describe('edge cases: valueConfiguration length differs from w', () => {
    it('expands to w stacks using undefined for out-of-bounds valueConfiguration indices', () => {
      // valueConfiguration has 2 values but w=3
      const modifier: ModifierInstance = {
        ...baseModifier,
        w: 3,
        parameterValues: [{ id: '0', valueConfiguration: [10, 20] }],
      };

      const result = expandModifiersByValueConfiguration(modifier);

      expect(result).toHaveLength(3);
      expect(result[0].parameterValues).toEqual([{ id: '0', value: 10 }]);
      expect(result[1].parameterValues).toEqual([{ id: '0', value: 20 }]);
      // index 2 is out of bounds → undefined
      expect(result[2].parameterValues).toEqual([{ id: '0', value: undefined }]);
    });
  });
});

import { describe, expect, it } from 'vitest';

import type { LinearParameterizedNumber } from '@/types';

import { calculateParameterizedNumberValue } from './calculate-parameterized-number';

describe('calculateParameterizedNumberValue', () => {
  describe('linear scaling', () => {
    it('calculates basic scale * parameter', () => {
      const parameterizedNumber: LinearParameterizedNumber<'0'> = {
        parameterConfigs: {
          '0': { scale: 0.04 },
        },
      };
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 5 })).toBe(
        0.2,
      );
    });

    it('applies offset', () => {
      const parameterizedNumber: LinearParameterizedNumber<'0'> = {
        parameterConfigs: {
          '0': { scale: 0.1 },
        },
        offset: 0.5,
      };
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 3 })).toBe(
        0.8,
      );
    });

    it('respects parameter minimum threshold', () => {
      const parameterizedNumber: LinearParameterizedNumber<'0'> = {
        parameterConfigs: {
          '0': { scale: 0.1, minimum: 5 },
        },
      };
      // Parameter 3 is below minimum 5, so contribution is 0
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 3 })).toBe(
        0,
      );
      // Parameter 8 exceeds minimum 5, so contribution is 0.1 * (8 - 5) = 0.3
      expect(
        calculateParameterizedNumberValue(parameterizedNumber, { '0': 8 }),
      ).toBeCloseTo(0.3);
    });

    it('respects parameter maximum cap', () => {
      const parameterizedNumber: LinearParameterizedNumber<'0'> = {
        parameterConfigs: {
          '0': { scale: 0.04, maximum: 10 },
        },
      };
      // Parameter 15 exceeds maximum 10, so contribution is capped at 0.04 * 10 = 0.4
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 15 })).toBe(
        0.4,
      );
      // Parameter 8 is below maximum, so contribution is 0.04 * 8 = 0.32
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 8 })).toBe(
        0.32,
      );
    });

    it('combines minimum and maximum correctly', () => {
      const parameterizedNumber: LinearParameterizedNumber<'0'> = {
        parameterConfigs: {
          '0': { scale: 0.1, minimum: 5, maximum: 10 },
        },
      };
      // Below minimum: 0
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 3 })).toBe(
        0,
      );
      // Between min and max: 0.1 * (8 - 5) = 0.3
      expect(
        calculateParameterizedNumberValue(parameterizedNumber, { '0': 8 }),
      ).toBeCloseTo(0.3);
      // Above max: 0.1 * (10 - 5) = 0.5
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 15 })).toBe(
        0.5,
      );
    });

    it('sums multiple parameter contributions', () => {
      const parameterizedNumber: LinearParameterizedNumber<'0' | '1'> = {
        parameterConfigs: {
          '0': { scale: 0.1 },
          '1': { scale: 0.2 },
        },
      };
      expect(
        calculateParameterizedNumberValue(parameterizedNumber, { '0': 5, '1': 3 }),
      ).toBe(1.1); // 0.1 * 5 + 0.2 * 3
    });

    it('returns offset when parameters are missing', () => {
      const parameterizedNumber: LinearParameterizedNumber<'0'> = {
        parameterConfigs: {
          '0': { scale: 0.1 },
        },
        offset: 0.25,
      };
      expect(calculateParameterizedNumberValue(parameterizedNumber, {})).toBe(0.25);
    });

    it('clamps result to overall minimum', () => {
      const parameterizedNumber: LinearParameterizedNumber<'0'> = {
        parameterConfigs: {
          '0': { scale: -0.1 },
        },
        minimum: 0,
      };
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 10 })).toBe(
        0,
      );
    });

    it('clamps result to overall maximum', () => {
      const parameterizedNumber: LinearParameterizedNumber<'0'> = {
        parameterConfigs: {
          '0': { scale: 0.1 },
        },
        maximum: 0.5,
      };
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 10 })).toBe(
        0.5,
      );
    });
  });

  describe('conditionals', () => {
    it('evaluates >= operator correctly', () => {
      const parameterizedNumber: LinearParameterizedNumber<'0'> = {
        parameterConfigs: {
          '0': {
            scale: 0,
            conditionalConfiguration: {
              operator: '>=',
              threshold: 10,
              valueIfTrue: 0.4,
            },
          },
        },
      };
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 9 })).toBe(
        0,
      );
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 10 })).toBe(
        0.4,
      );
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 11 })).toBe(
        0.4,
      );
    });

    it('evaluates > operator correctly', () => {
      const parameterizedNumber: LinearParameterizedNumber<'0'> = {
        parameterConfigs: {
          '0': {
            scale: 0,
            conditionalConfiguration: {
              operator: '>',
              threshold: 10,
              valueIfTrue: 0.4,
            },
          },
        },
      };
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 10 })).toBe(
        0,
      );
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 11 })).toBe(
        0.4,
      );
    });

    it('evaluates <= operator correctly', () => {
      const parameterizedNumber: LinearParameterizedNumber<'0'> = {
        parameterConfigs: {
          '0': {
            scale: 0,
            conditionalConfiguration: {
              operator: '<=',
              threshold: 5,
              valueIfTrue: 0.3,
            },
          },
        },
      };
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 4 })).toBe(
        0.3,
      );
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 5 })).toBe(
        0.3,
      );
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 6 })).toBe(
        0,
      );
    });

    it('evaluates < operator correctly', () => {
      const parameterizedNumber: LinearParameterizedNumber<'0'> = {
        parameterConfigs: {
          '0': {
            scale: 0,
            conditionalConfiguration: {
              operator: '<',
              threshold: 5,
              valueIfTrue: 0.3,
            },
          },
        },
      };
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 4 })).toBe(
        0.3,
      );
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 5 })).toBe(
        0,
      );
    });

    it('evaluates == operator correctly', () => {
      const parameterizedNumber: LinearParameterizedNumber<'0'> = {
        parameterConfigs: {
          '0': {
            scale: 0,
            conditionalConfiguration: {
              operator: '==',
              threshold: 5,
              valueIfTrue: 1,
            },
          },
        },
      };
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 4 })).toBe(
        0,
      );
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 5 })).toBe(
        1,
      );
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 6 })).toBe(
        0,
      );
    });

    it('uses valueIfFalse when condition is not met', () => {
      const parameterizedNumber: LinearParameterizedNumber<'0'> = {
        parameterConfigs: {
          '0': {
            scale: 0,
            conditionalConfiguration: {
              operator: '>=',
              threshold: 10,
              valueIfTrue: 0.5,
              valueIfFalse: 0.1,
            },
          },
        },
      };
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 5 })).toBe(
        0.1,
      );
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 10 })).toBe(
        0.5,
      );
    });

    it('defaults to 0 for missing parameters', () => {
      const parameterizedNumber: LinearParameterizedNumber<'0'> = {
        parameterConfigs: {
          '0': {
            scale: 0,
            conditionalConfiguration: {
              operator: '>=',
              threshold: 0,
              valueIfTrue: 0.5,
            },
          },
        },
      };
      // Missing parameter defaults to 0, which is >= 0
      expect(calculateParameterizedNumberValue(parameterizedNumber, {})).toBe(0);
    });

    it('sums multiple conditionals', () => {
      // Note: Each parameter can only have one conditional, so we use multiple parameters
      // referencing the same value to achieve multiple conditionals
      const parameterizedNumber: LinearParameterizedNumber<'0' | '1'> = {
        parameterConfigs: {
          '0': {
            scale: 0,
            conditionalConfiguration: {
              operator: '>=',
              threshold: 5,
              valueIfTrue: 0.1,
            },
          },
          '1': {
            scale: 0,
            conditionalConfiguration: {
              operator: '>=',
              threshold: 10,
              valueIfTrue: 0.2,
            },
          },
        },
      };
      expect(
        calculateParameterizedNumberValue(parameterizedNumber, { '0': 3, '1': 3 }),
      ).toBe(0);
      expect(
        calculateParameterizedNumberValue(parameterizedNumber, { '0': 7, '1': 7 }),
      ).toBe(0.1);
      expect(
        calculateParameterizedNumberValue(parameterizedNumber, { '0': 12, '1': 12 }),
      ).toBeCloseTo(0.3);
    });
  });

  describe('combined linear and conditionals (Iuno example)', () => {
    it('calculates Blessing of the Wan Light with S2 bonus correctly', () => {
      // Iuno's combined modifier: 0.04 * stacks + IF(stacks >= 10, 0.4, 0)
      const parameterizedNumber: LinearParameterizedNumber<'0'> = {
        parameterConfigs: {
          '0': {
            scale: 0.04,
            maximum: 10,
            conditionalConfiguration: {
              operator: '>=',
              threshold: 10,
              valueIfTrue: 0.4,
            },
          },
        },
      };

      // 0 stacks: 0
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 0 })).toBe(
        0,
      );

      // 5 stacks: 0.04 * 5 = 0.2
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 5 })).toBe(
        0.2,
      );

      // 9 stacks: 0.04 * 9 = 0.36
      expect(
        calculateParameterizedNumberValue(parameterizedNumber, { '0': 9 }),
      ).toBeCloseTo(0.36);

      // 10 stacks: 0.04 * 10 + 0.4 = 0.8
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 10 })).toBe(
        0.8,
      );

      // 15 stacks (capped at 10 for linear): 0.04 * 10 + 0.4 = 0.8
      expect(calculateParameterizedNumberValue(parameterizedNumber, { '0': 15 })).toBe(
        0.8,
      );
    });
  });
});

/**
 * Represents a number that is an integer.
 * In TypeScript, this is a "branded" type to distinguish it from a general number at compile time,
 * although it remains a number at runtime.
 */
export type Integer = number & { __brand: 'Integer' };

/**
 * Type guard and utility to safely cast a number to an Integer.
 */
export const toInteger = (value: number): Integer => {
  return Math.floor(value) as Integer;
};

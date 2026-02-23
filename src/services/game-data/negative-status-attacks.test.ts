import { describe, expect, it } from 'vitest';

import { Attribute, NegativeStatus } from '@/types';

import {
  NEGATIVE_STATUS_ATTACK_IDS,
  createNegativeStatusAttacks,
} from './negative-status-attacks';

describe('negative-status-attacks', () => {
  it('creates Aero Erosion attack for aero attribute', () => {
    const attacks = createNegativeStatusAttacks(Attribute.AERO);
    expect(attacks).toHaveLength(1);
    expect(attacks[0].id).toBe(NEGATIVE_STATUS_ATTACK_IDS[NegativeStatus.AERO_EROSION]);
    expect(attacks[0].attribute).toBe(Attribute.AERO);
  });

  it('creates Spectro Frazzle attack for spectro attribute', () => {
    const attacks = createNegativeStatusAttacks(Attribute.SPECTRO);
    expect(attacks).toHaveLength(1);
    expect(attacks[0].id).toBe(
      NEGATIVE_STATUS_ATTACK_IDS[NegativeStatus.SPECTRO_FRAZZLE],
    );
    expect(attacks[0].attribute).toBe(Attribute.SPECTRO);
  });

  it('returns no synthetic negative-status attack for other attributes', () => {
    expect(createNegativeStatusAttacks(Attribute.FUSION)).toEqual([]);
    expect(createNegativeStatusAttacks(Attribute.HAVOC)).toEqual([]);
    expect(createNegativeStatusAttacks(Attribute.PHYSICAL)).toEqual([]);
    expect(createNegativeStatusAttacks()).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';

import { Attribute, NegativeStatus, Tag } from '@/types';

import {
  NEGATIVE_STATUS_MODIFIER_IDS,
  NEGATIVE_STATUS_MODIFIER_ID_SET,
  createNegativeStatusModifiers,
} from './negative-status-modifiers';
import { Target } from './types';

describe('negative-status-modifiers', () => {
  it('creates one enemy-target modifier matching the entity attribute', () => {
    const modifiers = createNegativeStatusModifiers(Attribute.FUSION);
    expect(modifiers).toHaveLength(1);
    expect(modifiers[0].modifiedStats[0].stat).toBe(NegativeStatus.FUSION_BURST);
  });

  it('returns no negative-status modifiers for unmapped attributes', () => {
    expect(createNegativeStatusModifiers(Attribute.PHYSICAL)).toEqual([]);
    expect(createNegativeStatusModifiers()).toEqual([]);
  });

  it('uses special ids that match the constants and remain unique', () => {
    const ids = Object.values(NEGATIVE_STATUS_MODIFIER_IDS);
    expect(ids).toEqual([-1, -2, -3, -4, -5, -6]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(NEGATIVE_STATUS_MODIFIER_ID_SET).toEqual(new Set(ids));
  });

  it('creates user-configurable stack values capped at 13 and targets enemy', () => {
    const modifiers = createNegativeStatusModifiers(Attribute.HAVOC);
    for (const modifier of modifiers) {
      expect(modifier.target).toBe(Target.ENEMY);

      const modifiedStat = modifier.modifiedStats[0];
      expect(modifiedStat.tags).toEqual([Tag.ALL]);
      expect(typeof modifiedStat.value).toBe('object');
      if (typeof modifiedStat.value === 'number') continue;
      expect(modifiedStat.value.type).toBe('userParameterizedNumber');
      if (modifiedStat.value.type !== 'userParameterizedNumber') continue;

      expect(modifiedStat.value.parameterId).toBe('0');
      expect(modifiedStat.value.minimum).toBe(0);
      expect(modifiedStat.value.maximum).toBe(13);
    }
  });
});

import { describe, expect, it } from 'vitest';

import type { Montage } from '@/services/game-data-v2/montages';

import { dedupeMontages } from './useEntityMontages';

describe('dedupeMontages', () => {
  it('dedupes montages by matching data while keeping the shortest name', () => {
    const longNameMontage = createMontage({
      name: 'LongMontageName',
      notifications: [
        {
          type: 'spawnBullets',
          time: 1,
          bullets: [{ id: 1001, condition: { requiredTags: [] } }],
        },
      ],
    });
    const shortNameMontage = createMontage({
      name: 'Short',
      notifications: [
        {
          type: 'spawnBullets',
          time: 1.03,
          bullets: [{ id: 1001, condition: { requiredTags: [] } }],
        },
      ],
    });
    const duplicateMontages: Array<Montage> = [longNameMontage, shortNameMontage];

    expect(dedupeMontages(duplicateMontages)).toEqual([
      {
        ...shortNameMontage,
        dedupedNames: ['Short', 'LongMontageName'],
      },
    ]);
  });

  it('keeps montages with different data separate', () => {
    const firstMontage = createMontage({
      name: 'First',
    });
    const secondMontage = createMontage({
      name: 'Second',
      endTime: 2,
    });
    const montages: Array<Montage> = [firstMontage, secondMontage];

    expect(dedupeMontages(montages)).toEqual([
      {
        ...firstMontage,
        dedupedNames: ['First'],
      },
      {
        ...secondMontage,
        dedupedNames: ['Second'],
      },
    ]);
  });

  it('keeps montages separate when matching bullet times are outside tolerance', () => {
    const firstMontage = createMontage({
      name: 'First',
      notifications: [
        {
          type: 'spawnBullets',
          time: 1,
          bullets: [{ id: 1001, condition: { requiredTags: [] } }],
        },
      ],
    });
    const secondMontage = createMontage({
      name: 'Second',
      notifications: [
        {
          type: 'spawnBullets',
          time: 1.11,
          bullets: [{ id: 1001, condition: { requiredTags: [] } }],
        },
      ],
    });

    expect(dedupeMontages([firstMontage, secondMontage])).toEqual([
      {
        ...firstMontage,
        dedupedNames: ['First'],
      },
      {
        ...secondMontage,
        dedupedNames: ['Second'],
      },
    ]);
  });

  it('applies tolerance to effective and end times', () => {
    const longNameMontage = createMontage({
      name: 'LongMontageName',
      effectiveTime: 1,
      endTime: 2,
    });
    const shortNameMontage = createMontage({
      name: 'Short',
      effectiveTime: 1.1,
      endTime: 2.2,
    });

    expect(dedupeMontages([longNameMontage, shortNameMontage])).toEqual([
      {
        ...shortNameMontage,
        dedupedNames: ['Short', 'LongMontageName'],
      },
    ]);
  });
});

const createMontage = (montage: Pick<Montage, 'name'> & Partial<Montage>): Montage => ({
  characterName: 'Character',
  notifications: [
    {
      type: 'spawnBullets',
      time: 0.2,
      bullets: [
        {
          id: 1001,
          condition: {
            requiredTags: [],
          },
        },
      ],
    },
    {
      type: 'sendEvent',
      time: 0.4,
      name: 'Gameplay.Event',
    },
    {
      type: 'addTag',
      time: 0.3,
      name: 'Gameplay.Tag',
      duration: 0.5,
    },
  ],
  effectiveTime: 0.8,
  endTime: 1.5,
  raw: {} as Montage['raw'],
  ...montage,
});

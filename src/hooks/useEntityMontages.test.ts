import { describe, expect, it } from 'vitest';

import type { Montage } from '@/services/game-data-v2/montages';

import { dedupeMontages } from './useEntityMontages';

describe('dedupeMontages', () => {
  it('dedupes montages by matching data while keeping the shortest name', () => {
    const longNameMontage = createMontage({
      id: 'long-name-id',
      name: 'LongMontageName',
      bullets: [{ bulletId: '1001', time: 1 }],
    });
    const shortNameMontage = createMontage({
      id: 'short-name-id',
      name: 'Short',
      bullets: [{ bulletId: '1001', time: 1.03 }],
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
      id: 'first-id',
      name: 'First',
    });
    const secondMontage = createMontage({
      id: 'second-id',
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
      id: 'first-id',
      name: 'First',
      bullets: [{ bulletId: '1001', time: 1 }],
    });
    const secondMontage = createMontage({
      id: 'second-id',
      name: 'Second',
      bullets: [{ bulletId: '1001', time: 1.11 }],
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

  it('applies tolerance to cancel and end times', () => {
    const longNameMontage = createMontage({
      id: 'long-name-id',
      name: 'LongMontageName',
      cancelTime: 1,
      endTime: 2,
    });
    const shortNameMontage = createMontage({
      id: 'short-name-id',
      name: 'Short',
      cancelTime: 1.1,
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

const createMontage = (
  montage: Pick<Montage, 'id' | 'name'> & Partial<Montage>,
): Montage => ({
  bullets: [
    {
      bulletId: '1001',
      time: 0.2,
    },
  ],
  cancelTime: 0.8,
  endTime: 1.5,
  events: [
    {
      name: 'Gameplay.Event',
      time: 0.4,
    },
  ],
  raw: {} as Montage['raw'],
  tags: [
    {
      duration: 0.5,
      name: 'Gameplay.Tag',
      time: 0.3,
    },
  ],
  ...montage,
});

import { describe, expect, it, vi } from 'vitest';

import type { Buff } from '../buffs/types';
import type { Buff as RepositoryBuff } from '../repostiory';

import { groupBuffsByConnection } from './group-buffs';

// Simulate the buffGraph after the ManageBuff.Remove fix:
// 1412607009 removes [1412607003, 1412607004, 1412607012], creating undirected edges
// between all four nodes. Visiting from either 1412607003 or 1412607004 reaches the other.
vi.mock('../get-capabilities', () => ({
  getConnectedBuffs: (id: number) => {
    const connectedIds: Record<number, Array<number>> = {
      1_412_607_003: [1_412_607_003, 1_412_607_009, 1_412_607_004, 1_412_607_012],
      1_412_607_004: [1_412_607_003, 1_412_607_009, 1_412_607_004, 1_412_607_012],
    };
    return (connectedIds[id] ?? [id]).map((connectedId) => ({ id: connectedId }));
  },
}));

const makeBuff = (id: number, applicationTagRequirements: Array<string> = []): Buff =>
  ({
    buffId: id,
    raw: { id, applicationTagRequirements } as unknown as RepositoryBuff,
    duration: undefined,
  }) as unknown as Buff;

describe('groupBuffsByConnection', () => {
  it('groups 1412607003 and 1412607004 together — both are listed in ManageBuff parent 1412607009', () => {
    const buff3 = makeBuff(1_412_607_003);
    const buff4 = makeBuff(1_412_607_004);

    const groups = groupBuffsByConnection([buff3, buff4]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toContain(buff3);
    expect(groups[0]).toContain(buff4);
  });
});

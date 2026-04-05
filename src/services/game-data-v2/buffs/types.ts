import type {
  CapabilityType,
  Sequence,
  Stat,
  Target,
} from '@/services/game-data/types';

import type { Buff as RepositoryBuff } from '../repostiory';

export type Buff = Stat & {
  buffId: number;
  rawData: RepositoryBuff;
  duration?: number;
  type?: typeof CapabilityType.PERMANENT_STAT | typeof CapabilityType.MODIFIER;
  target?: Target;
  unlockedAt?: Sequence;
  disabledAt?: Sequence;
};

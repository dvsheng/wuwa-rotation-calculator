import type {
  CapabilityType,
  OriginType,
  Sequence,
  Stat,
  Target,
} from '@/services/game-data/types';

import type { EntityResource } from '../create-entity-resource-lister';
import type { Buff as RepositoryBuff } from '../repostiory';

export type BuffData = Stat & {
  buffId: number;
  duration?: number;
  type?: typeof CapabilityType.PERMANENT_STAT | typeof CapabilityType.MODIFIER;
  target?: Target;
  source?: OriginType;
  unlockedAt?: Sequence;
  disabledAt?: Sequence;
};

export type Buff = EntityResource<BuffData, RepositoryBuff>;

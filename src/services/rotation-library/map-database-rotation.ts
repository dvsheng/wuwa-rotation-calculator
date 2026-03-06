import type { DatabaseRotation } from '@/db/schema';
import type { SavedRotation } from '@/schemas/library';

import { replaceNullsWithUndefined } from '../game-data/database-type-adapters';

export const mapDatabaseRotation = (rotation: DatabaseRotation): SavedRotation => {
  return replaceNullsWithUndefined(rotation);
};

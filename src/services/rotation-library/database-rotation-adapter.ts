import type { DatabaseRotation } from '@/db/schema';
import type { ListedRotation, SavedRotation } from '@/schemas/library';

import { replaceNullsWithUndefined } from '../game-data/database-type-adapters';

export type ListedRotationRow = DatabaseRotation & {
  ownerName: string;
};

export const mapSavedRotationRow = (rotation: DatabaseRotation): SavedRotation => {
  return replaceNullsWithUndefined(rotation);
};

export const mapListedRotationRow = (
  row: ListedRotationRow,
): Omit<ListedRotation, 'isOwner'> => {
  const rowWithoutNulls = replaceNullsWithUndefined(row);
  const { ownerId, ...listedRotation } = rowWithoutNulls;
  return listedRotation;
};

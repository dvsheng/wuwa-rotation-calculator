import { database } from '@/db/client';
import { rotations } from '@/db/schema';
import type { SavedRotation } from '@/schemas/library';
import type { CreateRotationRequest } from '@/schemas/rotation-library';

import { mapDatabaseRotation } from './map-database-rotation';

export const createRotationHandler = async (
  input: CreateRotationRequest,
  ownerId: string,
): Promise<SavedRotation> => {
  const [created] = await database
    .insert(rotations)
    .values({ ...input, ownerId })
    .returning();

  return mapDatabaseRotation(created);
};

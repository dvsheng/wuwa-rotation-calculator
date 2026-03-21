import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { rotations } from '@/db/schema';
import type { SavedRotation } from '@/schemas/library';
import type { GetRotationByIdRequest } from '@/schemas/rotation-library';

import { mapSavedRotationRow } from './database-rotation-adapter';

export const getRotationByIdHandler = async (
  input: GetRotationByIdRequest,
  currentUserId?: string,
): Promise<SavedRotation> => {
  const rotation = await database.query.rotations.findFirst({
    where: eq(rotations.id, input.id),
  });

  if (!rotation) {
    throw new Error(`Rotation not found for ID ${input.id}`);
  }

  if (rotation.visibility !== 'public' && rotation.ownerId !== currentUserId) {
    throw new Error('Unauthorized');
  }

  return mapSavedRotationRow(rotation);
};

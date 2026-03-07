import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { rotations } from '@/db/schema';
import type {
  DeleteRotationRequest,
  DeleteRotationResponse,
} from '@/schemas/rotation-library';

export const deleteRotationHandler = async (
  input: DeleteRotationRequest,
  ownerId: string,
): Promise<DeleteRotationResponse> => {
  const existing = await database.query.rotations.findFirst({
    where: eq(rotations.id, input.id),
  });

  if (!existing) {
    throw new Error(`Rotation not found for ID ${input.id}`);
  }

  if (existing.ownerId !== ownerId) {
    throw new Error(`Rotation ${input.id} does not belong to the current user`);
  }

  await database.delete(rotations).where(eq(rotations.id, input.id));

  return { success: true };
};

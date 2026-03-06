import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { rotations } from '@/db/schema';
import type {
  DeleteRotationRequest,
  DeleteRotationResponse,
} from '@/schemas/rotation-library';

export const deleteRotationHandler = async (
  input: DeleteRotationRequest,
): Promise<DeleteRotationResponse> => {
  const deleted = await database
    .delete(rotations)
    .where(eq(rotations.id, input.id))
    .returning({ id: rotations.id });

  if (deleted.length === 0) {
    throw new Error(`Rotation not found for ID ${input.id}`);
  }

  return { success: true };
};

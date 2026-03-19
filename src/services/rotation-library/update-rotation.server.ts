import { and, eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { rotations } from '@/db/schema';
import type { SavedRotation } from '@/schemas/library';
import type { UpdateRotationRequest } from '@/schemas/rotation-library';

import { mapDatabaseRotation } from './map-database-rotation';

export const updateRotationHandler = async (
  input: UpdateRotationRequest,
  ownerId: string,
): Promise<SavedRotation> => {
  const existing = await database.query.rotations.findFirst({
    where: eq(rotations.id, input.id),
  });

  if (!existing) {
    throw new Error(`Rotation not found for ID ${input.id}`);
  }

  if (existing.ownerId !== ownerId) {
    throw new Error(`Rotation ${input.id} does not belong to the current user`);
  }

  const [updated] = await database
    .update(rotations)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.totalDamage !== undefined && { totalDamage: input.totalDamage }),
      ...(input.visibility !== undefined && { visibility: input.visibility }),
      ...(input.data !== undefined && { data: input.data }),
      updatedAt: new Date(),
    })
    .where(and(eq(rotations.id, input.id), eq(rotations.ownerId, ownerId)))
    .returning();

  return mapDatabaseRotation(updated);
};

import { and, eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { rotations } from '@/db/schema';
import type { SavedRotation } from '@/schemas/library';
import type { UpdateRotationRequest } from '@/schemas/rotation-library';

import { mapSavedRotationRow } from './database-rotation-adapter';

export const updateRotationHandler = async (
  input: UpdateRotationRequest,
  owner: {
    id: string;
    isAnonymous: boolean;
    username?: string;
  },
): Promise<SavedRotation> => {
  const existing = await database.query.rotations.findFirst({
    where: eq(rotations.id, input.id),
  });

  if (!existing) {
    throw new Error(`Rotation not found for ID ${input.id}`);
  }

  if (existing.ownerId !== owner.id) {
    throw new Error(`Rotation ${input.id} does not belong to the current user`);
  }

  if (owner.isAnonymous && input.visibility === 'public') {
    throw new Error('Anonymous users cannot make rotations public');
  }

  if (!owner.username && input.visibility === 'public') {
    throw new Error('Users must choose a username before making rotations public');
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
    .where(and(eq(rotations.id, input.id), eq(rotations.ownerId, owner.id)))
    .returning();

  return mapSavedRotationRow(updated);
};

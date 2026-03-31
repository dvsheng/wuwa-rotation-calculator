import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { capabilities } from '@/db/schema';
import type {
  CreateCapabilityRequest,
  DeleteCapabilityRequest,
  UpdateCapabilityRequest,
} from '@/schemas/admin';

export const updateCapabilityHandler = async ({
  capabilityId,
  ...updateData
}: UpdateCapabilityRequest): Promise<void> => {
  const result = await database
    .update(capabilities)
    .set(updateData)
    .where(eq(capabilities.id, capabilityId))
    .returning();
  if (result.length === 0) {
    throw new Error(`Capability not found for ID ${capabilityId}`);
  }
};

export const deleteCapabilityHandler = async ({
  capabilityId,
}: DeleteCapabilityRequest): Promise<void> => {
  const result = await database
    .delete(capabilities)
    .where(eq(capabilities.id, capabilityId))
    .returning();
  if (result.length === 0) {
    throw new Error(`Capability not found for ID ${capabilityId}`);
  }
};

export const createCapabilityHandler = async ({
  ...capabilityData
}: CreateCapabilityRequest): Promise<number> => {
  const result = await database
    .insert(capabilities)
    .values([capabilityData])
    .returning({ id: capabilities.id });
  return result[0].id;
};

import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { capabilities } from '@/db/schema';
import type { AdminUpdateCapabilityRequest } from '@/schemas/admin';

export const updateAdminCapabilityHandler = async (
  input: AdminUpdateCapabilityRequest,
): Promise<void> => {
  const existingCapability = await database.query.capabilities.findFirst({
    where: eq(capabilities.id, input.capabilityId),
  });

  if (!existingCapability) {
    throw new Error(`Capability not found for ID ${input.capabilityId}`);
  }

  await database
    .update(capabilities)
    .set({
      name: input.name,
      description: input.description,
      capabilityType: input.capabilityType,
      capabilityJson: input.capabilityJson,
    })
    .where(eq(capabilities.id, input.capabilityId));
};

import { asc, eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { entities, fullCapabilities } from '@/db/schema';
import type {
  AdminEntityDetailsResponse,
  AdminGetEntityDetailsRequest,
} from '@/schemas/admin';

export const getAdminEntityDetailsHandler = async (
  input: AdminGetEntityDetailsRequest,
): Promise<AdminEntityDetailsResponse> => {
  const rows = await database
    .select()
    .from(fullCapabilities)
    .where(eq(fullCapabilities.entityId, input.id))
    .orderBy(asc(fullCapabilities.skillId), asc(fullCapabilities.capabilityId));

  if (rows.length > 0) {
    return { rows };
  }

  const entity = await database.query.entities.findFirst({
    where: eq(entities.id, input.id),
  });

  if (!entity) {
    throw new Error(`Entity not found for ID ${input.id}`);
  }

  return { entity, rows: [] };
};

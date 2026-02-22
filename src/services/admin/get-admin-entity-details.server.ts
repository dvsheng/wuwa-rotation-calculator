import { asc, eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { entities, fullCapabilities, skills } from '@/db/schema';
import type {
  AdminEntityDetailsResponse,
  AdminGetEntityDetailsRequest,
} from '@/schemas/admin';

export const getAdminEntityDetailsHandler = async (
  input: AdminGetEntityDetailsRequest,
): Promise<AdminEntityDetailsResponse> => {
  const entity = await database.query.entities.findFirst({
    where: eq(entities.id, input.id),
  });

  if (!entity) {
    throw new Error(`Entity not found for ID ${input.id}`);
  }

  const entitySkills = await database.query.skills.findMany({
    where: eq(skills.entityId, input.id),
    orderBy: (table, operators) => [operators.asc(table.id)],
  });

  const rows = await database
    .select()
    .from(fullCapabilities)
    .where(eq(fullCapabilities.entityId, input.id))
    .orderBy(asc(fullCapabilities.skillId), asc(fullCapabilities.capabilityId));

  return { entity, skills: entitySkills, rows };
};

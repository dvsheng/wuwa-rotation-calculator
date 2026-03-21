import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { entities } from '@/db/schema';
import type { AdminGetEntityDetailsRequest } from '@/schemas/admin';

import { replaceNullsWithUndefined } from '../game-data/database-type-adapters';

export const getEntityDetailsHandler = async ({ id }: AdminGetEntityDetailsRequest) => {
  const databaseEntity = await database.query.entities.findFirst({
    where: eq(entities.id, id),
    with: {
      skills: {
        with: {
          capabilities: true,
        },
      },
    },
  });

  if (!databaseEntity) {
    throw new Error(`Entity not found for ID ${id}`);
  }
  const entity = replaceNullsWithUndefined(databaseEntity);
  return { entity };
};

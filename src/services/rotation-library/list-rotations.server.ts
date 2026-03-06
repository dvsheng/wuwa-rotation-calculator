import { desc, eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { rotations } from '@/db/schema';
import type {
  ListRotationsRequest,
  ListRotationsResponse,
} from '@/schemas/rotation-library';

import { mapDatabaseRotation } from './map-database-rotation';

export const listRotationsHandler = async (
  input: ListRotationsRequest,
): Promise<ListRotationsResponse> => {
  if (!input.ownerId) {
    const rows = await database.query.rotations.findMany({
      orderBy: desc(rotations.updatedAt),
    });
    return rows.map((row) => mapDatabaseRotation(row));
  }
  const rows = await database.query.rotations.findMany({
    where: eq(rotations.ownerId, input.ownerId ?? ''),
    orderBy: desc(rotations.updatedAt),
  });
  return rows.map((row) => mapDatabaseRotation(row));
};

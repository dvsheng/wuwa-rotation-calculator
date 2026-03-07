import { desc } from 'drizzle-orm';

import { database } from '@/db/client';
import { rotations } from '@/db/schema';
import type { ListRotationsResponse } from '@/schemas/rotation-library';

import { mapDatabaseRotation } from './map-database-rotation';

export const listRotationsHandler = async (): Promise<ListRotationsResponse> => {
  const rows = await database.query.rotations.findMany({
    orderBy: desc(rotations.updatedAt),
  });
  return rows.map((row) => mapDatabaseRotation(row));
};

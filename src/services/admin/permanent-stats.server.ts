import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { permanentStats } from '@/db/schema';
import type { NewPermanentStat, PermanentStat } from '@/db/schema';

/**
 * List all permanent stats with optional ordering.
 */
export const listPermanentStatsHandler = async (): Promise<Array<PermanentStat>> => {
  return database.query.permanentStats.findMany({
    orderBy: (table, { asc }) => [asc(table.entityId), asc(table.name)],
  });
};

/**
 * Get a single permanent stat by ID.
 */
export const getPermanentStatByIdHandler = async (
  id: number,
): Promise<PermanentStat | undefined> => {
  return database.query.permanentStats.findFirst({
    where: eq(permanentStats.id, id),
  });
};

/**
 * Create a new permanent stat.
 */
export const createPermanentStatHandler = async (
  data: Omit<NewPermanentStat, 'createdAt' | 'updatedAt'>,
): Promise<PermanentStat> => {
  const [permanentStat] = await database
    .insert(permanentStats)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return permanentStat;
};

/**
 * Update an existing permanent stat.
 */
export const updatePermanentStatHandler = async (
  id: number,
  data: Partial<Omit<NewPermanentStat, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<PermanentStat> => {
  const [permanentStat] = await database
    .update(permanentStats)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(permanentStats.id, id))
    .returning();
  return permanentStat;
};

/**
 * Delete a permanent stat by ID.
 */
export const deletePermanentStatHandler = async (id: number): Promise<void> => {
  await database.delete(permanentStats).where(eq(permanentStats.id, id));
};

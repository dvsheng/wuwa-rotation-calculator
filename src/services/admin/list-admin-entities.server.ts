import { and, asc, eq, sql } from 'drizzle-orm';

import { database } from '@/db/client';
import { entities, skills } from '@/db/schema';
import type { AdminListEntitiesRequest, AdminListEntitiesRow } from '@/schemas/admin';

export const listAdminEntitiesHandler = async (
  input: AdminListEntitiesRequest,
): Promise<Array<AdminListEntitiesRow>> => {
  const conditions = [];

  if (input.entityType) {
    conditions.push(eq(entities.type, input.entityType));
  }

  const search = input.search?.trim();
  if (search) {
    conditions.push(sql`lower(${entities.name}) like ${`%${search.toLowerCase()}%`}`);
  }

  const baseQuery = database
    .select({
      entity: entities,
      skillCount: sql<number | null>`count(${skills.id})`,
    })
    .from(entities)
    .leftJoin(skills, eq(skills.entityId, entities.id));

  const rows = await (
    conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery
  )
    .groupBy(entities.id)
    .orderBy(asc(entities.name));

  return rows.map((row) => ({
    entity: row.entity,
    skillCount: Number(row.skillCount ?? 0),
  }));
};

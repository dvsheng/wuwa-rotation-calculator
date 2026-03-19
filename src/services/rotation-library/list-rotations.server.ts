import { and, asc, eq, or, sql } from 'drizzle-orm';

import { database } from '@/db/client';
import { rotations } from '@/db/schema';
import type {
  ListRotationsRequest,
  ListRotationsResponse,
} from '@/schemas/rotation-library';

import { mapDatabaseRotation } from './map-database-rotation';

const buildCharacterFilter = (characterIds: Array<number>) => {
  if (characterIds.length === 0) {
    return;
  }

  const matchers = characterIds.map(
    (characterId) => sql`
    exists (
      select 1
      from jsonb_array_elements(${rotations.data} -> 'team') as team_member
      where (team_member ->> 'id')::int > 0
        and (team_member ->> 'id')::int = ${characterId}
    )
  `,
  );

  return matchers.length === 1 ? matchers[0] : or(...matchers);
};

export const listRotationsHandler = async (
  input: ListRotationsRequest,
  currentUserId?: string,
): Promise<ListRotationsResponse> => {
  const normalizedCharacterIds = [...new Set(input.characterIds)].filter(
    (characterId) => characterId > 0,
  );

  if (input.scope === 'owned') {
    if (!currentUserId) {
      throw new Error('Unauthorized');
    }

    const rows = await database.query.rotations.findMany({
      where: and(
        eq(rotations.ownerId, currentUserId),
        buildCharacterFilter(normalizedCharacterIds),
      ),
      orderBy: asc(rotations.id),
    });

    return {
      items: rows.map((row) => ({
        ...mapDatabaseRotation(row),
        isOwner: true,
      })),
      total: rows.length,
      offset: 0,
      limit: rows.length,
    };
  }

  const whereClause = and(
    eq(rotations.visibility, 'public'),
    buildCharacterFilter(normalizedCharacterIds),
  );

  const [totalRow, rows] = await Promise.all([
    database
      .select({
        count: sql<number>`count(*)`,
      })
      .from(rotations)
      .where(whereClause),
    database.query.rotations.findMany({
      where: whereClause,
      orderBy: asc(rotations.id),
      offset: input.offset,
      limit: input.limit,
    }),
  ]);

  return {
    items: rows.map((row) => ({
      ...mapDatabaseRotation(row),
      isOwner: row.ownerId === currentUserId,
    })),
    total: totalRow[0]?.count ?? 0,
    offset: input.offset,
    limit: input.limit,
  };
};

import { and, asc, eq, or, sql } from 'drizzle-orm';

import { database } from '@/db/client';
import { authUser, rotations } from '@/db/schema';
import type {
  ListRotationsRequest,
  ListRotationsResponse,
} from '@/schemas/rotation-library';

import { mapListedRotationRow } from './database-rotation-adapter';

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

const listedRotationSelect = {
  id: rotations.id,
  ownerId: rotations.ownerId,
  name: rotations.name,
  description: rotations.description,
  totalDamage: rotations.totalDamage,
  visibility: rotations.visibility,
  data: rotations.data,
  createdAt: rotations.createdAt,
  updatedAt: rotations.updatedAt,
  ownerName: sql<string>`coalesce(${authUser.username}, '')`,
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

    const rows = await database
      .select(listedRotationSelect)
      .from(rotations)
      .leftJoin(authUser, eq(rotations.ownerId, authUser.id))
      .where(
        and(
          eq(rotations.ownerId, currentUserId),
          buildCharacterFilter(normalizedCharacterIds),
        ),
      )
      .orderBy(asc(rotations.id));
    const items = rows.map((row) => ({
      ...mapListedRotationRow(row),
      isOwner: true,
    }));

    return {
      items,
      total: items.length,
      offset: 0,
      limit: items.length,
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
    database
      .select(listedRotationSelect)
      .from(rotations)
      .leftJoin(authUser, eq(rotations.ownerId, authUser.id))
      .where(whereClause)
      .orderBy(asc(rotations.id))
      .offset(input.offset)
      .limit(input.limit),
  ]);
  const items = rows.map((row) => ({
    ...mapListedRotationRow(row),
    isOwner: row.ownerId === currentUserId,
  }));

  return {
    items,
    total: totalRow[0]?.count ?? 0,
    offset: input.offset,
    limit: input.limit,
  };
};

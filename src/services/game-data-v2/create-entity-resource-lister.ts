import { EntityType } from '@/services/game-data/types';

export type EntityResource<TDomainModel, TRepositoryRow> = TDomainModel & {
  raw: SerializableRepositoryRow<TRepositoryRow>;
};

export type EntityResourceListerOptions<TRepositoryRow, TContext, TDomainModel> = {
  fetchResourcesForEntity: (
    entityId: number,
    entityType: EntityType,
  ) => Promise<Array<TRepositoryRow>>;
  fetchContextForEntity: (
    entityId: number,
    entityType: EntityType,
  ) => TContext | Promise<TContext>;
  transform: (
    repositoryRow: TRepositoryRow,
    context: TContext,
  ) => TDomainModel | undefined;
  filter: (
    transformedRow: TDomainModel,
    repositoryRow: TRepositoryRow,
    context: TContext,
  ) => boolean;
};

export const createEntityResourceLister = <TRepositoryRow, TContext, TDomainModel>({
  fetchResourcesForEntity,
  fetchContextForEntity,
  transform,
  filter,
}: EntityResourceListerOptions<TRepositoryRow, TContext, TDomainModel>) => {
  return async (
    entityId: number,
  ): Promise<Array<EntityResource<TDomainModel, TRepositoryRow>>> => {
    const entityType = inferEntityType(entityId);
    const context = await fetchContextForEntity(entityId, entityType);
    const repositoryRows = await fetchResourcesForEntity(entityId, entityType);
    const resources: Array<EntityResource<TDomainModel, TRepositoryRow>> = [];

    for (const repositoryRow of repositoryRows) {
      const transformedRow = transform(repositoryRow, context);
      if (!transformedRow || !filter(transformedRow, repositoryRow, context)) continue;

      resources.push({
        ...transformedRow,
        raw: repositoryRow as SerializableRepositoryRow<TRepositoryRow>,
      });
    }

    return resources;
  };
};

const inferEntityType = (entityId: number): EntityType => {
  const id = String(entityId);

  if (id.length <= 2) return EntityType.ECHO_SET;
  if (id.length === 8 && id[0] === '2') return EntityType.WEAPON;
  if (id.length === 4) return EntityType.CHARACTER;
  return EntityType.ECHO;
};

type SerializableRepositoryRow<TRow> = [unknown] extends [TRow]
  ? Record<string, never>
  : TRow extends Array<infer TItem>
    ? Array<SerializableRepositoryRow<TItem>>
    : TRow extends object
      ? { [TKey in keyof TRow]: SerializableRepositoryRow<TRow[TKey]> }
      : TRow;

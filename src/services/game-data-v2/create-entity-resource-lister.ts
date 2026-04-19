import type { EntityType } from '@/services/game-data/types';

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
    entityType: EntityType,
  ): Promise<Array<EntityResource<TDomainModel, TRepositoryRow>>> => {
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

type SerializableRepositoryRow<TRow> = [unknown] extends [TRow]
  ? Record<string, never>
  : TRow extends Array<infer TItem>
    ? Array<SerializableRepositoryRow<TItem>>
    : TRow extends object
      ? { [TKey in keyof TRow]: SerializableRepositoryRow<TRow[TKey]> }
      : TRow;

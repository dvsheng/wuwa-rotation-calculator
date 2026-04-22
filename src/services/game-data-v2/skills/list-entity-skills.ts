import { createEntityResourceLister } from '../create-entity-resource-lister';
import type { EntityResource } from '../create-entity-resource-lister';

import { fetchContextForEntity } from './fetch-context';
import { fetchResourcesForEntity } from './fetch-resources';
import { transform } from './transform';
import type { EntitySkillData, EntitySkillRepositoryRow } from './types';

export const listEntitySkills: (
  entityId: number,
) => Promise<Array<EntityResource<EntitySkillData, EntitySkillRepositoryRow>>> =
  createEntityResourceLister({
    fetchResourcesForEntity,
    fetchContextForEntity,
    transform,
  });

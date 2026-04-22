import { createEntityResourceLister } from '../create-entity-resource-lister';

import { fetchContextForEntity } from './fetch-context';
import { fetchResourcesForEntity } from './fetch-resources';
import { toBuff } from './transform';

export const getEntityBuffs = createEntityResourceLister({
  fetchResourcesForEntity,
  fetchContextForEntity,
  transform: toBuff,
});

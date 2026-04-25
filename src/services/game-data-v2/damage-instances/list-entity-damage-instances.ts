import { createEntityResourceLister } from '../create-entity-resource-lister';

import { fetchContextForEntity } from './fetch-context';
import { fetchResourcesForEntity } from './fetch-resources';
import { tryTransformToDamageInstance } from './transform';

export const listEntityDamageInstances = createEntityResourceLister({
  fetchResourcesForEntity,
  fetchContextForEntity,
  transform: tryTransformToDamageInstance,
});

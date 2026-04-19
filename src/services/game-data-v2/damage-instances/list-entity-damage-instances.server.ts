import { createEntityResourceLister } from '../create-entity-resource-lister';

import { fetchResourcesForEntity } from './fetch-resources';
import { tryTransformToDamageInstance } from './transform';

export const listEntityDamageInstancesHandler = createEntityResourceLister({
  fetchResourcesForEntity,
  transform: tryTransformToDamageInstance,
});

import { createEntityResourceLister } from '../create-entity-resource-lister';

import { fetchResourcesForEntity } from './fetch-resources';
import { toMontage } from './transform';

export const listEntityMontagesHandler = createEntityResourceLister({
  fetchResourcesForEntity,
  transform: toMontage,
});

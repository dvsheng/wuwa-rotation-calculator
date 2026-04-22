import { createEntityResourceLister } from '../create-entity-resource-lister';

import { fetchResourcesForEntity } from './fetch-resources';
import { transform } from './transform';

export const listEntityBullets = createEntityResourceLister({
  fetchResourcesForEntity,
  transform,
});

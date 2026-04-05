import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { EntityType } from '@/services/game-data/types';

import { listEntitySkillsHandler } from './list-entity-skills.server';

const ListEntitySkillsRequestSchema = z.object({
  id: z.number(),
  entityType: z.enum(EntityType),
});

export const listEntitySkills = createServerFn({
  method: 'GET',
})
  .inputValidator(ListEntitySkillsRequestSchema)
  .handler(({ data }) => {
    return listEntitySkillsHandler(data.id, data.entityType);
  });

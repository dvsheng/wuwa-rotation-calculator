import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { listEntitySkillsHandler } from './list-entity-skills.server';

const ListEntitySkillsRequestSchema = z.object({
  id: z.number(),
});

export const listEntitySkills = createServerFn({
  method: 'GET',
})
  .inputValidator(ListEntitySkillsRequestSchema)
  .handler(({ data }) => {
    return listEntitySkillsHandler(data.id);
  });

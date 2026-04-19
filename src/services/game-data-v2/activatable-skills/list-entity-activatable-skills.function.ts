import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { listEntityActivatableSkillsHandler } from './list-entity-activatable-skills.server';

const ListEntityActivatableSkillsRequestSchema = z.object({
  id: z.number(),
});

export const listEntityActivatableSkills = createServerFn({
  method: 'GET',
})
  .inputValidator(ListEntityActivatableSkillsRequestSchema)
  .handler(({ data }) => {
    return listEntityActivatableSkillsHandler(data.id);
  });

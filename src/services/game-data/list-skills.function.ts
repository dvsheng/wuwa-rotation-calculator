import { createServerFn } from '@tanstack/react-start';

import { ListSkillsRequestSchema } from '@/schemas/game-data-service';

import { listSkillsHandler } from './list-skills.server';

export const listSkills = createServerFn({
  method: 'GET',
})
  .inputValidator(ListSkillsRequestSchema)
  .handler(async ({ data }) => {
    return await listSkillsHandler(data);
  });

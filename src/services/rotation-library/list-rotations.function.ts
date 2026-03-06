import { createServerFn } from '@tanstack/react-start';

import { ListRotationsRequestSchema } from '@/schemas/rotation-library';

import { listRotationsHandler } from './list-rotations.server';

export const listRotations = createServerFn({
  method: 'GET',
})
  .inputValidator(ListRotationsRequestSchema)
  .handler(async ({ data }) => {
    return listRotationsHandler(data);
  });

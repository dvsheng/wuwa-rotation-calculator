import { createServerFn } from '@tanstack/react-start';

import { authOptionalMiddleware } from '@/middleware/auth';
import { ListRotationsRequestSchema } from '@/schemas/rotation-library';

import { listRotationsHandler } from './list-rotations.server';

export const listRotations = createServerFn({
  method: 'GET',
})
  .inputValidator(ListRotationsRequestSchema)
  .middleware([authOptionalMiddleware])
  .handler(async ({ data, context }) => {
    return listRotationsHandler(data, context.session?.user.id);
  });

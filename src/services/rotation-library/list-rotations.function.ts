import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';

import { auth } from '@/lib/auth';
import { ListRotationsRequestSchema } from '@/schemas/rotation-library';

import { listRotationsHandler } from './list-rotations.server';

export const listRotations = createServerFn({
  method: 'GET',
})
  .inputValidator(ListRotationsRequestSchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });

    return listRotationsHandler(data, session?.user.id);
  });

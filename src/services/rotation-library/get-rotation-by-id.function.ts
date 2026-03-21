import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';

import { auth } from '@/lib/auth';
import { GetRotationByIdRequestSchema } from '@/schemas/rotation-library';

import { getRotationByIdHandler } from './get-rotation-by-id.server';

export const getRotationById = createServerFn({
  method: 'GET',
})
  .inputValidator(GetRotationByIdRequestSchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });

    return getRotationByIdHandler(data, session?.user.id);
  });

import { createServerFn } from '@tanstack/react-start';

import { authRequiredMiddleware } from '@/middleware/auth';
import { CreateRotationRequestSchema } from '@/schemas/rotation-library';

import { createRotationHandler } from './create-rotation.server';

export const createRotation = createServerFn({
  method: 'POST',
})
  .middleware([authRequiredMiddleware])
  .inputValidator(CreateRotationRequestSchema)
  .handler(async ({ data, context }) => {
    return createRotationHandler(data, context.session.user.id);
  });

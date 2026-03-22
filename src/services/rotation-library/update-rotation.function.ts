import { createServerFn } from '@tanstack/react-start';

import { authRequiredMiddleware } from '@/middleware/auth';
import { UpdateRotationRequestSchema } from '@/schemas/rotation-library';

import { updateRotationHandler } from './update-rotation.server';

export const updateRotation = createServerFn({
  method: 'POST',
})
  .middleware([authRequiredMiddleware])
  .inputValidator(UpdateRotationRequestSchema)
  .handler(async ({ data, context }) => {
    return updateRotationHandler(data, context.session.user);
  });

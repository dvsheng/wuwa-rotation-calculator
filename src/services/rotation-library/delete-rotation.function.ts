import { createServerFn } from '@tanstack/react-start';

import { authRequiredMiddleware } from '@/middleware/auth';
import { DeleteRotationRequestSchema } from '@/schemas/rotation-library';

import { deleteRotationHandler } from './delete-rotation.server';

export const deleteRotation = createServerFn({
  method: 'POST',
})
  .middleware([authRequiredMiddleware])
  .inputValidator(DeleteRotationRequestSchema)
  .handler(async ({ data, context }) => {
    return deleteRotationHandler(data, context.session.user.id);
  });

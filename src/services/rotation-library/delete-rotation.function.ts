import { createServerFn } from '@tanstack/react-start';

import { authMiddleware } from '@/middleware/auth';
import { DeleteRotationRequestSchema } from '@/schemas/rotation-library';

import { deleteRotationHandler } from './delete-rotation.server';

export const deleteRotation = createServerFn({
  method: 'POST',
})
  .middleware([authMiddleware])
  .inputValidator(DeleteRotationRequestSchema)
  .handler(async ({ data }) => {
    return deleteRotationHandler(data);
  });

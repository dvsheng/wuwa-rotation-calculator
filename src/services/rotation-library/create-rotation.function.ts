import { createServerFn } from '@tanstack/react-start';

import { authMiddleware } from '@/middleware/auth';
import { CreateRotationRequestSchema } from '@/schemas/rotation-library';

import { createRotationHandler } from './create-rotation.server';

export const createRotation = createServerFn({
  method: 'POST',
})
  .middleware([authMiddleware])
  .inputValidator(CreateRotationRequestSchema)
  .handler(async ({ data }) => {
    return createRotationHandler(data);
  });

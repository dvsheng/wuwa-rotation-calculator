import { createServerFn } from '@tanstack/react-start';

import { CreateRotationRequestSchema } from '@/schemas/rotation-library';

import { createRotationHandler } from './create-rotation.server';

export const createRotation = createServerFn({
  method: 'POST',
})
  .inputValidator(CreateRotationRequestSchema)
  .handler(async ({ data }) => {
    return createRotationHandler(data);
  });

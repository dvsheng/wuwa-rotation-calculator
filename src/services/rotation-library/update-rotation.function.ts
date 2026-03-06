import { createServerFn } from '@tanstack/react-start';

import { UpdateRotationRequestSchema } from '@/schemas/rotation-library';

import { updateRotationHandler } from './update-rotation.server';

export const updateRotation = createServerFn({
  method: 'POST',
})
  .inputValidator(UpdateRotationRequestSchema)
  .handler(async ({ data }) => {
    return updateRotationHandler(data);
  });

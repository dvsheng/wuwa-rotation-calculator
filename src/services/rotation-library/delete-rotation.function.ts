import { createServerFn } from '@tanstack/react-start';

import { DeleteRotationRequestSchema } from '@/schemas/rotation-library';

import { deleteRotationHandler } from './delete-rotation.server';

export const deleteRotation = createServerFn({
  method: 'POST',
})
  .inputValidator(DeleteRotationRequestSchema)
  .handler(async ({ data }) => {
    return deleteRotationHandler(data);
  });

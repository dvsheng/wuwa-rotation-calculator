import { createServerFn } from '@tanstack/react-start';

import { adminRequiredMiddleware } from '@/middleware/auth';
import {
  CreateCapabilityRequestSchema,
  DeleteCapabilityRequestSchema,
  UpdateCapabilityRequestSchema,
} from '@/schemas/admin';

import {
  createCapabilityHandler,
  deleteCapabilityHandler,
  updateCapabilityHandler,
} from './capability-commands.server';

export const updateCapability = createServerFn({
  method: 'POST',
})
  .middleware([adminRequiredMiddleware])
  .inputValidator(UpdateCapabilityRequestSchema)
  .handler(async ({ data }) => {
    return updateCapabilityHandler(data);
  });

export const createCapability = createServerFn({
  method: 'POST',
})
  .middleware([adminRequiredMiddleware])
  .inputValidator(CreateCapabilityRequestSchema)
  .handler(async ({ data }) => {
    return createCapabilityHandler(data);
  });

export const deleteCapability = createServerFn({
  method: 'POST',
})
  .middleware([adminRequiredMiddleware])
  .inputValidator(DeleteCapabilityRequestSchema)
  .handler(async ({ data }) => {
    return deleteCapabilityHandler(data);
  });

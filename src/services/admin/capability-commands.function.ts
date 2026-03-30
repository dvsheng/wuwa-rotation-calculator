import { createServerFn } from '@tanstack/react-start';

import { authRequiredMiddleware } from '@/middleware/auth';
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
  .middleware([authRequiredMiddleware])
  .inputValidator(UpdateCapabilityRequestSchema)
  .handler(async ({ data }) => {
    return updateCapabilityHandler(data);
  });

export const createCapability = createServerFn({
  method: 'POST',
})
  .middleware([authRequiredMiddleware])
  .inputValidator(CreateCapabilityRequestSchema)
  .handler(async ({ data }) => {
    return createCapabilityHandler(data);
  });

export const deleteCapability = createServerFn({
  method: 'POST',
})
  .middleware([authRequiredMiddleware])
  .inputValidator(DeleteCapabilityRequestSchema)
  .handler(async ({ data }) => {
    return deleteCapabilityHandler(data);
  });

import { createServerFn } from '@tanstack/react-start';

import { authRequiredMiddleware } from '@/middleware/auth';
import { AdminUpdateCapabilityRequestSchema } from '@/schemas/admin';

import { updateAdminCapabilityHandler } from './update-admin-capability.server';

export const updateAdminCapability = createServerFn({
  method: 'POST',
})
  .middleware([authRequiredMiddleware])
  .inputValidator(AdminUpdateCapabilityRequestSchema)
  .handler(async ({ data }) => {
    return updateAdminCapabilityHandler(data);
  });

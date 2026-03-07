import { createServerFn } from '@tanstack/react-start';

import { authMiddleware } from '@/middleware/auth';
import { AdminUpdateCapabilityRequestSchema } from '@/schemas/admin';

import { updateAdminCapabilityHandler } from './update-admin-capability.server';

export const updateAdminCapability = createServerFn({
  method: 'POST',
})
  .middleware([authMiddleware])
  .inputValidator(AdminUpdateCapabilityRequestSchema)
  .handler(async ({ data }) => {
    return updateAdminCapabilityHandler(data);
  });

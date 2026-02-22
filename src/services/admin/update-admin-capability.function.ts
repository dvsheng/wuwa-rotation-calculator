import { createServerFn } from '@tanstack/react-start';

import { AdminUpdateCapabilityRequestSchema } from '@/schemas/admin';

import { updateAdminCapabilityHandler } from './update-admin-capability.server';

export const updateAdminCapability = createServerFn({
  method: 'POST',
})
  .inputValidator(AdminUpdateCapabilityRequestSchema)
  .handler(async ({ data }) => {
    return updateAdminCapabilityHandler(data);
  });

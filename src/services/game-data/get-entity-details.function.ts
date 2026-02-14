import { createServerFn } from '@tanstack/react-start';

import { GetEntityDetailsRequestSchema } from '@/schemas/game-data-service';

import {
  getClientEntityByHakushinIdHandler,
  getEntityByHakushinIdHandler,
} from './get-entity-details.server';

export const getEntityByHakushinId = createServerFn({
  method: 'GET',
})
  .inputValidator(GetEntityDetailsRequestSchema)
  .handler(async ({ data }) => {
    return getEntityByHakushinIdHandler(data);
  });

export const getClientEntityByHakushinId = createServerFn({
  method: 'GET',
})
  .inputValidator(GetEntityDetailsRequestSchema)
  .handler(async ({ data }) => {
    return getClientEntityByHakushinIdHandler(data);
  });

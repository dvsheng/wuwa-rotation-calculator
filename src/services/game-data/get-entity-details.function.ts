import { createServerFn } from '@tanstack/react-start';

import { GetEntityDetailsRequestSchema } from '@/schemas/game-data-service';

import {
  getClientEntityByGameIdHandler,
  getEntityByGameIdHandler,
} from './get-entity-details.server';

export const getEntityByHakushinId = createServerFn({
  method: 'GET',
})
  .inputValidator(GetEntityDetailsRequestSchema)
  .handler(async ({ data }) => {
    return await getEntityByGameIdHandler(data);
  });

export const getClientEntityByHakushinId = createServerFn({
  method: 'GET',
})
  .inputValidator(GetEntityDetailsRequestSchema)
  .handler(async ({ data }) => {
    return await getClientEntityByGameIdHandler(data);
  });

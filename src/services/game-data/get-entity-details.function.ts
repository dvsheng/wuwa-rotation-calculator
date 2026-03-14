import { createServerFn } from '@tanstack/react-start';

import { GetEntityDetailsRequestSchema } from '@/schemas/game-data-service';

import {
  getClientEntityByIdHandler,
  getEntityByIdHandler,
} from './get-entity-details.server';

export const getEntityById = createServerFn({
  method: 'GET',
})
  .inputValidator(GetEntityDetailsRequestSchema)
  .handler(async ({ data }) => {
    return await getEntityByIdHandler(data);
  });

export const getClientEntityById = createServerFn({
  method: 'GET',
})
  .inputValidator(GetEntityDetailsRequestSchema)
  .handler(async ({ data }) => {
    return await getClientEntityByIdHandler(data);
  });

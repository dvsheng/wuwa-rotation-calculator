import { createServerFn } from '@tanstack/react-start';

import { GetEchoStatsRequestSchema } from '@/schemas/game-data-service';

import { getEchoStatsHandler } from './get-echo-stats.server';

export const getEchoStats = createServerFn({
  method: 'GET',
})
  .inputValidator(GetEchoStatsRequestSchema)
  .handler(async ({ data }) => {
    return getEchoStatsHandler(data);
  });

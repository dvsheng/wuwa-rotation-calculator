import { createServerFn } from '@tanstack/react-start';

import { listRotationsHandler } from './list-rotations.server';

export const listRotations = createServerFn({
  method: 'GET',
}).handler(async () => {
  return listRotationsHandler();
});

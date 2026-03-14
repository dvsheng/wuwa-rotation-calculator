import { createStart } from '@tanstack/react-start';

import { serverFunctionLogger } from '@/middleware/server-function-logger';

export const startInstance = createStart(() => ({
  functionMiddleware: [serverFunctionLogger],
}));

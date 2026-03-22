import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';

import { auth } from '@/lib/auth';

export interface AuthContext {
  user: {
    email: string;
    id: string;
    username?: string;
  };
}

export const authRequiredMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      throw new Error('Unauthorized');
    }
    return next({
      context: {
        session,
      },
    });
  },
);

export const authOptionalMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    return next({
      context: {
        session,
      },
    });
  },
);

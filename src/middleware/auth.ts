import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';

import { auth } from '@/lib/auth';

export interface AuthContext {
  user: { sub: string; username: string };
}

export const authMiddleware = createMiddleware({ type: 'function' })
  .client(async ({ next }) => next())
  .server(async ({ next }) => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      throw new Error('Unauthorized');
    }

    return next({
      context: {
        user: {
          sub: session.user.id,
          username: session.user.email ?? session.user.id,
        },
      },
    });
  });
